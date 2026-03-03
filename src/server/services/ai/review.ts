import type { ProviderName } from "@/constant/ai";
import { getProvider, getProviderConfig } from "./registry";
import type { FileChange, ReviewResult } from "./types";
import { ReviewResultSchema } from "./types";

// ─── Constants ───────────────────────────────────────────────────────────────

// Max retries on transient failures (429 / 503).
const MAX_RETRIES = 3;
// Base delay between retries in ms. Doubles each attempt.
const BASE_RETRY_DELAY_MS = 5_000;

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

// Builds the user prompt from PR title and file diffs.
function buildUserPrompt(prTitle: string, files: FileChange[]): string {
  const diffContent = files
    .filter((f) => f.patch)
    .map(
      (f) =>
        `### ${f.filename} (${f.status})\n\`\`\`diff\n${f.patch}\n\`\`\``,
    )
    .join("\n\n");

  return `Review this pull request:\n\n**Title:** ${prTitle}\n\n**Changes:**\n${diffContent}`;
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
      const match = msg.match(/\b(429|503)\b/);
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

// Reviews PR code via AI provider. Tries primary model then fallback on 429; up to MAX_RETRIES with backoff. Validates JSON. Throws after retries exhausted.
export async function reviewCode(
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

        if (status === 429 && attempt === 0 && model === config.models.primaryModel) {
          console.warn(
            `[AI Review] Primary model rate-limited (429). Switching to fallback model...`,
          );
          break;
        }

        const isRetryable = status === 429 || status === 503;
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
