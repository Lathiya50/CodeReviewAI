import type { AiProviderConfig } from "@/server/services/ai/types";

// Centralized AI provider configs. To add: 1) add config here, 2) create provider in providers/, 3) register in registry.ts.
export const PROVIDER_CONFIGS = {
  groq: {
    name: "groq",
    models: {
      // Llama 3.3 70B — smarter, 30 RPM / 1,000 RPD free tier.
      primaryModel: "llama-3.3-70b-versatile",
      // Llama 3.1 8B — lighter, 30 RPM / 14,400 RPD free tier.
      fallbackModel: "llama-3.1-8b-instant",
    },
    apiKeyEnvVar: "GROQ_API_KEY",
    apiKeySignupUrl: "https://console.groq.com/keys",
  },
  openai: {
    name: "openai",
    models: {
      // GPT-4o-mini — fast and affordable.
      primaryModel: "gpt-4o-mini",
      // GPT-3.5 Turbo — cheaper fallback.
      fallbackModel: "gpt-3.5-turbo",
    },
    apiKeyEnvVar: "OPENAI_API_KEY",
    apiKeySignupUrl: "https://platform.openai.com/api-keys",
  },
} as const satisfies Record<string, AiProviderConfig>;

// Union type of all registered provider names.
export type ProviderName = keyof typeof PROVIDER_CONFIGS;

// Default provider — free tier when none specified.
export const DEFAULT_PROVIDER: ProviderName = "groq";
