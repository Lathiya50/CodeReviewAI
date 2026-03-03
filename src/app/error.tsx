"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* Animated error illustration */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="size-10 text-destructive animate-pulse" />
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again or return to the home
        page.
      </p>

      {error.message && (
        <div className="mt-4 max-w-lg rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive font-mono break-all">
            {error.message}
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/">
            <Home className="size-4" />
            Home
          </Link>
        </Button>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-muted-foreground/60 font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
