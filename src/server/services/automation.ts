import type { AutomationMode } from "@prisma/client";

/**
 * Derives the legacy automation flags from the single `AutomationMode` source of
 * truth. This keeps the downstream review pipeline (`review-pr.ts`) untouched —
 * it still consumes `autoPost` / `postEvent` from the Inngest event; only the
 * webhook handler changes *where* those values come from.
 *
 *   OFF             → no auto-review at all
 *   REVIEW_ONLY     → review + save to dashboard; nothing posted to GitHub
 *   COMMENT         → review + non-blocking inline comments on the PR
 *   REQUEST_CHANGES → review + a blocking "request changes" review
 */
export function deriveAutomation(mode: AutomationMode): {
  autoReview: boolean;
  autoPost: boolean;
  postEvent: "COMMENT" | "REQUEST_CHANGES";
} {
  return {
    autoReview: mode !== "OFF",
    autoPost: mode === "COMMENT" || mode === "REQUEST_CHANGES",
    postEvent: mode === "REQUEST_CHANGES" ? "REQUEST_CHANGES" : "COMMENT",
  };
}
