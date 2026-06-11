import { DEFAULT_PROVIDER, PROVIDER_CONFIGS, type ProviderName } from "@/constant/ai";
import type { AiProvider, AiProviderConfig } from "./types";

type ProviderFactory = () => AiProvider;
// Builds a provider instance from an explicit (user-supplied) API key.
type KeyedProviderFactory = (apiKey: string) => AiProvider;

const providerFactories = new Map<string, ProviderFactory>();
const keyedProviderFactories = new Map<string, KeyedProviderFactory>();

// Registers a provider factory under the given name. Call once per provider at module-load time.
// `keyedFactory` builds a fresh instance from an explicit API key (used for BYO-key reviews).
export function registerProvider(
  name: string,
  factory: ProviderFactory,
  keyedFactory?: KeyedProviderFactory,
): void {
  providerFactories.set(name, factory);
  if (keyedFactory) {
    keyedProviderFactories.set(name, keyedFactory);
  }
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

// Resolves a provider for a review. If `apiKey` is given, builds a FRESH, UNCACHED
// instance keyed by that user's key (never cached — a user key must not be reused
// across users). With no key, falls back to the cached env-default provider.
export function instantiateProvider(
  name: ProviderName,
  apiKey?: string,
): AiProvider {
  if (apiKey) {
    const keyedFactory = keyedProviderFactories.get(name);
    if (!keyedFactory) {
      const available = Array.from(keyedProviderFactories.keys()).join(", ");
      throw new Error(
        `AI provider "${name}" does not support a user-supplied key. Available: ${available}.`,
      );
    }
    return keyedFactory(apiKey);
  }

  return getProvider(name);
}

// ─── Register built-in providers ─────────────────────────────────────────────

import { createGroqProvider, GroqProvider } from "./providers/groq";
import { createOpenAiProvider, OpenAiProvider } from "./providers/openai";
import { createAnthropicProvider, AnthropicProvider } from "./providers/anthropic";
import { createGeminiProvider, GeminiProvider } from "./providers/gemini";

registerProvider("groq", createGroqProvider, (apiKey) => new GroqProvider(apiKey));
registerProvider("openai", createOpenAiProvider, (apiKey) => new OpenAiProvider(apiKey));
registerProvider(
  "anthropic",
  createAnthropicProvider,
  (apiKey) => new AnthropicProvider(apiKey),
);
registerProvider("gemini", createGeminiProvider, (apiKey) => new GeminiProvider(apiKey));
