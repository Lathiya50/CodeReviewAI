"use client";

import Link from "next/link";
import { Code2, Sparkles } from "lucide-react";

/**
 * CodeReviewAI logo component with icon and text.
 * Features a code bracket icon with AI sparkle accent.
 * @param props.showText - Whether to show the text (default: true)
 * @param props.size - Size variant: "sm" | "default" | "lg"
 * @returns JSX.Element - Logo component
 */
export function Logo({
  showText = true,
  size = "default",
}: {
  showText?: boolean;
  size?: "sm" | "default" | "lg";
}) {
  const sizes = {
    sm: {
      icon: "h-5 w-5",
      sparkle: "h-2 w-2",
      sparklePosition: "-top-0.5 -right-0.5",
      text: "text-base",
      container: "h-7 w-7",
    },
    default: {
      icon: "h-6 w-6",
      sparkle: "h-2.5 w-2.5",
      sparklePosition: "-top-0.5 -right-0.5",
      text: "text-xl",
      container: "h-9 w-9",
    },
    lg: {
      icon: "h-8 w-8",
      sparkle: "h-3 w-3",
      sparklePosition: "-top-1 -right-1",
      text: "text-2xl",
      container: "h-11 w-11",
    },
  };

  const s = sizes[size];

  return (
    <Link href="/" className="flex items-center gap-2 group">
      {/* Logo icon */}
      <div className="relative">
        {/* Gradient background container */}
        <div
          className={`${s.container} rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow duration-300`}
        >
          <Code2 className={`${s.icon} text-white`} />
        </div>

        {/* AI sparkle accent */}
        <div
          className={`absolute ${s.sparklePosition} ${s.sparkle} rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse`}
        >
          <Sparkles className="h-1.5 w-1.5 text-white" />
        </div>
      </div>

      {/* Logo text */}
      {showText && (
        <div className={`${s.text} font-bold tracking-tight`}>
          <span className="text-foreground">Code</span>
          <span className="text-foreground">Review</span>
          <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            AI
          </span>
        </div>
      )}
    </Link>
  );
}
