"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileCode2,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  CircleDot,
  Bug,
  Shield,
  Zap,
  Paintbrush,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewCommentInput } from "@/lib/review-comparison";

const SEVERITY_STYLES: Record<
  string,
  { bar: string; badge: string }
> = {
  critical: {
    bar: "bg-red-500",
    badge:
      "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  high: {
    bar: "bg-orange-500",
    badge:
      "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  medium: {
    bar: "bg-amber-500",
    badge:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  low: {
    bar: "bg-slate-400 dark:bg-slate-500",
    badge: "border-border bg-muted text-muted-foreground",
  },
};

function getSeverityStyle(severity: string) {
  return SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  bug: Bug,
  security: Shield,
  performance: Zap,
  style: Paintbrush,
  suggestion: Lightbulb,
};

export interface ComparisonCommentCardProps {
  comment: ReviewCommentInput;
  variant: "fixed" | "new" | "unchanged";
}

/**
 * Renders a single review comment in the comparison view with variant styling.
 */
export function ComparisonCommentCard({
  comment,
  variant,
}: ComparisonCommentCardProps) {
  const severityStyle = getSeverityStyle(comment.severity);
  const CategoryIcon = comment.category ? CATEGORY_ICONS[comment.category] ?? CircleDot : CircleDot;

  const variantConfig = {
    fixed: {
      icon: CheckCircle2,
      label: "Fixed",
      borderClass: "border-emerald-500/20 dark:border-emerald-500/30",
      bgClass: "bg-emerald-500/5 dark:bg-emerald-500/10",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    new: {
      icon: AlertCircle,
      label: "New",
      borderClass: "border-amber-500/20 dark:border-amber-500/30",
      bgClass: "bg-amber-500/5 dark:bg-amber-500/10",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
    unchanged: {
      icon: MinusCircle,
      label: "Unchanged",
      borderClass: "border-border/60",
      bgClass: "bg-muted/30",
      iconClass: "text-muted-foreground",
    },
  }[variant];

  const Icon = variantConfig.icon;
  const pathParts = comment.file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.length > 0 ? pathParts.join("/") : null;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-xl border transition-colors",
        variantConfig.borderClass,
        variantConfig.bgClass,
      )}
    >
      <div className="p-5 flex items-start gap-4">
        <div
          className={cn(
            "mt-0.5 w-1 min-h-[3rem] rounded-full shrink-0",
            severityStyle.bar,
          )}
        />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] uppercase tracking-wider font-semibold gap-1",
                severityStyle.badge,
              )}
            >
              {comment.severity}
            </Badge>
            <Badge
              variant="secondary"
              className={cn("gap-1 text-xs", variantConfig.iconClass)}
            >
              <Icon className="size-3" />
              {variantConfig.label}
            </Badge>
            {comment.category && (
              <Badge variant="outline" className="gap-1 text-xs">
                <CategoryIcon className="size-3" />
                {comment.category}
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {comment.message}
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground truncate">
            <FileCode2 className="size-3.5 shrink-0 flex-shrink-0" />
            {directory && (
              <span className="opacity-70 truncate">{directory}/</span>
            )}
            <span className="font-medium text-foreground truncate">
              {fileName}
            </span>
            <span className="text-primary shrink-0">:{comment.line}</span>
          </div>
          {comment.suggestion && (
            <div className="mt-3 pl-4 border-l-2 border-emerald-500/30 rounded-r">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                Suggestion
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {comment.suggestion}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
