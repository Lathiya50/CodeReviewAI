"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertTriangle,
  Minus,
  Bug,
  Shield,
  Zap,
  Paintbrush,
  Lightbulb,
  FileCode,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import type { ReviewCommentInput } from "@/lib/review-comparison";

function getSeverityStyles(severity: string) {
  const styles: Record<string, string> = {
    critical: "bg-red-500/10 text-red-500 ring-red-500/20",
    high: "bg-orange-500/10 text-orange-500 ring-orange-500/20",
    medium: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
    low: "bg-blue-500/10 text-blue-500 ring-blue-500/20",
  };
  return styles[severity] || styles.low;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, React.ReactNode> = {
    bug: <Bug className="h-3 w-3" />,
    security: <Shield className="h-3 w-3" />,
    performance: <Zap className="h-3 w-3" />,
    style: <Paintbrush className="h-3 w-3" />,
    suggestion: <Lightbulb className="h-3 w-3" />,
  };
  return icons[category] || <Info className="h-3 w-3" />;
}

function getVariantConfig(variant: "fixed" | "new" | "unchanged") {
  const configs = {
    fixed: {
      icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
      label: "Fixed",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      badge: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
    },
    new: {
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
      label: "New Issue",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
      badge: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
    },
    unchanged: {
      icon: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
      label: "Unchanged",
      border: "border-border/40",
      bg: "bg-card/50",
      badge: "bg-muted text-muted-foreground ring-border/50",
    },
  };
  return configs[variant];
}

export function ComparisonCommentCard({
  comment,
  variant,
}: {
  comment: ReviewCommentInput;
  variant: "fixed" | "new" | "unchanged";
}) {
  const [expanded, setExpanded] = useState(false);
  const config = getVariantConfig(variant);

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} backdrop-blur-sm p-4 transition-all`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${config.badge}`}>
          {config.icon}
          {config.label}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 capitalize ${getSeverityStyles(comment.severity)}`}>
          {comment.severity}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground capitalize">
          {getCategoryIcon(comment?.category??"")}
          {comment.category}
        </span>
      </div>

      <p className="text-sm leading-relaxed">{comment.message}</p>

      <div className="flex items-center gap-2 mt-2">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <FileCode className="h-3 w-3" />
          {comment.file}:{comment.line}
        </span>
      </div>

      {comment.suggestion && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Lightbulb className="h-3 w-3" />
            {expanded ? "Hide" : "View"} suggestion
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
  );
}
