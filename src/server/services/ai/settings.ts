import type { AiProvider as PrismaAiProvider } from "@prisma/client";
import { db } from "@/server/db";
import {
  DEFAULT_PROVIDER,
  PROVIDER_CONFIGS,
  type ProviderName,
} from "@/constant/ai";
import { decryptSecret } from "@/server/services/crypto";
import type { ResolvedAiConfig } from "./types";

// Maps the Prisma `AiProvider` enum (GROQ/OPENAI/ANTHROPIC) to the lowercase
// internal `ProviderName` keys used by PROVIDER_CONFIGS / the registry.
const PRISMA_TO_PROVIDER_NAME: Record<PrismaAiProvider, ProviderName> = {
  GROQ: "groq",
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GEMINI: "gemini",
};

// Maps an internal ProviderName back to the Prisma enum value.
export const PROVIDER_NAME_TO_PRISMA: Record<ProviderName, PrismaAiProvider> = {
  groq: "GROQ",
  openai: "OPENAI",
  anthropic: "ANTHROPIC",
  gemini: "GEMINI",
};

// Returns true if `model` is in the selectable list for the given provider.
export function isModelAllowed(provider: ProviderName, model: string): boolean {
  const models: readonly string[] = PROVIDER_CONFIGS[provider].availableModels;
  return models.includes(model);
}

/**
 * Resolves the effective AI config for a user's review.
 *
 * Rules (see epic "Effective-Config Resolution"):
 *  - No settings row → app defaults (default Groq provider).
 *  - model is used only if it's in the provider's availableModels list.
 *  - The saved key is decrypted and used only if it belongs to the selected
 *    provider. Decryption failures (e.g. key rotation) fall back to the app key.
 *  - customInstructions are passed through (length-capped at injection time).
 *
 * The decrypted key is returned for immediate use; callers must not persist it.
 */
export async function resolveUserAiConfig(
  userId: string,
): Promise<ResolvedAiConfig> {
  const settings = await db.userAiSettings.findUnique({ where: { userId } });

  if (!settings) {
    return { provider: DEFAULT_PROVIDER };
  }

  const provider = PRISMA_TO_PROVIDER_NAME[settings.provider] ?? DEFAULT_PROVIDER;

  const model =
    settings.model && isModelAllowed(provider, settings.model)
      ? settings.model
      : undefined;

  let apiKey: string | undefined;
  const keyBelongsToProvider =
    settings.apiKeyCiphertext &&
    settings.apiKeyProvider &&
    PRISMA_TO_PROVIDER_NAME[settings.apiKeyProvider] === provider;

  if (keyBelongsToProvider && settings.apiKeyCiphertext) {
    try {
      apiKey = decryptSecret(settings.apiKeyCiphertext);
    } catch {
      // Decryption failed (rotated/invalid SETTINGS_ENCRYPTION_KEY or tampered
      // blob). Treat as "no usable key" and fall back to the app's env key.
      console.warn(
        `[AI Settings] Failed to decrypt stored key for user ${userId}; falling back to app key.`,
      );
      apiKey = undefined;
    }
  }

  return {
    provider,
    model,
    apiKey,
    customInstructions: settings.customInstructions ?? undefined,
  };
}
