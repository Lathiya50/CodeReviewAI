"use client";

import { useState } from "react";
import { linkSocial } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";

export function ConnectGithub() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    await linkSocial({
      provider: "github",
      callbackURL: window.location.href,
    });
  };

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/50 mb-4">
        <GitHubIcon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">Connect your GitHub account</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
        Link your GitHub account to import repositories and enable AI code reviews.
      </p>
      <Button
        onClick={handleConnect}
        disabled={loading}
        className="mt-5 gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GitHubIcon className="h-4 w-4" />
        )}
        Connect GitHub
      </Button>
    </div>
  );
}
