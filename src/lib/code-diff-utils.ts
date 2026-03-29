/**
 * Utility functions for code diffing, language detection, and syntax highlighting.
 */

// Language detection by file extension
const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  // Web
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "scss",
  ".sass": "sass",
  ".less": "less",
  // Data
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".xml": "xml",
  ".toml": "toml",
  // Backend
  ".py": "python",
  ".rb": "ruby",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".kt": "kotlin",
  ".scala": "scala",
  ".php": "php",
  ".cs": "csharp",
  ".cpp": "cpp",
  ".c": "c",
  ".h": "c",
  ".hpp": "cpp",
  // Shell
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".fish": "fish",
  ".ps1": "powershell",
  // Config
  ".env": "bash",
  ".gitignore": "text",
  ".dockerignore": "text",
  // Markup
  ".md": "markdown",
  ".mdx": "markdown",
  // SQL
  ".sql": "sql",
  // Other
  ".prisma": "prisma",
  ".graphql": "graphql",
  ".gql": "graphql",
  ".vue": "vue",
  ".svelte": "svelte",
};

/**
 * Detects programming language from filename or extension
 */
export function detectLanguage(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return LANGUAGE_MAP[ext] || "text";
}

/**
 * Represents a single line in a diff
 */
export interface DiffLine {
  type: "add" | "del" | "context" | "hunk";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * Parses a unified diff patch into structured lines
 */
export function parseDiffPatch(patch: string): DiffLine[] {
  const lines = patch.split("\n");
  const result: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      // Parse hunk header: @@ -start,count +start,count @@
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      result.push({ type: "hunk", content: line });
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      result.push({
        type: "add",
        content: line.slice(1),
        newLineNumber: newLine++,
      });
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      result.push({
        type: "del",
        content: line.slice(1),
        oldLineNumber: oldLine++,
      });
    } else if (line.startsWith("\\")) {
      // "\ No newline at end of file" - skip
      continue;
    } else {
      // Context line
      const content = line.startsWith(" ") ? line.slice(1) : line;
      result.push({
        type: "context",
        content,
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
      });
    }
  }

  return result;
}

/**
 * Computes a simple line-based diff between old and new code
 */
export function computeSimpleDiff(
  oldCode: string,
  newCode: string
): DiffLine[] {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff for small code blocks
  const maxLen = Math.max(oldLines.length, newLines.length);

  let oldIdx = 0;
  let newIdx = 0;
  let lineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldLine === newLine && oldIdx < oldLines.length && newIdx < newLines.length) {
      result.push({
        type: "context",
        content: oldLine,
        oldLineNumber: lineNum,
        newLineNumber: lineNum,
      });
      oldIdx++;
      newIdx++;
      lineNum++;
    } else if (oldIdx < oldLines.length && !newLines.slice(newIdx).includes(oldLine)) {
      result.push({
        type: "del",
        content: oldLine,
        oldLineNumber: lineNum,
      });
      oldIdx++;
    } else if (newIdx < newLines.length && !oldLines.slice(oldIdx).includes(newLine)) {
      result.push({
        type: "add",
        content: newLine,
        newLineNumber: lineNum,
      });
      newIdx++;
    } else if (oldIdx < oldLines.length) {
      result.push({
        type: "del",
        content: oldLine,
        oldLineNumber: lineNum,
      });
      oldIdx++;
    } else if (newIdx < newLines.length) {
      result.push({
        type: "add",
        content: newLine,
        newLineNumber: lineNum,
      });
      newIdx++;
    }
    lineNum++;
  }

  return result;
}

/**
 * Extracts line numbers from a diff hunk for context
 */
export function extractLineRange(
  startLine: number,
  code: string
): { start: number; end: number } {
  const lineCount = code.split("\n").length;
  return {
    start: startLine,
    end: startLine + lineCount - 1,
  };
}

/**
 * Normalizes code for comparison (trims trailing whitespace, normalizes line endings)
 */
export function normalizeCode(code: string): string {
  return code
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Highlights differences between two strings at character level
 */
export interface CharDiff {
  text: string;
  type: "same" | "add" | "del";
}

export function computeCharDiff(oldStr: string, newStr: string): {
  oldParts: CharDiff[];
  newParts: CharDiff[];
} {
  // Simple character diff for highlighting inline changes
  const oldParts: CharDiff[] = [];
  const newParts: CharDiff[] = [];

  // Find common prefix
  let prefixLen = 0;
  while (
    prefixLen < oldStr.length &&
    prefixLen < newStr.length &&
    oldStr[prefixLen] === newStr[prefixLen]
  ) {
    prefixLen++;
  }

  // Find common suffix
  let oldSuffixStart = oldStr.length;
  let newSuffixStart = newStr.length;
  while (
    oldSuffixStart > prefixLen &&
    newSuffixStart > prefixLen &&
    oldStr[oldSuffixStart - 1] === newStr[newSuffixStart - 1]
  ) {
    oldSuffixStart--;
    newSuffixStart--;
  }

  // Build diff parts
  if (prefixLen > 0) {
    const prefix = oldStr.slice(0, prefixLen);
    oldParts.push({ text: prefix, type: "same" });
    newParts.push({ text: prefix, type: "same" });
  }

  if (oldSuffixStart > prefixLen) {
    oldParts.push({ text: oldStr.slice(prefixLen, oldSuffixStart), type: "del" });
  }

  if (newSuffixStart > prefixLen) {
    newParts.push({ text: newStr.slice(prefixLen, newSuffixStart), type: "add" });
  }

  if (oldSuffixStart < oldStr.length) {
    const suffix = oldStr.slice(oldSuffixStart);
    oldParts.push({ text: suffix, type: "same" });
    newParts.push({ text: suffix, type: "same" });
  }

  return { oldParts, newParts };
}

/**
 * Truncates code to a maximum number of lines
 */
export function truncateCode(code: string, maxLines: number = 20): {
  code: string;
  truncated: boolean;
  originalLineCount: number;
} {
  const lines = code.split("\n");
  const originalLineCount = lines.length;
  
  if (lines.length <= maxLines) {
    return { code, truncated: false, originalLineCount };
  }

  return {
    code: lines.slice(0, maxLines).join("\n"),
    truncated: true,
    originalLineCount,
  };
}

/**
 * Gets CSS classes for syntax highlighting based on line type
 */
export function getLineTypeClasses(type: "add" | "del" | "context" | "hunk"): {
  bg: string;
  text: string;
  marker: string;
} {
  const classes = {
    add: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/8",
      text: "text-emerald-700 dark:text-emerald-400",
      marker: "+",
    },
    del: {
      bg: "bg-red-500/10 dark:bg-red-500/8",
      text: "text-red-700 dark:text-red-400",
      marker: "-",
    },
    context: {
      bg: "",
      text: "text-foreground",
      marker: " ",
    },
    hunk: {
      bg: "bg-primary/5",
      text: "text-primary/70",
      marker: "@",
    },
  };

  return classes[type];
}
