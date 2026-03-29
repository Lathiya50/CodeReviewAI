import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="absolute inset-0 bg-dot opacity-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-3xl" />

      <div className="relative text-center max-w-md animate-fade-in-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/50 mb-6">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="text-6xl font-bold text-gradient mb-4">404</div>

        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="default" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/repos">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
