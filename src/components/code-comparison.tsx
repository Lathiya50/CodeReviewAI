"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Copy, Check, Code2, AlertTriangle, CheckCircle } from "lucide-react";
import { detectLanguage, truncateCode } from "@/lib/code-diff-utils";

interface CodeComparisonProps {
  oldCode: string;
  newCode: string;
  fileName?: string;
  lineStart?: number;
  showLineNumbers?: boolean;
  maxLines?: number;
  className?: string;
}

function CodeBlock({
  code,
  title,
  icon,
  iconColor,
  bgColor,
  borderColor,
  language,
  lineStart = 1,
  showLineNumbers = true,
  maxLines = 20,
}: {
  code: string;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  language: string;
  lineStart?: number;
  showLineNumbers?: boolean;
  maxLines?: number;
}) {
  const [copied, setCopied] = useState(false);
  const { code: displayCode, truncated, originalLineCount } = truncateCode(code, maxLines);
  const lines = displayCode.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-lg border overflow-hidden",
        borderColor,
        bgColor
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className={cn("shrink-0", iconColor)}>{icon}</span>
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          {language !== "text" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
              {language}
            </span>
          )}
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
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                {showLineNumbers && (
                  <td className="w-10 select-none text-right px-2 py-0.5 text-muted-foreground/40 border-r border-border/20 sticky left-0 bg-inherit">
                    {lineStart + i}
                  </td>
                )}
                <td className="px-3 py-0.5 whitespace-pre">{line || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Truncation notice */}
      {truncated && (
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-t border-border/30">
          ... {originalLineCount - maxLines} more lines
        </div>
      )}
    </div>
  );
}

export function CodeComparison({
  oldCode,
  newCode,
  fileName = "",
  lineStart = 1,
  showLineNumbers = true,
  maxLines = 20,
  className,
}: CodeComparisonProps) {
  const language = detectLanguage(fileName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full", className)}
    >
      {/* Desktop: Side by side */}
      <div className="hidden sm:flex gap-3">
        <CodeBlock
          code={oldCode}
          title="Before"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          iconColor="text-red-500"
          bgColor="bg-red-500/5"
          borderColor="border-red-500/20"
          language={language}
          lineStart={lineStart}
          showLineNumbers={showLineNumbers}
          maxLines={maxLines}
        />
        <CodeBlock
          code={newCode}
          title="After"
          icon={<CheckCircle className="h-3.5 w-3.5" />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/5"
          borderColor="border-emerald-500/20"
          language={language}
          lineStart={lineStart}
          showLineNumbers={showLineNumbers}
          maxLines={maxLines}
        />
      </div>

      {/* Mobile: Stacked */}
      <div className="flex flex-col gap-3 sm:hidden">
        <CodeBlock
          code={oldCode}
          title="Before"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          iconColor="text-red-500"
          bgColor="bg-red-500/5"
          borderColor="border-red-500/20"
          language={language}
          lineStart={lineStart}
          showLineNumbers={showLineNumbers}
          maxLines={maxLines}
        />
        <CodeBlock
          code={newCode}
          title="After"
          icon={<CheckCircle className="h-3.5 w-3.5" />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/5"
          borderColor="border-emerald-500/20"
          language={language}
          lineStart={lineStart}
          showLineNumbers={showLineNumbers}
          maxLines={maxLines}
        />
      </div>
    </motion.div>
  );
}
