"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CircularGauge } from "@/components/ui/circular-gauge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  Loader2,
  XCircle,
  Ban,
  Bug,
  Shield,
  Zap,
  Paintbrush,
  Lightbulb,
  FileCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Sparkles,
  Info,
} from "lucide-react";

interface ReviewComment {
  file: string;
  line: number;
  severity: "critical" | "high" | "medium" | "low";
  category: "bug" | "security" | "performance" | "style" | "suggestion";
  message: string;
  suggestion?: string;
}

interface Review {
  id: string;
  status: string;
  riskScore: number | null;
  summary: string | null;
  comments: unknown;
  createdAt: string | Date;
}

interface ReviewResultProps {
  review: Review;
}

function getSeverityStyles(severity: string) {
  const styles: Record<string, { bg: string; text: string; border: string; ring: string }> = {
    critical: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", ring: "ring-red-500/20" },
    high: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20", ring: "ring-orange-500/20" },
    medium: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", ring: "ring-amber-500/20" },
    low: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", ring: "ring-blue-500/20" },
  };
  return styles[severity] || styles.low;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, React.ReactNode> = {
    bug: <Bug className="h-3.5 w-3.5" />,
    security: <Shield className="h-3.5 w-3.5" />,
    performance: <Zap className="h-3.5 w-3.5" />,
    style: <Paintbrush className="h-3.5 w-3.5" />,
    suggestion: <Lightbulb className="h-3.5 w-3.5" />,
  };
  return icons[category] || <Info className="h-3.5 w-3.5" />;
}

function CommentCard({
  comment,
  index,
  selected,
  onToggle,
}: {
  comment: ReviewComment;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const severity = getSeverityStyles(comment.severity);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${comment.file}:${comment.line}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden transition-all ${selected ? "border-primary/40 ring-1 ring-primary/20" : "border-border/40"}`}
    >
      <div className="flex items-start gap-3 p-4">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          className="mt-0.5 shrink-0 border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 capitalize ${severity.bg} ${severity.text} ${severity.ring}`}>
              {comment.severity}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground capitalize">
              {getCategoryIcon(comment.category)}
              {comment.category}
            </span>
          </div>

          <p className="text-sm leading-relaxed">{comment.message}</p>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              <FileCode className="h-3 w-3" />
              {comment.file}:{comment.line}
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              )}
            </button>
          </div>

          {comment.suggestion && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Lightbulb className="h-3 w-3" />
                {expanded ? "Hide" : "View"} suggestion
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <pre className="mt-2 rounded-lg bg-muted/40 border border-border/40 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                      {comment.suggestion}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SeverityBar({ comments }: { comments: ReviewComment[] }) {
  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    comments.forEach((comment) => {
      if (comment.severity in c) c[comment.severity as keyof typeof c]++;
    });
    return c;
  }, [comments]);

  const total = comments.length;
  if (total === 0) return null;

  const items = [
    { key: "critical", label: "Critical", count: counts.critical, color: "bg-red-500" },
    { key: "high", label: "High", count: counts.high, color: "bg-orange-500" },
    { key: "medium", label: "Medium", count: counts.medium, color: "bg-amber-500" },
    { key: "low", label: "Low", count: counts.low, color: "bg-blue-500" },
  ];

  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted/40">
        {items.map(
          (item) =>
            item.count > 0 && (
              <motion.div
                key={item.key}
                className={`${item.color} h-full`}
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            )
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        {items.map(
          (item) =>
            item.count > 0 && (
              <span key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                {item.label}: {item.count}
              </span>
            )
        )}
      </div>
    </div>
  );
}

export function ReviewResult({ review }: ReviewResultProps) {
  const [selectedComments, setSelectedComments] = useState<Set<number>>(new Set());
  const [eventType, setEventType] = useState<"COMMENT" | "REQUEST_CHANGES">("COMMENT");
  const [showPostDialog, setShowPostDialog] = useState(false);

  const postMutation = trpc.review.postToGithub.useMutation({
    onSuccess: (data) => {
      setSelectedComments(new Set());
      setShowPostDialog(false);
      toast.success(`Posted ${data.postedCount} comments to GitHub`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const comments = useMemo(() => {
    if (!Array.isArray(review.comments)) return [];
    return review.comments as ReviewComment[];
  }, [review.comments]);

  const toggleComment = (index: number) => {
    setSelectedComments((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map((_, i) => i)));
    }
  };

  const handlePost = () => {
    postMutation.mutate({
      reviewId: review.id,
      commentIndices: Array.from(selectedComments),
      event: eventType,
    });
  };

  // Status screens
  if (review.status === "PENDING" || review.status === "PROCESSING") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
        <h3 className="text-base font-semibold">
          {review.status === "PENDING" ? "Review queued" : "Analyzing code..."}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {review.status === "PENDING"
            ? "Your review will start shortly."
            : "AI is reviewing your code. This usually takes a few seconds."}
        </p>
      </div>
    );
  }

  if (review.status === "FAILED") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 mb-4">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-base font-semibold">Review failed</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Something went wrong during the review. Try running it again.
        </p>
      </div>
    );
  }

  if (review.status === "CANCELLED") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/50 mb-4">
          <Ban className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Review cancelled</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This review was cancelled before completion.
        </p>
      </div>
    );
  }

  // COMPLETED
  return (
    <div className="space-y-6">
      {/* Risk Score + Severity Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Risk Score */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 flex items-center gap-6">
          <CircularGauge
            value={review.riskScore ?? 0}
            size={100}
            strokeWidth={7}
            label="Risk"
          />
          <div>
            <h3 className="text-sm font-semibold mb-1">Risk Score</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {(review.riskScore ?? 0) <= 30
                ? "Low risk. This PR looks safe to merge."
                : (review.riskScore ?? 0) <= 60
                  ? "Medium risk. Review the flagged issues."
                  : "High risk. Critical issues found."}
            </p>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
          <h3 className="text-sm font-semibold mb-3">Severity Breakdown</h3>
          <SeverityBar comments={comments} />
          {comments.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              No issues found
            </div>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {review.summary && (
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Summary</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.summary}
          </p>
        </div>
      )}

      {/* Comments */}
      {comments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </h3>
            <button
              onClick={toggleAll}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {selectedComments.size === comments.length ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="space-y-2">
            {comments.map((comment, i) => (
              <CommentCard
                key={i}
                comment={comment}
                index={i}
                selected={selectedComments.has(i)}
                onToggle={() => toggleComment(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Post to GitHub floating bar */}
      <AnimatePresence>
        {selectedComments.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl px-4 py-3">
              <span className="text-sm font-medium">
                {selectedComments.size} selected
              </span>

              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5">
                <button
                  onClick={() => setEventType("COMMENT")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${eventType === "COMMENT" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Comment
                </button>
                <button
                  onClick={() => setEventType("REQUEST_CHANGES")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${eventType === "REQUEST_CHANGES" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Request Changes
                </button>
              </div>

              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setShowPostDialog(true)}
                disabled={postMutation.isPending}
              >
                {postMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Post to GitHub
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post confirmation dialog */}
      <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post comments to GitHub?</AlertDialogTitle>
            <AlertDialogDescription>
              This will post {selectedComments.size} comment{selectedComments.size !== 1 ? "s" : ""} as{" "}
              {eventType === "COMMENT" ? "a comment" : "a change request"} on the pull request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePost}
              disabled={postMutation.isPending}
            >
              {postMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Post Comments"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
