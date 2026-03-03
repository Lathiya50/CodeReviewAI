import { z } from "zod";

// ─── Review Schemas ──────────────────────────────────────────────────────────

export const ReviewCommentSchema = z.object({
  file: z.string(),
  line: z.number(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum(["bug", "security", "performance", "style", "suggestion"]),
  message: z.string(),
  suggestion: z.string().optional(),
});

export const ReviewResultSchema = z.object({
  summary: z.string(),
  riskScore: z.number().min(0).max(100),
  comments: z.array(ReviewCommentSchema),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema>;
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

// ─── File Change ─────────────────────────────────────────────────────────────

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

// ─── Chat Primitives ─────────────────────────────────────────────────────────

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ChatResponse {
  content: string;
}

// ─── Provider Interface (Strategy) ───────────────────────────────────────────

// Contract every AI provider must implement. Retry, prompt, and validation live in the orchestrator.
export interface AiProvider {
  readonly name: string;
  // Sends chat completion and returns text content. Throws with status on HTTP failures.
  chat(request: ChatRequest): Promise<ChatResponse>;
}

// ─── Provider Configuration ──────────────────────────────────────────────────

export interface AiModelConfig {
  primaryModel: string;
  fallbackModel: string;
}

export interface AiProviderConfig {
  name: string;
  models: AiModelConfig;
  apiKeyEnvVar: string;
  apiKeySignupUrl: string;
}
