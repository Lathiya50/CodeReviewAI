import Link from "next/link";
import type { Metadata } from "next";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-background">
      {/* Animated illustration */}
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-pulse rounded-full bg-muted/50" />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-muted ring-1 ring-border">
          <FileQuestion className="size-12 text-muted-foreground" />
        </div>
      </div>

      <h1 className="text-6xl font-bold tracking-tighter text-foreground/20">
        404
      </h1>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">
        Page not found
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved. Double-check the URL or head back to a familiar place.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Button asChild className="gap-2">
          <Link href="/">
            <Home className="size-4" />
            Home
          </Link>
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/repos">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
