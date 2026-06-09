import { GoogleGenAI } from "@google/genai";
import { PROVIDER_CONFIGS } from "@/constant/ai";
import type { AiProvider, ChatRequest, ChatResponse } from "../types";

// AI provider backed by the official Google Gen AI SDK (Gemini API).
//
// Two shape differences from OpenAI-style APIs are handled here:
//  1. The system prompt is passed via `config.systemInstruction`, not as a message.
//  2. JSON output is requested with `responseMimeType: "application/json"` instead
//     of a `response_format` field.
export class GeminiProvider implements AiProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;

  // Creates a GeminiProvider. apiKey: Google AI Studio key (AIza...).
  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  // Sends a generateContent request to Gemini and returns the text content. Throws Error with status on API failures.
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Gemini takes the system prompt separately from the conversation turns.
    const systemInstruction = request.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const response = await this.client.models.generateContent({
      model: request.model,
      contents,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: request.temperature ?? 0.3,
        maxOutputTokens: request.maxTokens ?? 2048,
        responseMimeType: request.jsonMode ? "application/json" : undefined,
      },
    });

    const content = response.text;
    if (!content) {
      throw new Error("No response content from Gemini API");
    }

    return { content };
  }
}

// Factory: create GeminiProvider from env. Throws if GEMINI_API_KEY is not set.
export function createGeminiProvider(): GeminiProvider {
  const config = PROVIDER_CONFIGS.gemini;
  const apiKey = process.env[config.apiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      `${config.apiKeyEnvVar} is not set. Get a key at ${config.apiKeySignupUrl}`,
    );
  }

  return new GeminiProvider(apiKey);
}
