import { PROVIDER_CONFIGS } from "@/constant/ai";
import OpenAI from "openai";
import type { AiProvider, ChatRequest, ChatResponse } from "../types";

const REQUEST_TIMEOUT_MS = 60_000;

// AI provider backed by the official OpenAI SDK. Works with OpenAI API and OpenAI-compatible endpoints (OpenRouter, Azure) via baseURL.
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";
  private readonly client: OpenAI;

  // Creates an OpenAiProvider. apiKey: OpenAI key (sk-...). baseURL: optional override for compatible endpoints.
  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  // Sends chat completion via OpenAI SDK and returns text content. Throws with status on API failures.
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        response_format: request.jsonMode ? { type: "json_object" } : undefined,
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 2048,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content from OpenAI API");
      }

      return { content };
    } catch (err) {
      if (err instanceof OpenAI.APIError) {
        const error = new Error(
          `OpenAI API ${err.status}: ${err.message}`,
        );
        (error as unknown as Record<string, unknown>).status = err.status;
        throw error;
      }
      throw err;
    }
  }
}

// Factory: create OpenAiProvider from env. Supports OPENAI_BASE_URL. Throws if OPENAI_API_KEY is not set.
export function createOpenAiProvider(): OpenAiProvider {
  const config = PROVIDER_CONFIGS.openai;
  const apiKey = process.env[config.apiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      `${config.apiKeyEnvVar} is not set. Get a key at ${config.apiKeySignupUrl}`,
    );
  }

  const baseURL = process.env.OPENAI_BASE_URL || undefined;
  return new OpenAiProvider(apiKey, baseURL);
}
