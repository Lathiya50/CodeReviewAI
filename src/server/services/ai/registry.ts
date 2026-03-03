import { DEFAULT_PROVIDER, PROVIDER_CONFIGS, type ProviderName } from "@/constant/ai";
import type { AiProvider, AiProviderConfig } from "./types";

type ProviderFactory = () => AiProvider;

const providerFactories = new Map<string, ProviderFactory>();

// Registers a provider factory under the given name. Call once per provider at module-load time.
export function registerProvider(name: string, factory: ProviderFactory): void {
  providerFactories.set(name, factory);
}

// Returns the list of registered provider names.
export function getRegisteredProviders(): string[] {
  return Array.from(providerFactories.keys());
}

// Returns AiProviderConfig for the given provider name. Throws if no config exists.
export function getProviderConfig(name: ProviderName): AiProviderConfig {
  const config = PROVIDER_CONFIGS[name];
  if (!config) {
    throw new Error(
      `No configuration found for provider "${name}". Available: ${Object.keys(PROVIDER_CONFIGS).join(", ")}`,
    );
  }
  return config;
}

// Singleton cache — one instance per provider name, reused across calls.
const providerCache = new Map<string, AiProvider>();

// Resolves AI provider by name (default groq). Cached per name. Throws if provider not registered.
export function getProvider(name: ProviderName = DEFAULT_PROVIDER): AiProvider {
  const cached = providerCache.get(name);
  if (cached) {
    return cached;
  }

  const factory = providerFactories.get(name);
  if (!factory) {
    const available = getRegisteredProviders().join(", ");
    throw new Error(
      `AI provider "${name}" is not registered. Available providers: ${available}.`,
    );
  }

  const provider = factory();
  providerCache.set(name, provider);
  return provider;
}

// Clears all cached provider instances. Useful for testing or when API keys change at runtime.
export function resetProviderCache(): void {
  providerCache.clear();
}

// ─── Register built-in providers ─────────────────────────────────────────────

import { createGroqProvider } from "./providers/groq";
import { createOpenAiProvider } from "./providers/openai";

registerProvider("groq", createGroqProvider);
registerProvider("openai", createOpenAiProvider);
