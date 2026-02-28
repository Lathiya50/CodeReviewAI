import { PROVIDER_CONFIGS } from "@/constant/ai";
import type { AiProvider, ChatRequest, ChatResponse } from "../types";

const REQUEST_TIMEOUT_MS = 30_000;

// Groq chat-completion response shape (only the fields we use).
interface GroqApiResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    code?: string | number;
    type?: string;
  };
}

// AI provider backed by Groq's OpenAI-compatible REST API. Uses native fetch — no SDK dependency.
export class GroqProvider implements AiProvider {
  readonly name = "groq";
  private readonly apiKey: string;
  private readonly baseUrl: string;

  // Creates a GroqProvider instance. apiKey: Groq API key (gsk_...). baseUrl: override for chat completions endpoint.
  constructor(apiKey: string, baseUrl = "https://api.groq.com/openai/v1/chat/completions") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // Sends a chat completion request to Groq and returns the text content. Throws Error with status on HTTP/API failures.
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          response_format: request.jsonMode ? { type: "json_object" } : undefined,
          temperature: request.temperature ?? 0.3,
          max_tokens: request.maxTokens ?? 2048,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const error = new Error(
          `Groq API ${res.status}: ${res.statusText} — ${errorBody}`,
        );
        (error as unknown as Record<string, unknown>).status = res.status;
        throw error;
      }

      const data = (await res.json()) as GroqApiResponse;

      if (data.error) {
        throw new Error(
          `Groq API error: ${data.error.message ?? JSON.stringify(data.error)}`,
        );
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No response content from Groq API");
      }

      return { content };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Factory: create GroqProvider from env. Throws if GROQ_API_KEY is not set.
export function createGroqProvider(): GroqProvider {
  const config = PROVIDER_CONFIGS.groq;
  const apiKey = process.env[config.apiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      `${config.apiKeyEnvVar} is not set. Get a free key at ${config.apiKeySignupUrl}`,
    );
  }

  return new GroqProvider(apiKey);
}
