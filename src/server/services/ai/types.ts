import { z } from "zod";

// ─── Review Schemas ──────────────────────────────────────────────────────────

const REVIEW_SEVERITIES = ["critical", "high", "medium", "low"] as const;
const REVIEW_CATEGORIES = [
  "bug",
  "security",
  "performance",
  "style",
  "suggestion",
] as const;

type ReviewSeverity = (typeof REVIEW_SEVERITIES)[number];
type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

function normalizeSeverity(value: unknown): ReviewSeverity {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");

  const map: Record<string, ReviewSeverity> = {
    critical: "critical",
    severe: "critical",
    blocker: "critical",
    high: "high",
    major: "high",
    medium: "medium",
    moderate: "medium",
    low: "low",
    minor: "low",
    info: "low",
    informational: "low",
  };

  return map[normalized] ?? "low";
}

function normalizeCategory(value: unknown): ReviewCategory {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");

  const map: Record<string, ReviewCategory> = {
    bug: "bug",
    bugs: "bug",
    defect: "bug",
    issue: "bug",
    security: "security",
    vulnerability: "security",
    vulnerabilities: "security",
    auth: "security",
    performance: "performance",
    perf: "performance",
    optimization: "performance",
    style: "style",
    formatting: "style",
    readability: "style",
    maintainability: "style",
    bestpractice: "suggestion",
    bestpractices: "suggestion",
    suggestion: "suggestion",
    suggestions: "suggestion",
    improvement: "suggestion",
    improvements: "suggestion",
  };

  return map[normalized] ?? "suggestion";
}

// ─── Code Comparison Types ───────────────────────────────────────────────────

export const CodeBlockSchema = z.object({
  code: z.string(),
  language: z.string().optional(),
  lineStart: z.number().optional(),
  lineEnd: z.number().optional(),
});

export const CodeCommentSchema = z.object({
  lineNumber: z.number(),
  type: z.enum(["note", "highlight", "warning"]),
  content: z.string(),
  position: z.enum(["old", "new", "both"]),
});

export const CodeSuggestionSchema = z.object({
  type: z.enum(["inline", "block", "refactor"]),
  oldCode: CodeBlockSchema,
  newCode: CodeBlockSchema,
  hint: z.string(),
  explanation: z.string().optional(),
  codeComments: z.array(CodeCommentSchema).optional(),
});

export type CodeBlock = z.infer<typeof CodeBlockSchema>;
export type CodeComment = z.infer<typeof CodeCommentSchema>;
export type CodeSuggestion = z.infer<typeof CodeSuggestionSchema>;

// ─── Review Comment Schema ───────────────────────────────────────────────────

export const ReviewCommentSchema = z.object({
  file: z.string(),
  line: z.number(),
  severity: z.preprocess(
    (value) => normalizeSeverity(value),
    z.enum(REVIEW_SEVERITIES),
  ),
  category: z.preprocess(
    (value) => normalizeCategory(value),
    z.enum(REVIEW_CATEGORIES),
  ),
  message: z.string(),
  suggestion: z.string().optional(),
  // Enhanced code comparison fields
  oldCode: z.string().optional(),
  newCode: z.string().optional(),
  lineStart: z.number().optional(),
  lineEnd: z.number().optional(),
  context: z.string().optional(),
  // Structured suggestion (alternative to string suggestion)
  codeSuggestion: CodeSuggestionSchema.optional(),
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
