"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="absolute inset-0 bg-dot opacity-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 mb-6"
        >
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </motion.div>

        <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          An unexpected error occurred. Don&apos;t worry, your data is safe. Try
          refreshing the page or going back to the dashboard.
        </p>

        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground/60 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={reset} variant="default" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/repos">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
