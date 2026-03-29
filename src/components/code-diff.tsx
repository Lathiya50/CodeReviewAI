"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  computeSimpleDiff,
  getLineTypeClasses,
  detectLanguage,
  type DiffLine,
} from "@/lib/code-diff-utils";

interface CodeDiffProps {
  oldCode: string;
  newCode: string;
  fileName?: string;
  showLineNumbers?: boolean;
  initialExpanded?: boolean;
  maxCollapsedLines?: number;
  className?: string;
}

function DiffLineRow({ line, showLineNumbers }: { line: DiffLine; showLineNumbers: boolean }) {
  const classes = getLineTypeClasses(line.type);

  if (line.type === "hunk") {
    return (
      <tr className={classes.bg}>
        <td colSpan={showLineNumbers ? 3 : 2} className="px-3 py-1.5 text-xs font-medium">
          <span className={classes.text}>{line.content}</span>
        </td>
      </tr>
    );
  }

  return (
    <tr className={cn("group transition-colors hover:brightness-105", classes.bg)}>
      {showLineNumbers && (
        <>
          <td className="w-10 select-none text-right px-2 py-0.5 text-muted-foreground/40 border-r border-border/20 font-mono text-xs">
            {line.type !== "add" ? line.oldLineNumber : ""}
          </td>
          <td className="w-10 select-none text-right px-2 py-0.5 text-muted-foreground/40 border-r border-border/20 font-mono text-xs">
            {line.type !== "del" ? line.newLineNumber : ""}
          </td>
        </>
      )}
      <td className="px-3 py-0.5 whitespace-pre font-mono text-xs">
        <span className={cn("inline-block w-4 select-none", classes.text)}>
          {classes.marker}
        </span>
        <span className="text-foreground">{line.content}</span>
      </td>
    </tr>
  );
}

export function CodeDiff({
  oldCode,
  newCode,
  fileName = "",
  showLineNumbers = true,
  initialExpanded = true,
  maxCollapsedLines = 6,
  className,
}: CodeDiffProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(initialExpanded);
  const language = detectLanguage(fileName);

  const diffLines = useMemo(() => {
    return computeSimpleDiff(oldCode, newCode);
  }, [oldCode, newCode]);

  const displayLines = expanded
    ? diffLines
    : diffLines.slice(0, maxCollapsedLines);

  const hasMore = !expanded && diffLines.length > maxCollapsedLines;

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    for (const line of diffLines) {
      if (line.type === "add") additions++;
      if (line.type === "del") deletions++;
    }
    return { additions, deletions };
  }, [diffLines]);

  const handleCopy = () => {
    navigator.clipboard.writeText(newCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border border-border/40 overflow-hidden bg-card/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Unified Diff
          </span>
          {language !== "text" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
              {language}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs">
            {stats.additions > 0 && (
              <span className="text-emerald-500">+{stats.additions}</span>
            )}
            {stats.deletions > 0 && (
              <span className="text-red-500">-{stats.deletions}</span>
            )}
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy new</span>
            </>
          )}
        </button>
      </div>

      {/* Diff Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {displayLines.map((line, i) => (
              <DiffLineRow key={i} line={line} showLineNumbers={showLineNumbers} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand/Collapse */}
      {diffLines.length > maxCollapsedLines && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border/30"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {diffLines.length - maxCollapsedLines} more lines
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
