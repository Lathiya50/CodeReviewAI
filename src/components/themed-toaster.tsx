"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/**
 * Wraps sonner's Toaster so its theme tracks the active next-themes value
 * instead of being hardcoded. Falls back to "system" while resolving.
 */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={(resolvedTheme as "light" | "dark") ?? "system"}
      richColors
      closeButton
    />
  );
}
