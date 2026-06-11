import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PROVIDER_CONFIGS, type ProviderName } from "@/constant/ai";
import { encryptSecret, lastFour } from "@/server/services/crypto";
import {
  isModelAllowed,
  PROVIDER_NAME_TO_PRISMA,
} from "@/server/services/ai/settings";

// Human-friendly labels for the UI provider picker.
const PROVIDER_LABELS: Record<ProviderName, string> = {
  groq: "Groq",
  openai: "OpenAI",
  anthropic: "Claude (Anthropic)",
  gemini: "Gemini (Google)",
};

const MAX_CUSTOM_INSTRUCTIONS_CHARS = 4_000;

const providerEnum = z.enum(["groq", "openai", "anthropic", "gemini"]);

/**
 * Settings tRPC router — per-user AI provider/model/key/instructions.
 * All procedures are protected and scoped to the authenticated user.
 * The raw API key is NEVER returned by any procedure.
 */
export const settingsRouter = createTRPCRouter({
  /**
   * Returns the user's saved AI settings (without the raw key).
   * `hasApiKey`/`apiKeyLast4` reflect the key for the CURRENTLY selected provider.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.userAiSettings.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!settings) {
      return {
        provider: "groq" as ProviderName,
        model: null as string | null,
        customInstructions: null as string | null,
        hasApiKey: false,
        apiKeyLast4: null as string | null,
      };
    }

    const provider = settings.provider.toLowerCase() as ProviderName;
    const hasApiKey =
      !!settings.apiKeyCiphertext &&
      settings.apiKeyProvider === settings.provider;

    return {
      provider,
      model: settings.model,
      customInstructions: settings.customInstructions,
      hasApiKey,
      apiKeyLast4: hasApiKey ? settings.apiKeyLast4 : null,
    };
  }),

  /**
   * Returns the provider/model catalog for the settings UI, including whether
   * the app ships an env key for each provider (so the UI can hint when a user
   * key is required).
   */
  providers: protectedProcedure.query(() => {
    return (Object.keys(PROVIDER_CONFIGS) as ProviderName[]).map((name) => {
      const config = PROVIDER_CONFIGS[name];
      return {
        name,
        label: PROVIDER_LABELS[name],
        models: [...config.availableModels],
        defaultModel: config.models.primaryModel,
        apiKeySignupUrl: config.apiKeySignupUrl,
        appKeyAvailable: !!process.env[config.apiKeyEnvVar],
      };
    });
  }),

  /**
   * Creates or updates the user's AI settings.
   * - Validates `model` against the provider's allowed list (rejects otherwise).
   * - Encrypts and stores `apiKey` if provided; otherwise the saved key is untouched.
   * - Caps custom instructions length.
   */
  update: protectedProcedure
    .input(
      z.object({
        provider: providerEnum,
        model: z.string().trim().min(1).optional().nullable(),
        customInstructions: z
          .string()
          .max(MAX_CUSTOM_INSTRUCTIONS_CHARS)
          .optional()
          .nullable(),
        apiKey: z.string().trim().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const provider = input.provider;

      // Validate model against the provider's allowed list.
      if (input.model && !isModelAllowed(provider, input.model)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Model "${input.model}" is not available for ${PROVIDER_LABELS[provider]}.`,
        });
      }

      const prismaProvider = PROVIDER_NAME_TO_PRISMA[provider];
      const normalizedInstructions = input.customInstructions?.trim()
        ? input.customInstructions.trim().slice(0, MAX_CUSTOM_INSTRUCTIONS_CHARS)
        : null;

      // Shared fields (everything except the key).
      const baseData = {
        provider: prismaProvider,
        model: input.model ?? null,
        customInstructions: normalizedInstructions,
      };

      // Encrypt the key only when a new one is supplied. Surfaces a clear error
      // if SETTINGS_ENCRYPTION_KEY is missing/invalid.
      let keyData: {
        apiKeyCiphertext: string;
        apiKeyLast4: string;
        apiKeyProvider: typeof prismaProvider;
      } | null = null;

      if (input.apiKey) {
        try {
          keyData = {
            apiKeyCiphertext: encryptSecret(input.apiKey),
            apiKeyLast4: lastFour(input.apiKey),
            apiKeyProvider: prismaProvider,
          };
        } catch (err) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              err instanceof Error
                ? err.message
                : "Failed to encrypt the API key.",
          });
        }
      }

      await ctx.db.userAiSettings.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          ...baseData,
          ...(keyData ?? {}),
        },
        update: {
          ...baseData,
          ...(keyData ?? {}),
        },
      });

      return { success: true };
    }),

  /**
   * Removes the user's saved API key, reverting reviews to the app default key.
   */
  removeApiKey: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.userAiSettings.updateMany({
      where: { userId: ctx.user.id },
      data: {
        apiKeyCiphertext: null,
        apiKeyLast4: null,
        apiKeyProvider: null,
      },
    });

    return { success: true };
  }),
});
