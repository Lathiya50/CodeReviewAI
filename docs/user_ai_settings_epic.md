# ⚙️ CodeReviewAI — User AI Settings (Model + API Key + Custom Instructions) Epic

> **Goal:** Give every user a **Settings** page (reachable from the user menu, just above *Sign out*) where they can **choose the AI provider/model**, **bring their own API key**, and **add custom instructions** that get injected into the review prompt. When the user provides nothing, the app keeps working on its **default Groq key/model** exactly as today.

---

## 📌 Status

> **Status (2026-06-09): 📝 Proposed — awaiting approval.** No code written yet. Open Questions below are resolved per the product decisions captured in this epic header; implementation order is at the end.

| Field | Value |
| ----- | ----- |
| Type | Feature (user-configurable AI) |
| Priority | High (unlocks BYO-key + tailored reviews; removes shared-key cost ceiling) |
| Risk | Medium (handles **secret API keys**; touches the core review pipeline) |
| Depends on | Existing AI provider/registry layer + Inngest review job (already built) |
| DB migration | **Yes** — new `UserAiSettings` model (1:1 with `User`) |
| New env var | **Yes** — `SETTINGS_ENCRYPTION_KEY` (32-byte key for at-rest encryption); optionally `ANTHROPIC_API_KEY` as an app-level default |
| New dependency | Anthropic provider (via `@anthropic-ai/sdk` or native `fetch`) |

---

## 🎯 Problem Statement

Today the AI review is **completely fixed**:

1. **Provider/model is hardcoded to the default.** `reviewCode()` accepts an optional `providerName`, but the Inngest job (`review-pr.ts`) **never passes one** → every review runs on `groq` with `llama-3.3-70b-versatile` (primary) / `llama-3.1-8b-instant` (fallback). Users cannot pick OpenAI or Claude, and cannot pick a specific model.
2. **API keys come only from env.** Providers are built by factories that read `GROQ_API_KEY` / `OPENAI_API_KEY` from `process.env`. Every user shares the app owner's keys and rate limits — there's no way to bring your own key, and the owner pays for everyone.
3. **The system prompt is hardcoded.** `SYSTEM_PROMPT` in `review.ts` is a single string. There's no way for a user to say "we use 2-space indent / focus on security / ignore generated files / our team's conventions are X."

The user expectation: *open Settings once → pick a model, paste my key (optional), write house rules → every review I run uses them.*

---

## 🔍 Current State (what already exists — do NOT rebuild)

| Capability | File | Status |
| ---------- | ---- | ------ |
| Provider config (groq, openai) + default | `src/constant/ai.ts` | ✅ `PROVIDER_CONFIGS` with `primaryModel`/`fallbackModel`, `apiKeyEnvVar`, signup URL. `DEFAULT_PROVIDER = "groq"`. |
| Provider registry + cache | `src/server/services/ai/registry.ts` | ✅ `getProvider(name)` returns a **singleton cached by name**; factories read keys from env. |
| Groq provider | `src/server/services/ai/providers/groq.ts` | ✅ Class **already takes `apiKey` + `baseUrl` in its constructor** (factory just wires env). |
| OpenAI provider | `src/server/services/ai/providers/openai.ts` | ✅ Class **already takes `apiKey` + `baseURL`** (SDK-based). |
| Review orchestrator | `src/server/services/ai/review.ts` | ✅ `reviewCode(prTitle, files, providerName?)`. Hardcoded `SYSTEM_PROMPT`; primary→fallback model loop with retry/backoff. |
| Inngest review job | `src/server/inngest/functions/review-pr.ts` | ⚠️ Calls `reviewCode(pr.title, files)` with **no provider/model/instructions**. |
| User menu (Sign out) | `src/components/user-menu.tsx` | ✅ Dropdown with avatar + Sign out. **No Settings entry.** |
| tRPC root | `src/server/api/root.ts` | ✅ `repository` / `pullRequest` / `review` / `analytics` routers. **No `settings` router.** |
| `User` model | `prisma/schema.prisma` | ⚠️ Auth fields only. **No AI settings.** |

**Net:** the provider classes already accept an injected key, and `reviewCode` already accepts a provider name. The missing pieces are: **(a) a place to store the user's choices + key (encrypted)**, **(b) a Claude provider**, **(c) plumbing that resolves a user's settings and threads provider+model+key+instructions into the review**, and **(d) the Settings UI**.

---

## ✅ Proposed Solution (high level)

### 1. Store per-user AI settings (new `UserAiSettings` table, 1:1 with `User`)
Provider (`GROQ | OPENAI | ANTHROPIC`), selected model, an **encrypted API key** (+ masked `last4` for display), and free-text **custom instructions**. All fields optional → an empty row means "use app defaults."

### 2. Add a Claude/Anthropic provider
Mirror the existing provider pattern: a config entry in `PROVIDER_CONFIGS`, a provider class taking an injected `apiKey`, and a registry registration. Default models e.g. `claude-opus-4-8` (primary) / `claude-haiku-4-5` (fallback). *(Confirm exact model ids against the Claude API reference at build time.)*

### 3. Resolve settings → thread them through the review pipeline
- Extend `PROVIDER_CONFIGS` with a **selectable model list** per provider (the UI needs choices beyond just primary/fallback).
- Change `reviewCode()` to take a **resolved config object** `{ provider, model, apiKey?, customInstructions? }` instead of a bare `providerName`.
- Add a **non-cached** provider instantiation path: when a user key is present, build a **fresh** provider instance with that key (never cache user-keyed instances — that would leak keys across users). Keep the env-based singleton cache only for the app-default path.
- Inject `customInstructions` into the system prompt inside a clearly delimited block.

### 4. Wire the Inngest job to load + apply settings
`review-pr.ts` loads the PR author/owner's `UserAiSettings`, resolves the effective config (user key → app env key → error), and passes it to `reviewCode`. **The decrypted key is read and used *inside* the `generate-review` step — it is never returned from a step** (Inngest persists step return values; a decrypted secret must not land in that store).

### 5. Settings UI under the user menu
A `/settings` page (dashboard route group) with: provider select → dependent model select → API key input (masked, shows `••••last4`, with a "Remove key" action) → custom-instructions textarea (with char counter + cap). Add a **Settings** item to `UserMenu` directly above *Sign out*.

---

## 🗄️ Data Model Changes

### New model: `UserAiSettings` (1:1 with `User`)

```prisma
model UserAiSettings {
  id                 String     @id @default(cuid())
  userId             String     @unique
  user               User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider           AiProvider @default(GROQ)   // GROQ | OPENAI | ANTHROPIC
  model              String?                      // selected model id; null => provider default

  // ── Encrypted API key (AES-256-GCM). Plaintext NEVER stored or returned. ──
  apiKeyCiphertext   String?    @db.Text          // base64(iv):base64(authTag):base64(ciphertext)
  apiKeyLast4        String?                       // last 4 chars, for masked display only
  apiKeyProvider     AiProvider?                   // which provider the saved key belongs to

  customInstructions String?    @db.Text           // appended to the system prompt (length-capped in app)

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
}

enum AiProvider {
  GROQ
  OPENAI
  ANTHROPIC
}
```

Add the back-relation on `User`:

```prisma
model User {
  // ... existing fields ...
  aiSettings UserAiSettings?
}
```

> **Why a separate 1:1 table** (vs. columns on `User`): keeps the auth/`User` table clean, scopes the sensitive key column away from the row read on every auth check, and makes the encrypted blob easy to find/rotate.

> **Single saved key for the active provider.** The MVP stores **one** encrypted key, tagged with `apiKeyProvider`. If the user switches provider, the UI prompts for that provider's key. *(Storing a key per provider — a `UserProviderKey` child table — is a clean follow-up; see Out of Scope.)*

> **Encryption format:** `apiKeyCiphertext` is `iv:authTag:ciphertext` (each base64). Encryption key comes from `SETTINGS_ENCRYPTION_KEY` (32 raw bytes, provided as base64/hex in env). Decryption happens only at review time.

**Migration:** purely additive (new table + back-relation + enum). No backfill — users with no row get app defaults.

---

## 🔧 Change Set (file by file)

| # | File | Change |
| - | ---- | ------ |
| 1 | `prisma/schema.prisma` | Add `UserAiSettings` model + `AiProvider` enum + `User.aiSettings` back-relation. Run `prisma migrate dev` (stop `next dev`/`inngest dev` first on Windows — see Prisma Windows lock note). |
| 2 | `src/server/services/crypto.ts` **(new)** | `encryptSecret(plaintext): string` / `decryptSecret(blob): string` using AES-256-GCM keyed by `SETTINGS_ENCRYPTION_KEY`. Throw a clear error if the env key is missing/wrong length. Never log plaintext. |
| 3 | `src/constant/ai.ts` | Add an `anthropic` entry to `PROVIDER_CONFIGS` (`apiKeyEnvVar: "ANTHROPIC_API_KEY"`, signup URL, primary/fallback models). Add a **`availableModels: readonly string[]`** field to every provider config (the selectable list for the UI). |
| 4 | `src/server/services/ai/providers/anthropic.ts` **(new)** | `AnthropicProvider` implementing `AiProvider` (constructor takes `apiKey`), `chat()` returning JSON content. `createAnthropicProvider()` factory reading env. Mirror groq/openai error+status shape so the orchestrator's retry logic still works. |
| 5 | `src/server/services/ai/registry.ts` | Register `anthropic`. Add `instantiateProvider(name, apiKey?)`: if `apiKey` given, return a **fresh, uncached** provider built with that key; else fall back to the cached env factory. Keep `getProvider` (cached) for the default path. |
| 6 | `src/server/services/ai/types.ts` | Add `availableModels` to `AiProviderConfig`. Add a `ResolvedAiConfig` type `{ provider: ProviderName; model?: string; apiKey?: string; customInstructions?: string }`. |
| 7 | `src/server/services/ai/review.ts` | Change `reviewCode(prTitle, files, config?: ResolvedAiConfig)`. Build the provider via `instantiateProvider(config.provider, config.apiKey)`. Use `config.model` as primary (fallback stays the provider's configured fallback). Inject `config.customInstructions` into the system prompt inside a delimited `## Additional reviewer instructions` block. Keep chunking/retry/fallback unchanged. |
| 8 | `src/server/services/ai/settings.ts` **(new)** | `resolveUserAiConfig(userId): Promise<ResolvedAiConfig>`: load `UserAiSettings`; pick provider+model; decrypt the key **only if** it belongs to the selected provider; if no user key, leave `apiKey` undefined so the env-default path is used. Validate `model` ∈ provider `availableModels` (ignore/repair invalid). |
| 9 | `src/server/inngest/functions/review-pr.ts` | In the `generate-review` step, call `resolveUserAiConfig(userId)` and pass the result to `reviewCode`. **Decrypt inside this step; do not return the key from any step.** |
| 10 | `src/server/api/routers/settings.ts` **(new)** | `protectedProcedure` router: `get` → returns `{ provider, model, customInstructions, hasApiKey, apiKeyLast4 }` (**never** the raw key); `update` → `{ provider, model?, customInstructions?, apiKey? }` (encrypt+store key, set `last4`+`apiKeyProvider`, validate model ∈ provider list, cap instructions length); `removeApiKey` → clears the key fields. Optionally `providers` → returns provider/model catalog for the UI. |
| 11 | `src/server/api/root.ts` | Mount `settings: settingsRouter`. |
| 12 | `src/app/(dashboard)/settings/page.tsx` **(new)** | Settings page: provider select → dependent model select → masked API-key input (+ Remove) → custom-instructions textarea (counter + cap) → Save. Uses the `settings` tRPC router; shows `••••last4` when a key is saved. |
| 13 | `src/components/user-menu.tsx` | Add a **Settings** `DropdownMenuItem` (gear icon, `Link href="/settings"`) **above** the separator/Sign out. |
| 14 | `.env` / docs | Document `SETTINGS_ENCRYPTION_KEY` (how to generate 32 bytes) and optional `ANTHROPIC_API_KEY` app default. Note default behavior when unset. |

---

## 🔁 Effective-Config Resolution (the core rule)

For a given review, the effective config is resolved per **selected provider**:

```
load UserAiSettings(userId)            (may be null → all defaults)
        │
        ▼
provider = settings.provider ?? GROQ
model    = settings.model (if ∈ availableModels[provider]) ?? provider.primaryModel
        │
        ▼
apiKey resolution:
  ├─ settings has a saved key AND settings.apiKeyProvider == provider
  │       → decrypt it, use the USER key  ✅
  ├─ else app env key for that provider exists (process.env[apiKeyEnvVar])
  │       → use the APP key
  └─ else  → error: "Add your <provider> API key in Settings"
            (note: GROQ always works because the app ships a default GROQ_API_KEY)
        │
        ▼
customInstructions = settings.customInstructions (capped) — injected into system prompt
```

This satisfies the product rule: **user key/model if provided, otherwise the default Groq key/model.**

---

## 🔐 Security & Correctness Considerations

1. **Encrypt at rest.** API keys are stored only as AES-256-GCM ciphertext (`SETTINGS_ENCRYPTION_KEY`). The plaintext key is **never** persisted, logged, or returned to the client.
2. **Never echo the key back.** `settings.get` returns only `hasApiKey` + `apiKeyLast4`. The full key cannot be read back via any API.
3. **Don't persist the key in Inngest step state.** Decrypt and use the key **inside** the `generate-review` step; never return it from a `step.run` (Inngest persists step outputs durably).
4. **Don't cache user-keyed providers.** `instantiateProvider(name, apiKey)` returns a fresh instance — only the env-default providers stay in the singleton cache, so one user's key can never be served to another.
5. **Model allowlist.** `update` and `resolveUserAiConfig` validate `model ∈ availableModels[provider]`. Prevents arbitrary/expensive model ids and provider/model mismatches.
6. **Custom-instruction hygiene.** Cap length (e.g. ≤ 4,000 chars) so a huge blob can't blow the prompt budget; inject inside a clearly delimited block so it can't silently override the structured-JSON contract. Prompt-injection risk is self-scoped (it only affects the user's own review), but still keep the JSON-output instruction last/authoritative.
7. **Encryption-key rotation.** If `SETTINGS_ENCRYPTION_KEY` changes, existing ciphertext won't decrypt → treat decryption failure as "no usable key" and fall back to the app key (don't crash the review). Document rotation as ops-only.
8. **Missing env key on startup.** If `SETTINGS_ENCRYPTION_KEY` is absent, the **Settings save (key path)** must fail with a clear message; reviews on the default Groq path keep working.

---

## ✅ Acceptance Criteria

1. A **Settings** entry appears in the user menu directly above *Sign out* and routes to `/settings`.
2. The settings page lets a user pick a **provider** (Groq / OpenAI / Claude) and a **model** from that provider's list; the model list updates when the provider changes.
3. A user can **save an API key**; it is stored **encrypted** (verified: DB column is ciphertext, not the raw key) and shown afterward only as `••••last4`. The raw key is never returned by any tRPC call.
4. A user can **remove** their saved key, reverting to the app default.
5. A user can save **custom instructions**; a subsequent review's prompt includes them (verifiable via the AI-review log / behavior).
6. With a user key + model set, a review runs on **that provider/model using the user's key**.
7. With **no** settings (or no key), reviews run on the **default Groq key/model** exactly as before (no regression).
8. Selecting OpenAI/Claude **without** a key and **without** a configured app env key for that provider produces a clear "add your key" error — it does **not** silently fall back or crash.
9. The decrypted key never appears in Inngest step output, logs, or any API response.
10. The new **Anthropic/Claude** provider produces valid structured-JSON reviews through the same orchestrator (chunking + retry + fallback).
11. `pnpm lint` + `pnpm build` pass; the Prisma migration applies cleanly.

---

## 🛡️ No-Regression / "Don't Break the Flow" Checklist

- [ ] Existing reviews with no `UserAiSettings` row behave identically to today (default Groq).
- [ ] `reviewCode` signature change is updated at **all** call sites (Inngest job + any manual trigger).
- [ ] The env-default provider cache (`getProvider`) is untouched for the default path; only the new user-keyed path is uncached.
- [ ] Auto-review-on-push (webhook → Inngest) still works and now honors the owner's settings.
- [ ] Manual `review.trigger` / `review.postToGithub` flow unaffected.
- [ ] Existing groq/openai providers' behavior unchanged when called via env factory.
- [ ] No secret (API key) is written to logs, Inngest step state, or any client response.

---

## 🚀 Rollout / Ops

- Generate and set `SETTINGS_ENCRYPTION_KEY` (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) **before** deploy.
- (Optional) set `ANTHROPIC_API_KEY` if you want Claude usable without each user bringing a key; otherwise Claude requires a user key.
- Migration is additive; no backfill. Ship UI + pipeline together so a saved setting is actually honored.

---

## 🧭 Manual QA Plan

| Step | Action | Expected |
| ---- | ------ | -------- |
| 1 | Open user menu | "Settings" shows above "Sign out"; opens `/settings` |
| 2 | Pick OpenAI, change model | Model list switches to OpenAI models |
| 3 | Save a key + instructions, reload | Key shows as `••••last4`; instructions persist; DB stores ciphertext |
| 4 | Run a review | Uses chosen provider/model + user key; prompt includes custom instructions |
| 5 | Remove key, run review | Falls back to app default (Groq if OpenAI/Claude key absent) |
| 6 | Pick Claude with a valid key, run review | Valid structured review via Anthropic |
| 7 | Pick OpenAI, no user key, no app `OPENAI_API_KEY`, run review | Clear "add your key" error; no crash |
| 8 | New user, no settings, run review | Default Groq path, identical to pre-feature behavior |
| 9 | Inspect Inngest run + logs | No plaintext key anywhere |

---

## 📂 Files Touched (summary)

```
prisma/schema.prisma                                  # UserAiSettings model + AiProvider enum + User relation + migration
src/server/services/crypto.ts            (new)        # AES-256-GCM encrypt/decrypt
src/constant/ai.ts                                    # anthropic config + availableModels per provider
src/server/services/ai/providers/anthropic.ts (new)   # Claude provider
src/server/services/ai/registry.ts                    # register anthropic + instantiateProvider(name, apiKey?)
src/server/services/ai/types.ts                       # availableModels + ResolvedAiConfig
src/server/services/ai/review.ts                      # reviewCode(config) + custom-instruction injection
src/server/services/ai/settings.ts       (new)        # resolveUserAiConfig(userId)
src/server/inngest/functions/review-pr.ts             # load+apply settings inside generate-review step
src/server/api/routers/settings.ts        (new)       # get / update / removeApiKey (+ providers catalog)
src/server/api/root.ts                                # mount settings router
src/app/(dashboard)/settings/page.tsx     (new)       # Settings UI
src/components/user-menu.tsx                           # Settings menu item above Sign out
.env / docs                                            # SETTINGS_ENCRYPTION_KEY + ANTHROPIC_API_KEY notes
```

---

## ❓ Open Questions (resolved — kept for the record)

1. **BYO key behavior** → ✅ Optional; use the user's key/model if set, else default **Groq** key/model.
2. **Providers** → ✅ Groq, OpenAI, **Claude/Anthropic** (new provider).
3. **Key storage** → ✅ **Encrypt at rest** (AES-256-GCM, `SETTINGS_ENCRYPTION_KEY`).
4. **Scope** → ✅ **Global per-user** (one settings page under the user menu).

Remaining nit to confirm at build time:
- **Exact Claude model ids** for primary/fallback and the selectable list (verify against the current Claude API reference).

---

## 🚫 Out of Scope (this epic)

- **Per-repo overrides** of model/instructions (global per-user only).
- **Storing a key per provider** (a `UserProviderKey` child table) — MVP stores one key for the active provider; switching providers re-prompts.
- A **"test my key / test connection"** button (nice follow-up; resolution + error messaging cover the basics).
- **Temperature / max-tokens / other tuning** knobs in the UI.
- **Org/team-shared** settings or billing/usage metering per user.
- **Encryption-key rotation tooling** (manual ops only for now).
- **Free-form arbitrary model ids** beyond each provider's curated `availableModels` list.

---

## ⏭️ Next Step

Approve, then implement in this order:

1. Prisma `UserAiSettings` + `AiProvider` enum + migration.
2. `crypto.ts` (encrypt/decrypt) + `SETTINGS_ENCRYPTION_KEY`.
3. Anthropic provider + `availableModels` in `PROVIDER_CONFIGS` + registry `instantiateProvider`.
4. `reviewCode(config)` refactor + custom-instruction injection.
5. `resolveUserAiConfig` + wire into the Inngest `generate-review` step.
6. `settings` tRPC router + mount in root.
7. Settings page UI + user-menu entry.
8. QA per the plan above; set env vars; deploy.
