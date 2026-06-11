import { PROVIDER_CONFIGS } from "@/constant/ai";
import type {
  AiProvider,
  ChatMessage,
  ChatRequest,
  ChatResponse,
} from "../types";

const REQUEST_TIMEOUT_MS = 60_000;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Anthropic Messages API response shape (only the fields we use).
interface AnthropicApiResponse {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  error?: {
    type?: string;
    message?: string;
  };
}

// AI provider backed by Anthropic's Messages API. Uses native fetch — no SDK dependency.
//
// Two shape differences from OpenAI-style APIs are handled here:
//  1. The system prompt is a top-level `system` field, not a message with role "system".
//  2. There is no native JSON mode; when jsonMode is requested we prefill the
//     assistant turn with "{" so the model is forced to emit a raw JSON object.
export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  private readonly apiKey: string;
  private readonly baseUrl: string;

  // Creates an AnthropicProvider. apiKey: Anthropic key (sk-ant-...). baseUrl: override for the messages endpoint.
  constructor(apiKey: string, baseUrl = ANTHROPIC_API_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // Sends a message request to Anthropic and returns the text content. Throws Error with status on HTTP/API failures.
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Anthropic takes the system prompt separately from the conversation turns.
      const systemPrompt = request.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");

      const turns: ChatMessage[] = request.messages.filter(
        (m) => m.role !== "system",
      );

      const messages = turns.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      // Prefill the assistant turn with "{" to force a raw JSON object (no
      // markdown fences / preamble). We re-attach the "{" to the response below.
      if (request.jsonMode) {
        messages.push({ role: "assistant", content: "{" });
      }

      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          system: systemPrompt || undefined,
          messages,
          temperature: request.temperature ?? 0.3,
          max_tokens: request.maxTokens ?? 2048,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const error = new Error(
          `Anthropic API ${res.status}: ${res.statusText} — ${errorBody}`,
        );
        (error as unknown as Record<string, unknown>).status = res.status;
        throw error;
      }

      const data = (await res.json()) as AnthropicApiResponse;

      if (data.error) {
        throw new Error(
          `Anthropic API error: ${data.error.message ?? JSON.stringify(data.error)}`,
        );
      }

      const text = data.content
        ?.filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("");

      if (!text) {
        throw new Error("No response content from Anthropic API");
      }

      // Re-attach the prefilled "{" so callers receive a complete JSON object.
      return { content: request.jsonMode ? `{${text}` : text };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Factory: create AnthropicProvider from env. Throws if ANTHROPIC_API_KEY is not set.
export function createAnthropicProvider(): AnthropicProvider {
  const config = PROVIDER_CONFIGS.anthropic;
  const apiKey = process.env[config.apiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      `${config.apiKeyEnvVar} is not set. Get a key at ${config.apiKeySignupUrl}`,
    );
  }

  return new AnthropicProvider(apiKey);
}
