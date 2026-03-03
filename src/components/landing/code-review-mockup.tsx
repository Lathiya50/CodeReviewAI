"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, MessageSquare } from "lucide-react";

/**
 * Floating code review mockup showing a simulated PR review.
 * Creates visual appeal and demonstrates the product.
 * @returns JSX.Element - Code review mockup component
 */
export function CodeReviewMockup() {
  return (
    <div className="relative">
      {/* Glow effect behind card */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-3xl animate-pulse-glow" />

      {/* Main card */}
      <motion.div
        className="relative glass-card rounded-2xl p-1 shadow-2xl"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-2 text-xs text-muted-foreground font-mono">
            Pull Request #142 — feat: add user authentication
          </span>
        </div>

        {/* Code content */}
        <div className="p-4 font-mono text-xs sm:text-sm space-y-3">
          {/* File header */}
          <div className="flex items-center gap-2 text-muted-foreground pb-2 border-b border-border/30">
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              src/auth/login.ts
            </span>
            <span className="text-xs">+24 -8</span>
          </div>

          {/* Code lines */}
          <div className="space-y-1">
            <CodeLine number={12} type="context">
              {`const validateUser = async (email: string) => {`}
            </CodeLine>
            <CodeLine number={13} type="removed">
              {`  const user = await db.query(email);`}
            </CodeLine>
            <CodeLine number={14} type="added">
              {`  const user = await db.query(sanitize(email));`}
            </CodeLine>
            <CodeLine number={15} type="context">
              {`  if (!user) throw new Error("Not found");`}
            </CodeLine>
          </div>

          {/* AI Review comment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                  Security Fix Detected
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Good catch! Sanitizing input prevents SQL injection attacks.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating notification card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute -right-4 top-1/2 glass-card rounded-xl p-3 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium">3 suggestions</p>
            <p className="text-xs text-muted-foreground">Ready to review</p>
          </div>
        </div>
      </motion.div>

      {/* Floating warning badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
        className="absolute -left-2 bottom-1/4 glass-card rounded-lg px-3 py-2 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-medium">1 warning</span>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Single line of code in the mockup.
 */
function CodeLine({
  number,
  type,
  children,
}: {
  number: number;
  type: "added" | "removed" | "context";
  children: React.ReactNode;
}) {
  const styles = {
    added: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    removed: "bg-red-500/10 text-red-700 dark:text-red-400 line-through opacity-60",
    context: "text-muted-foreground",
  };

  const prefix = {
    added: "+",
    removed: "-",
    context: " ",
  };

  return (
    <div className={`flex items-center rounded px-2 py-0.5 ${styles[type]}`}>
      <span className="w-6 text-muted-foreground/50 select-none">{number}</span>
      <span className="w-4 select-none">{prefix[type]}</span>
      <code className="flex-1 whitespace-pre">{children}</code>
    </div>
  );
}
