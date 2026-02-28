/**
 * Shared types and helpers for comparing two AI reviews of the same PR.
 * Used by the compare page and any future consumers (e.g. analytics).
 */

/** Comment shape as stored in DB / returned by API (category may be missing in legacy data). */
export interface ReviewCommentInput {
  file: string;
  line: number;
  severity: string;
  category?: string;
  message: string;
  suggestion?: string;
}

/** Normalized key for matching the same issue across reviews (file + line + severity + category). */
function commentKey(c: ReviewCommentInput): string {
  return `${c.file}:${c.line}:${c.severity}:${c.category ?? ""}`;
}

/**
 * Parses comments from review JSON.
 * Returns empty array if not an array or if items lack required fields.
 */
export function parseReviewComments(raw: unknown): ReviewCommentInput[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ReviewCommentInput => {
    return (
      item !== null &&
      typeof item === "object" &&
      "file" in item &&
      typeof (item as ReviewCommentInput).file === "string" &&
      "line" in item &&
      typeof (item as ReviewCommentInput).line === "number" &&
      "severity" in item &&
      typeof (item as ReviewCommentInput).severity === "string" &&
      "message" in item &&
      typeof (item as ReviewCommentInput).message === "string"
    );
  });
}

export interface ComparisonSegment<T> {
  /** Comments in this segment (fixed, new, or unchanged). */
  items: T[];
  /** Count for display. */
  count: number;
}

export interface ReviewComparisonResult {
  /** Issues present in baseline but not in current (fixed). */
  fixed: ComparisonSegment<ReviewCommentInput>;
  /** Issues present in current but not in baseline (new). */
  new: ComparisonSegment<ReviewCommentInput>;
  /** Issues present in both (unchanged). */
  unchanged: ComparisonSegment<ReviewCommentInput>;
  /** Baseline comment count. */
  baselineTotal: number;
  /** Current comment count. */
  currentTotal: number;
}

/**
 * Compares comments from two reviews and classifies them as fixed, new, or unchanged.
 * Uses file:line:severity:category as the matching key.
 *
 * @param baselineComments - Comments from the older review
 * @param currentComments - Comments from the newer review
 * @returns Classification of all comments into fixed / new / unchanged
 */
export function computeReviewComparison(
  baselineComments: ReviewCommentInput[],
  currentComments: ReviewCommentInput[],
): ReviewComparisonResult {
  const baselineKeys = new Set(baselineComments.map(commentKey));
  const currentKeys = new Set(currentComments.map(commentKey));

  const fixed: ReviewCommentInput[] = baselineComments.filter(
    (c) => !currentKeys.has(commentKey(c)),
  );
  const newItems: ReviewCommentInput[] = currentComments.filter(
    (c) => !baselineKeys.has(commentKey(c)),
  );
  const unchanged: ReviewCommentInput[] = currentComments.filter((c) =>
    baselineKeys.has(commentKey(c)),
  );

  return {
    fixed: { items: fixed, count: fixed.length },
    new: { items: newItems, count: newItems.length },
    unchanged: { items: unchanged, count: unchanged.length },
    baselineTotal: baselineComments.length,
    currentTotal: currentComments.length,
  };
}
