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
    availableModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-120b",
    ],
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
    availableModels: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    apiKeyEnvVar: "OPENAI_API_KEY",
    apiKeySignupUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    name: "anthropic",
    models: {
      // Claude Opus 4.8 — most capable.
      primaryModel: "claude-opus-4-8",
      // Claude Haiku 4.5 — fast, cheaper fallback.
      fallbackModel: "claude-haiku-4-5",
    },
    availableModels: ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"],
    apiKeyEnvVar: "ANTHROPIC_API_KEY",
    apiKeySignupUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    name: "gemini",
    models: {
      // Gemini 2.5 Flash — fast and capable, generous free tier.
      primaryModel: "gemini-2.5-flash",
      // Gemini 2.0 Flash — lighter fallback.
      fallbackModel: "gemini-2.0-flash",
    },
    availableModels: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    apiKeyEnvVar: "GEMINI_API_KEY",
    apiKeySignupUrl: "https://aistudio.google.com/apikey",
  },
} as const satisfies Record<string, AiProviderConfig>;

// Union type of all registered provider names.
export type ProviderName = keyof typeof PROVIDER_CONFIGS;

// Default provider — free tier when none specified.
export const DEFAULT_PROVIDER: ProviderName = "groq";
