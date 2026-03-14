import type { ProviderName } from "@/constant/ai";
import { getProvider, getProviderConfig } from "./registry";
import type { FileChange, ReviewResult } from "./types";
import { ReviewResultSchema } from "./types";

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
      "line": "number - line number",
      "severity": "critical | high | medium | low",
      "category": "bug | security | performance | style | suggestion",
      "message": "string - what the issue is",
      "suggestion": "string (optional) - how to fix it"
    }
  ]
}

Respond ONLY with the JSON object, no markdown fences or extra text.`;

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

// Sleeps for the given number of milliseconds.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

// Reviews a single chunk of files via AI provider with retry and model fallback.
async function reviewSingleChunk(
  prTitle: string,
  files: FileChange[],
  providerName?: ProviderName,
): Promise<ReviewResult> {
  const userPrompt = buildUserPrompt(prTitle, files);

  if (!userPrompt.includes("```diff")) {
    return {
      summary: "No code changes to review (binary files or empty diff).",
      riskScore: 0,
      comments: [],
    };
  }

  const provider = getProvider(providerName);
  const config = getProviderConfig(providerName ?? provider.name as ProviderName);
  const modelsToTry = [config.models.primaryModel, config.models.fallbackModel];

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
            { role: "system", content: SYSTEM_PROMPT },
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

        if (
          (status === 429 || status === 413) &&
          attempt === 0 &&
          model === config.models.primaryModel
        ) {
          console.warn(
            `[AI Review] Primary model hit ${status}. Switching to fallback model...`,
          );
          break;
        }

        const isRetryable = status === 429 || status === 413 || status === 503;
        if (isRetryable && attempt < MAX_RETRIES) {
          const delayMs = BASE_RETRY_DELAY_MS * 2 ** attempt;
          console.warn(
            `[AI Review] ${status} error. Waiting ${Math.round(delayMs / 1000)}s before retry...`,
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
export async function reviewCode(
  prTitle: string,
  files: FileChange[],
  providerName?: ProviderName,
): Promise<ReviewResult> {
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
    results.push(await reviewSingleChunk(prTitle, chunks[i], providerName));
  }

  return mergeResults(results);
}
