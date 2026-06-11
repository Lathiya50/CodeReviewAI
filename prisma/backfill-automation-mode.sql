-- Phase A backfill: derive each repo's single automationMode from the legacy
-- flag combination. Safe + idempotent — re-running maps to the same result.
--   autoReviewEnabled = false                          -> OFF
--   autoReview = true,  autoPost = false               -> REVIEW_ONLY
--   autoReview = true,  autoPost = true, COMMENT        -> COMMENT
--   autoReview = true,  autoPost = true, REQUEST_CHANGES-> REQUEST_CHANGES
UPDATE "Repository"
SET "automationMode" = (
  CASE
    WHEN "autoReviewEnabled" = false THEN 'OFF'
    WHEN "autoPostEnabled" = false THEN 'REVIEW_ONLY'
    WHEN "postEvent" = 'REQUEST_CHANGES' THEN 'REQUEST_CHANGES'
    ELSE 'COMMENT'
  END
)::"AutomationMode";
