"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Code2,
  Columns2,
  GitCompare,
  Lightbulb,
  Info,
  AlertCircle,
  RefreshCw,
  FileCode,
  Wrench,
} from "lucide-react";
import { CodeComparison } from "@/components/code-comparison";
import { CodeDiff } from "@/components/code-diff";
import type { CodeSuggestion, CodeComment } from "@/lib/review-comparison";

type ViewMode = "side-by-side" | "diff" | "text";

interface SuggestionDiffViewerProps {
  suggestion: string | CodeSuggestion;
  fileName: string;
  severity?: string;
  oldCode?: string;
  newCode?: string;
  lineStart?: number;
  context?: string;
  className?: string;
}

function SuggestionTypeIcon({ type }: { type: CodeSuggestion["type"] }) {
  const icons = {
    inline: <FileCode className="h-3.5 w-3.5" />,
    block: <Code2 className="h-3.5 w-3.5" />,
    refactor: <RefreshCw className="h-3.5 w-3.5" />,
  };
  return icons[type] || <Wrench className="h-3.5 w-3.5" />;
}

function SuggestionTypeBadge({ type }: { type: CodeSuggestion["type"] }) {
  const labels = {
    inline: "Inline Fix",
    block: "Code Block",
    refactor: "Refactor",
  };

  const colors = {
    inline: "bg-blue-500/10 text-blue-500 ring-blue-500/20",
    block: "bg-purple-500/10 text-purple-500 ring-purple-500/20",
    refactor: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
        colors[type]
      )}
    >
      <SuggestionTypeIcon type={type} />
      {labels[type]}
    </span>
  );
}

function ViewToggle({
  mode,
  onChange,
  disabled = false,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
}) {
  const options: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
    { value: "side-by-side", label: "Side by Side", icon: <Columns2 className="h-3 w-3" /> },
    { value: "diff", label: "Diff", icon: <GitCompare className="h-3 w-3" /> },
    { value: "text", label: "Text", icon: <Code2 className="h-3 w-3" /> },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          disabled={disabled && opt.value !== "text"}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all",
            mode === opt.value
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
            disabled && opt.value !== "text" && "opacity-50 cursor-not-allowed"
          )}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function InlineComment({
  comment,
  position,
}: {
  comment: CodeComment;
  position: "old" | "new" | "both";
}) {
  if (position === "both") {
    // Show all comments when position is "both"
  } else if (comment.position !== position && comment.position !== "both") {
    return null;
  }

  const typeStyles = {
    note: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    highlight: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    warning: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };

  const typeIcons = {
    note: <Info className="h-3 w-3" />,
    highlight: <Lightbulb className="h-3 w-3" />,
    warning: <AlertCircle className="h-3 w-3" />,
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-2 py-1.5 text-xs mt-1",
        typeStyles[comment.type]
      )}
    >
      <span className="shrink-0 mt-0.5">{typeIcons[comment.type]}</span>
      <span>{comment.content}</span>
    </div>
  );
}

export function SuggestionDiffViewer({
  suggestion,
  fileName,
  severity,
  oldCode: propOldCode,
  newCode: propNewCode,
  lineStart: propLineStart,
  context,
  className,
}: SuggestionDiffViewerProps) {
  // Determine if we have structured suggestion or just strings
  const isStructured = typeof suggestion === "object" && "oldCode" in suggestion;

  const oldCode = isStructured
    ? (suggestion as CodeSuggestion).oldCode.code
    : propOldCode || "";
  const newCode = isStructured
    ? (suggestion as CodeSuggestion).newCode.code
    : propNewCode || "";
  const lineStart = isStructured
    ? (suggestion as CodeSuggestion).oldCode.lineStart || propLineStart || 1
    : propLineStart || 1;

  const hint = isStructured ? (suggestion as CodeSuggestion).hint : "";
  const explanation = isStructured
    ? (suggestion as CodeSuggestion).explanation
    : context;
  const suggestionType = isStructured
    ? (suggestion as CodeSuggestion).type
    : undefined;
  const codeComments = isStructured
    ? (suggestion as CodeSuggestion).codeComments
    : undefined;

  // Check if we have code to compare
  const hasCodeComparison = oldCode && newCode;

  // Default view mode based on available data
  const [viewMode, setViewMode] = useState<ViewMode>(
    hasCodeComparison ? "side-by-side" : "text"
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("space-y-3", className)}
    >
      {/* Header with type badge and view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {suggestionType && <SuggestionTypeBadge type={suggestionType} />}
          {hint && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-amber-500" />
              {hint}
            </span>
          )}
        </div>
        <ViewToggle
          mode={viewMode}
          onChange={setViewMode}
          disabled={!hasCodeComparison}
        />
      </div>

      {/* Code display based on view mode */}
      {viewMode === "side-by-side" && hasCodeComparison && (
        <CodeComparison
          oldCode={oldCode}
          newCode={newCode}
          fileName={fileName}
          lineStart={lineStart}
        />
      )}

      {viewMode === "diff" && hasCodeComparison && (
        <CodeDiff
          oldCode={oldCode}
          newCode={newCode}
          fileName={fileName}
        />
      )}

      {viewMode === "text" && (
        <pre className="rounded-lg bg-muted/40 border border-border/40 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          {typeof suggestion === "string"
            ? suggestion
            : newCode || (suggestion as CodeSuggestion).newCode.code}
        </pre>
      )}

      {/* Inline code comments */}
      {codeComments && codeComments.length > 0 && (
        <div className="space-y-1.5">
          {codeComments.map((comment, i) => (
            <InlineComment
              key={i}
              comment={comment}
              position={viewMode === "side-by-side" ? "both" : "new"}
            />
          ))}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 border border-border/30">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
          <p className="leading-relaxed">{explanation}</p>
        </div>
      )}
    </motion.div>
  );
}
