import { DEFAULT_PROVIDER } from "@/constant/ai";
import { getProviderConfig, instantiateProvider } from "./registry";
import type { FileChange, ResolvedAiConfig, ReviewResult } from "./types";
import { ReviewResultSchema } from "./types";

// Max characters of user-provided custom instructions injected into the prompt.
const MAX_CUSTOM_INSTRUCTIONS_CHARS = 4_000;

// ─── Constants ───────────────────────────────────────────────────────────────

// Max retries on transient failures (413 / 429 / 503).
const MAX_RETRIES = 3;
// Base delay between retries in ms. Doubles each attempt.
const BASE_RETRY_DELAY_MS = 5_000;
// Max characters for a single file patch before truncation (~750 tokens).
const MAX_PATCH_CHARS = 3_000;
// Max total prompt characters per chunk (~2000 tokens, well under 12K TPM limit).
const MAX_PROMPT_CHARS = 8_000;

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided pull request diff and provide a structured review.

Your review should:
1. Identify bugs, security issues, performance problems, and code style issues
2. Provide a brief summary of the changes
3. Assign a risk score (0-100) based on the complexity and potential issues
4. Give specific, actionable feedback with line numbers
5. For each issue, extract the problematic code snippet and provide the fixed version

Severity guide:
- critical: Security vulnerabilities, data loss, crashes
- high: Bugs that will cause issues in production
- medium: Should be fixed but won't break things
- low: Style issues, minor improvements

Be concise but specific. Reference exact line numbers from the diff.

IMPORTANT: You MUST respond with valid JSON matching this exact schema:
{
  "summary": "string - brief summary of changes and overall assessment",
  "riskScore": "number - risk score from 0 to 100",
  "comments": [
    {
      "file": "string - file path",
      "line": "number - line number where the issue starts",
      "severity": "critical | high | medium | low",
      "category": "bug | security | performance | style | suggestion",
      "message": "string - what the issue is",
      "suggestion": "string (optional) - brief text description of how to fix it",
      "oldCode": "string (optional) - the problematic code snippet (1-10 lines max)",
      "newCode": "string (optional) - the suggested fixed code snippet",
      "lineStart": "number (optional) - starting line number of the code snippet",
      "lineEnd": "number (optional) - ending line number of the code snippet",
      "context": "string (optional) - additional context or explanation for the fix"
    }
  ]
}

Code extraction rules:
- oldCode: Extract the exact problematic lines from the diff (include 1-10 lines of context)
- newCode: Provide the corrected version of oldCode with your suggested fix applied
- lineStart/lineEnd: Reference the line numbers from the original file
- Only include oldCode/newCode when you have a concrete code fix to suggest

Respond ONLY with the JSON object, no markdown fences or extra text.`;

// Builds the system prompt, optionally injecting user-provided custom
// instructions inside a clearly delimited block. The JSON-output contract is
// restated last so house rules can never override the structured-output format.
function buildSystemPrompt(customInstructions?: string): string {
  const trimmed = customInstructions?.trim();
  if (!trimmed) return SYSTEM_PROMPT;

  const capped = trimmed.slice(0, MAX_CUSTOM_INSTRUCTIONS_CHARS);

  return `${SYSTEM_PROMPT}

## Additional reviewer instructions (user-provided)
The following are house rules from the user. Apply them where they do not conflict with the JSON output contract above.
<instructions>
${capped}
</instructions>

Reminder: Respond ONLY with the JSON object described above — no markdown fences or extra text.`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Builds the user prompt from PR title and file diffs, truncating large patches.
function buildUserPrompt(prTitle: string, files: FileChange[]): string {
  const diffContent = files
    .filter((f) => f.patch)
    .map((f) => {
      const patch =
        f.patch!.length > MAX_PATCH_CHARS
          ? `${f.patch!.slice(0, MAX_PATCH_CHARS)}\n... (truncated)`
          : f.patch!;
      return `### ${f.filename} (${f.status})\n\`\`\`diff\n${patch}\n\`\`\``;
    })
    .join("\n\n");

  return `Review this pull request:\n\n**Title:** ${prTitle}\n\n**Changes:**\n${diffContent}`;
}

// Splits files into chunks whose prompts stay under MAX_PROMPT_CHARS.
function chunkFiles(files: FileChange[]): FileChange[][] {
  const filesWithPatch = files.filter((f) => f.patch);
  if (filesWithPatch.length === 0) return [files];

  const chunks: FileChange[][] = [];
  let currentChunk: FileChange[] = [];
  let currentSize = 0;

  for (const file of filesWithPatch) {
    const patchLen = Math.min(file.patch!.length, MAX_PATCH_CHARS);
    // Account for the markdown wrapper around each file diff
    const entrySize = patchLen + file.filename.length + 50;

    if (currentChunk.length > 0 && currentSize + entrySize > MAX_PROMPT_CHARS) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(file);
    currentSize += entrySize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Merges multiple chunked review results into a single ReviewResult.
function mergeResults(results: ReviewResult[]): ReviewResult {
  if (results.length === 1) return results[0];

  return {
    summary: results.map((r) => r.summary).join("\n\n"),
    riskScore: Math.max(...results.map((r) => r.riskScore)),
    comments: results.flatMap((r) => r.comments),
  };
}

// Extracts HTTP status code from various error shapes.
function extractHttpStatus(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    if (typeof e.status === "number") return e.status;
    if (typeof e.code === "number") return e.code;
    if (typeof e.httpStatusCode === "number") return e.httpStatusCode;
    const msg = e.message;
    if (typeof msg === "string") {
      const match = msg.match(/\b(413|429|503)\b/);
      if (match) return Number.parseInt(match[1], 10);
    }
  }
  return undefined;
}

// Transient network failure codes/markers that warrant a retry. These are
// connectivity errors (DNS, connect/socket timeouts, resets) with no HTTP
// status — `fetch` rejects before the server is ever reached.
const TRANSIENT_NETWORK_MARKERS = [
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
];

// Detects transient network errors (connect/read timeouts, DNS, resets, and our
// own AbortController timeout) that have no HTTP status but should be retried.
function isTransientNetworkError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;

  // Our REQUEST_TIMEOUT_MS abort surfaces as an AbortError.
  if (e.name === "AbortError" || e.name === "TimeoutError") return true;

  // undici raises `TypeError: fetch failed` and attaches the real cause.
  const cause = e.cause as Record<string, unknown> | undefined;
  const code = (e.code ?? cause?.code) as string | undefined;
  if (typeof code === "string" && TRANSIENT_NETWORK_MARKERS.includes(code)) {
    return true;
  }

  const haystacks = [e.message, cause?.message, cause?.code, e.name];
  return haystacks.some(
    (h) =>
      typeof h === "string" &&
      (h === "fetch failed" ||
        TRANSIENT_NETWORK_MARKERS.some((m) => h.includes(m))),
  );
}

// Sleeps for the given number of milliseconds.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

// Reviews a single chunk of files via AI provider with retry and model fallback.
async function reviewSingleChunk(
  prTitle: string,
  files: FileChange[],
  config: ResolvedAiConfig,
): Promise<ReviewResult> {
  const userPrompt = buildUserPrompt(prTitle, files);

  if (!userPrompt.includes("```diff")) {
    return {
      summary: "No code changes to review (binary files or empty diff).",
      riskScore: 0,
      comments: [],
    };
  }

  const provider = instantiateProvider(config.provider, config.apiKey);
  const providerConfig = getProviderConfig(config.provider);
  const systemPrompt = buildSystemPrompt(config.customInstructions);

  // Primary = user-selected model (if any) else the provider default. Fallback
  // stays the provider's configured fallback. Dedupe so we don't retry the same model.
  const primaryModel = config.model ?? providerConfig.models.primaryModel;
  const modelsToTry = Array.from(
    new Set([primaryModel, providerConfig.models.fallbackModel]),
  );

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[AI Review] provider=${provider.name}, model=${model}, attempt ${attempt + 1}/${MAX_RETRIES + 1}`,
        );

        const response = await provider.chat({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          maxTokens: 2048,
          jsonMode: true,
        });

        const parsed = JSON.parse(response.content);
        return ReviewResultSchema.parse(parsed);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const status = extractHttpStatus(err);
        const networkError = isTransientNetworkError(err);

        if (
          (status === 429 || status === 413) &&
          attempt === 0 &&
          model === primaryModel &&
          modelsToTry.length > 1
        ) {
          console.warn(
            `[AI Review] Primary model hit ${status}. Switching to fallback model...`,
          );
          break;
        }

        const isRetryable =
          status === 429 || status === 413 || status === 503 || networkError;
        if (isRetryable && attempt < MAX_RETRIES) {
          const delayMs = BASE_RETRY_DELAY_MS * 2 ** attempt;
          const reason = status ? `${status} error` : "network error";
          console.warn(
            `[AI Review] ${reason} (${lastError.message}). Waiting ${Math.round(delayMs / 1000)}s before retry...`,
          );
          await sleep(delayMs);
          continue;
        }

        if (!isRetryable) {
          throw lastError;
        }
      }
    }
  }

  throw lastError ?? new Error("AI review failed after all retries");
}

// Reviews PR code via AI provider. Chunks large diffs to avoid payload limits. Tries primary model then fallback; up to MAX_RETRIES with backoff. Validates JSON. Throws after retries exhausted.
// `config` carries the resolved provider/model/key/instructions for this user (defaults to the app's default provider).
export async function reviewCode(
  prTitle: string,
  files: FileChange[],
  config?: ResolvedAiConfig,
): Promise<ReviewResult> {
  const resolved: ResolvedAiConfig = config ?? { provider: DEFAULT_PROVIDER };
  const chunks = chunkFiles(files);

  if (chunks.length > 1) {
    console.log(
      `[AI Review] Large PR detected. Split into ${chunks.length} chunks.`,
    );
  }

  const results: ReviewResult[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(
      `[AI Review] Reviewing chunk ${i + 1}/${chunks.length} (${chunks[i].length} files)`,
    );
    results.push(await reviewSingleChunk(prTitle, chunks[i], resolved));
  }

  return mergeResults(results);
}
