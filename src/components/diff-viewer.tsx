"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  FileCode,
  FilePlus,
  FileX,
  FilePen,
  Copy,
  Check,
  ChevronsUpDown,
  ChevronsDownUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiffFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

interface DiffViewerProps {
  files: DiffFile[];
}

function getStatusConfig(status: string) {
  const configs: Record<string, { icon: typeof FileCode; color: string; label: string }> = {
    added: { icon: FilePlus, color: "text-emerald-500", label: "Added" },
    removed: { icon: FileX, color: "text-red-500", label: "Removed" },
    modified: { icon: FilePen, color: "text-amber-500", label: "Modified" },
    renamed: { icon: FilePen, color: "text-blue-500", label: "Renamed" },
  };
  return configs[status] || configs.modified;
}

function ChangeBar({ additions, deletions }: { additions: number; deletions: number }) {
  const total = additions + deletions;
  if (total === 0) return null;
  const blocks = Math.min(total, 5);
  const addBlocks = Math.round((additions / total) * blocks);
  const delBlocks = blocks - addBlocks;

  return (
    <span className="flex items-center gap-px">
      {Array.from({ length: addBlocks }).map((_, i) => (
        <span key={`a${i}`} className="h-2 w-2 rounded-sm bg-emerald-500" />
      ))}
      {Array.from({ length: delBlocks }).map((_, i) => (
        <span key={`d${i}`} className="h-2 w-2 rounded-sm bg-red-500" />
      ))}
    </span>
  );
}

function parseLine(line: string) {
  if (line.startsWith("@@")) return { type: "hunk" as const, content: line };
  if (line.startsWith("+")) return { type: "add" as const, content: line.slice(1) };
  if (line.startsWith("-")) return { type: "del" as const, content: line.slice(1) };
  if (line.startsWith("\\")) return { type: "meta" as const, content: line };
  return { type: "context" as const, content: line.startsWith(" ") ? line.slice(1) : line };
}

function DiffContent({ patch }: { patch: string }) {
  const lines = patch.split("\n");
  let oldLine = 0;
  let newLine = 0;

  return (
    <div className="overflow-x-auto border-t border-border/30">
      <table className="w-full text-xs font-mono">
        <tbody>
          {lines.map((rawLine, i) => {
            const { type, content } = parseLine(rawLine);

            if (type === "hunk") {
              const match = content.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
              if (match) {
                oldLine = parseInt(match[1], 10);
                newLine = parseInt(match[2], 10);
              }
              return (
                <tr key={i} className="bg-primary/5">
                  <td colSpan={3} className="px-3 py-1.5 text-xs text-primary/70 font-medium">
                    {content}
                  </td>
                </tr>
              );
            }

            if (type === "meta") return null;

            let displayOld = "";
            let displayNew = "";

            if (type === "del") {
              displayOld = String(oldLine++);
            } else if (type === "add") {
              displayNew = String(newLine++);
            } else {
              displayOld = String(oldLine++);
              displayNew = String(newLine++);
            }

            return (
              <tr
                key={i}
                className={cn(
                  "group hover:brightness-110 transition-all",
                  type === "add" && "bg-emerald-500/8",
                  type === "del" && "bg-red-500/8"
                )}
              >
                <td className="w-10 select-none text-right px-2 py-0 text-muted-foreground/40 border-r border-border/20">
                  {displayOld}
                </td>
                <td className="w-10 select-none text-right px-2 py-0 text-muted-foreground/40 border-r border-border/20">
                  {displayNew}
                </td>
                <td className="px-3 py-0 whitespace-pre">
                  <span className={cn(
                    "inline-block w-4 select-none",
                    type === "add" && "text-emerald-500",
                    type === "del" && "text-red-500"
                  )}>
                    {type === "add" ? "+" : type === "del" ? "-" : " "}
                  </span>
                  {content}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DiffFileCard({
  file,
  isOpen,
  onToggle,
}: {
  file: DiffFile;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const config = getStatusConfig(file.status);
  const Icon = config.icon;

  const pathParts = file.filename.split("/");
  const fileName = pathParts.pop() || file.filename;
  const dirPath = pathParts.join("/");

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>

        <Icon className={cn("h-4 w-4 shrink-0", config.color)} />

        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          {dirPath && (
            <span className="text-xs text-muted-foreground truncate">{dirPath}/</span>
          )}
          <span className="text-sm font-medium truncate">{fileName}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          <span className="text-emerald-500">+{file.additions}</span>
          <span className="text-red-500">-{file.deletions}</span>
          <ChangeBar additions={file.additions} deletions={file.deletions} />
        </div>

        <button
          onClick={handleCopy}
          className="shrink-0 p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </button>

      <AnimatePresence>
        {isOpen && file.patch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <DiffContent patch={file.patch} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DiffViewer({ files }: DiffViewerProps) {
  const [openFiles, setOpenFiles] = useState<Set<string>>(new Set());

  const toggleFile = (sha: string) => {
    setOpenFiles((prev) => {
      const next = new Set(prev);
      if (next.has(sha)) next.delete(sha);
      else next.add(sha);
      return next;
    });
  };

  const expandAll = () => setOpenFiles(new Set(files.map((f) => f.sha)));
  const collapseAll = () => setOpenFiles(new Set());

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileCode className="h-4 w-4" />
            {files.length} files
          </span>
          <span className="text-emerald-500">+{totalAdditions}</span>
          <span className="text-red-500">-{totalDeletions}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="text-xs gap-1 h-7"
          >
            <ChevronsUpDown className="h-3 w-3" />
            Expand all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="text-xs gap-1 h-7"
          >
            <ChevronsDownUp className="h-3 w-3" />
            Collapse all
          </Button>
        </div>
      </div>

      {/* File list */}
      <div className="space-y-2">
        {files.map((file) => (
          <DiffFileCard
            key={file.sha}
            file={file}
            isOpen={openFiles.has(file.sha)}
            onToggle={() => toggleFile(file.sha)}
          />
        ))}
      </div>
    </div>
  );
}
