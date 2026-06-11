"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { fadeInUp } from "@/lib/motion";
import { AnimatedPage } from "@/components/ui/animated-page";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cpu,
  KeyRound,
  Loader2,
  Lock,
  MessageSquareText,
  Trash2,
  ExternalLink,
} from "lucide-react";

const MAX_INSTRUCTIONS = 4_000;

type ProviderName = "groq" | "openai" | "anthropic" | "gemini";

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery();
  const providersQuery = trpc.settings.providers.useQuery();

  const [provider, setProvider] = useState<ProviderName>("groq");
  const [model, setModel] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  // Seed the form from the saved settings the first time they arrive. Done at
  // render time (not in an effect) — the React-recommended way to derive state
  // from changing data without triggering cascading effect renders.
  const [seededFrom, setSeededFrom] = useState<unknown>(undefined);
  if (settingsQuery.data && seededFrom !== settingsQuery.data) {
    setSeededFrom(settingsQuery.data);
    setProvider(settingsQuery.data.provider);
    setModel(settingsQuery.data.model ?? "");
    setInstructions(settingsQuery.data.customInstructions ?? "");
  }

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: async () => {
      toast.success("Settings saved");
      setApiKey("");
      await utils.settings.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeKeyMutation = trpc.settings.removeApiKey.useMutation({
    onSuccess: async () => {
      toast.success("API key removed");
      await utils.settings.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const providers = providersQuery.data ?? [];
  const activeProvider = providers.find((p) => p.name === provider);
  const models = activeProvider?.models ?? [];

  // A saved key exists for the *currently selected* provider only when the
  // saved settings match the selection (get() scopes the flag to the saved provider).
  const savedKeyForProvider =
    settingsQuery.data?.hasApiKey && settingsQuery.data.provider === provider;
  const apiKeyLast4 = savedKeyForProvider ? settingsQuery.data?.apiKeyLast4 : null;

  const handleProviderChange = (value: string) => {
    const next = value as ProviderName;
    setProvider(next);
    // Reset the model to that provider's default; clear any typed key.
    const cfg = providers.find((p) => p.name === next);
    setModel(cfg?.defaultModel ?? "");
    setApiKey("");
  };

  const handleSave = () => {
    updateMutation.mutate({
      provider,
      model: model || null,
      customInstructions: instructions || null,
      apiKey: apiKey.trim() ? apiKey.trim() : undefined,
    });
  };

  const isLoading = settingsQuery.isLoading || providersQuery.isLoading;

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="AI Settings"
          description="Choose your AI provider and model, bring your own API key, and add custom review instructions."
        />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Provider + model */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    Provider & Model
                  </CardTitle>
                  <CardDescription>
                    The model used for your reviews. Defaults to Groq when left unchanged.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={provider} onValueChange={handleProviderChange}>
                      <SelectTrigger id="provider" className="w-full">
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activeProvider && (
                      <p className="text-xs text-muted-foreground">
                        {activeProvider.appKeyAvailable
                          ? "An app key is available — works without your own key."
                          : "Requires your own API key (no app key configured)."}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model" className="w-full">
                        <SelectValue placeholder="Provider default" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* API key */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    API Key
                  </CardTitle>
                  <CardDescription>
                    Bring your own key (optional). Stored encrypted — it&apos;s never shown again.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedKeyForProvider && (
                    <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm">
                        <Lock className="h-3.5 w-3.5 text-success" />
                        <span className="font-mono tracking-widest">
                          ••••••••{apiKeyLast4}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive gap-1.5"
                        onClick={() => removeKeyMutation.mutate()}
                        disabled={removeKeyMutation.isPending}
                      >
                        {removeKeyMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Remove
                      </Button>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="apiKey">
                      {savedKeyForProvider ? "Replace key" : "API key"}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      autoComplete="off"
                      placeholder={
                        activeProvider
                          ? `Paste your ${activeProvider.label} API key`
                          : "Paste your API key"
                      }
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    {activeProvider && (
                      <a
                        href={activeProvider.apiKeySignupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Get a {activeProvider.label} key
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Custom instructions */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-primary" />
                    Custom Instructions
                  </CardTitle>
                  <CardDescription>
                    House rules injected into every review prompt (e.g. &quot;we use 2-space indent, focus on security&quot;).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    value={instructions}
                    onChange={(e) =>
                      setInstructions(e.target.value.slice(0, MAX_INSTRUCTIONS))
                    }
                    placeholder="Add any team conventions or review focus areas…"
                    className="min-h-32"
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {instructions.length} / {MAX_INSTRUCTIONS}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save settings
              </Button>
            </div>
          </>
        )}
      </div>
    </AnimatedPage>
  );
}
