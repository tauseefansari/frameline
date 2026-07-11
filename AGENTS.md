<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Frameline — Agent Instructions

These rules apply to every AI coding agent working in this repo (GitHub Copilot, Claude Code, Cursor, Codex, etc.). Keep changes minimal, typed, and consistent with the patterns already in the codebase.

## Stack snapshot

- **Next.js 16.2** (App Router, Turbopack), **React 19.2**, **TypeScript 5** (strict).
- **MUI v9** + **Emotion** for components/theming, **Tailwind v4** (PostCSS) for utilities.
- **next-intl v4** with cookie-based locale (no URL prefix). Messages live in `locales/<lang>/*.json`.
- **Local model stack** for all AI features — no cloud APIs:
  - **Ollama** (HTTP @ `localhost:11434`) hosting a multi-image vision model (default `minicpm-v:8b` — MiniCPM-V 2.6, built for video / multi-image understanding) for `/api/script`.
  - **Piper** CLI for offline text-to-speech, voices under `models/piper/voices/`.
- **fluent-ffmpeg** + `ffmpeg-static` + `@ffprobe-installer/ffprobe` for video pipelines.
- **Zod v4** for all API input validation.
- **GSAP 3** + **Motion v12** for home page scroll/reveal animations.

## Project layout (authoritative)

```
app/                   # App Router pages + API routes
  api/script           # POST: Ollama vision → narration script
  api/tts              # POST: Piper TTS → audio/mpeg
  api/video/render     # POST: one-pass trim + mux + burn captions (from user-supplied segments)
  api/video/cut        # POST: ffmpeg trim (download)
  api/video/clip       # POST: ffmpeg trim (inline; staged into the library)
  api/video/concat     # POST: multi-clip merge
scripts/
  setup-models.mjs     # Cross-platform installer: ollama pull + Piper
models/                # Local LLM weights + binaries (gitignored)
components/
  common/                # cross-feature primitives (RevealOnScroll, …)
  home/                  # Homepage + scroll-reveal (GSAP/Motion); `theme-visuals.ts` (home-only gradients incl. `glassPaperBg`)
  studio/                # Workspace, library, timeline, merge, AudioPlayer, TimecodeSpinner, StudioTabPanel
  layout/              # AppShell
  providers/           # AppRouterProviders (top-level client provider tree)
  theme/               # MUI theme provider + color-mode context/hook
  toast/               # ToastProvider + ToastContext
  feedback/            # GlobalProgressBar
  i18n/                # HtmlLang
lib/
  ffmpeg/              # `pipeline.ts` + `operations.ts` (single-pass builder)
  providers/           # `ollama.provider.ts`, `piper.provider.ts`,
                       # `local-voice.provider.ts` (combined AIVoiceProvider)
  api/                 # `route-helpers.ts` + `temp-session.ts` (multipart + temp lifecycle)
  validation/api.ts    # Zod schemas (the only source of truth for API shapes;
                       #   exports `transcriptSegmentSchema` for reuse across routes)
  constants/           # piper voices, studio + ui tunables
  format/              # `formatTimecode`, `formatMegabytes`, `countWords`, `downloadBlob`, `syncTranscriptTimestamps`
  studio/              # `api-client.ts`, `clip-utils.ts` (createClipId / getEffectiveDuration / isFullClipRange)
  toast/types.ts       # `ToastSeverity`, `ToastInput`, `ToastApi` (lib-side types only)
  video/               # `captions.server.ts` (server), `thumbnail.client.ts` (client)
  i18n/                # cookie locale, message loader, routing
  hooks/                 # client-only hooks (`use-*.ts`) — includes `useClipLibrary`, `useStudioActions`, `useApiAction`, `useGlobalProgress`, …
  theme/               # design tokens + MUI theme factory + color-mode enum
  types/studio.ts      # shared studio domain types
locales/<lang>/        # next-intl message bundles
```

Do not invent new top-level folders. Place new code beside its peers.

## Hard rules

1. **Read Next.js 16 docs in `node_modules/next/dist/docs/` before touching routing, caching, or `next.config.ts`.** Do not assume Next 14/15 behavior.
2. **All AI runs locally.** No cloud APIs, no SDKs that phone home. Vision goes through `lib/providers/ollama.provider.ts`, TTS through `lib/providers/piper.provider.ts`. Routes consume the unified `createLocalVoiceProvider()`. The Ollama provider also runs a one-shot **shortfall recovery** retry when the model under-fills the runtime at the target WPM, and strips unclosed `(Visuals …` stage directions before they reach Piper — keep both behaviours when editing.
3. **`process.env` is read only inside `lib/config/env.ts`.** Never reference it from `app/**/page.tsx`, `components/**`, or `lib/hooks/**`. Server-only paths (Piper binaries, model files) come from `getServerEnv()` helpers.
4. **Validate every API request with Zod** using schemas from `lib/validation/api.ts`. Errors must throw `AppError` (`lib/errors/app-error.ts`) so `route-helpers.ts` can serialize them with stable `code`s localized in `locales/*/errors.json`.
5. **Never bundle native binaries.** `fluent-ffmpeg`, `ffmpeg-static`, and `@ffprobe-installer/ffprobe` are pinned in `serverExternalPackages` (see `next.config.ts`). Do not import them from client components.
6. **All ffmpeg work goes through `lib/ffmpeg/pipeline.ts`.** Compose new steps as operations under `lib/ffmpeg/operations/` so each request is a single ffmpeg run. No chained client→server round trips.
7. **Temp files** for uploads/renders must use `lib/fs/temp-session.ts` so cleanup is guaranteed. Never write to repo paths or `os.tmpdir()` directly from a route.
8. **i18n**: user-facing strings come from `next-intl` messages. Do not hardcode English in components. Add new keys to every `locales/<lang>/*.json` file.
9. **Theming**: use MUI's `sx`, theme tokens from `lib/theme/design-tokens.ts`, and the color-mode context. Tailwind utilities are allowed but should not duplicate theme tokens.
10. **Client/server boundary**: a file is server-only by default in App Router. Add `"use client"` only when you need state, effects, refs, or browser APIs. Hooks under `lib/hooks/` are client-only.
11. **Type safety**: no `any`, no non-null `!` on values that can actually be null, no `as` casts to silence the compiler. Prefer Zod-inferred types for API payloads and the types in `lib/types/studio.ts` for domain objects.
12. **Every client→server call routes through `lib/api/endpoints.ts`.** Use `apiFetch(ENDPOINTS.foo, ...)` or `buildApiUrl(...)`; never hand-write `/api/...` strings in components or hooks.
13. **No magic numbers in components.** Tunables live under `lib/constants/{studio,audio,captions,transcript,vision,ui}.ts`. Add new constants there and import — do not inline literals like `0.05`, `4000`, or `"5m"`.
14. **Loading UX is centralized.** Long-running API calls are tracked by `lib/hooks/use-global-progress.tsx` (the strip is mounted by `components/theme/GlobalProgressBar.tsx` inside `AppShell`). Per-section feedback uses MUI `Skeleton` (theme-aware light/dark). Do **not** add per-button `CircularProgress` or per-panel `LinearProgress`; `useApiAction` already pings the global bar.
15. **Audio surfaces use `components/studio/MuiAudioPlayer.tsx`** (wavesurfer.js v7, lazy-loaded). Never ship `<audio controls>` in committed UI.
16. **User-visible feedback uses toasts.** Wrap `useToast()` and emit `toast.success/info/error` for video selection, replacement, clip add/remove, intro detection, processing-done — keys live under `studio.toasts.*`.

## Coding conventions

- **File naming**: components `PascalCase.tsx`; hooks/utilities `kebab-case.ts`; prefer named exports except for route/page-level shells.
- **Imports**: absolute via the existing `tsconfig.json` paths; group as `react/next` → third-party → `@/lib` → `@/components` → relative.
- **Styles**: keep home animation logic in `components/home/*` and respect `use-reduced-motion-flag.ts`. Use `RevealOnScroll` from `components/common/` for the standard fade-up-on-enter pattern instead of hand-rolling `motion.div` + `whileInView`.
- **Errors thrown to clients** must be `AppError` with a known `code`. Bare `Error` leaks messages.
- **Console**: no `console.log` in committed code. Use `console.warn` / `console.error` sparingly on the server.
- **Comments**: explain _why_, not _what_. Do not add docstrings to code you didn't change.

## Testing & quality gates

- Lint: `npm run lint` (eslint flat config, `eslint-config-next`) — runs with `--max-warnings=0`, so any warning fails the gate. `npm run lint:fix` does the same with `--fix` to auto-resolve what it can.
- Type check: `npm run type:check` (`tsc --noEmit`).
- Format: `npm run format:check` (Prettier + tailwind plugin).
- Build: `npm run build` must pass before declaring a task done.
- **Pre-commit hook**: Husky + `lint-staged` auto-format staged files, then run `npm run lint:fix` and `npm run type:check`. Don't bypass with `--no-verify`.
- There is no unit test runner wired up yet — do **not** invent a Jest/Vitest config unless explicitly asked. If you add tests, use Node's built-in `node:test` and keep them hermetic (mock the local providers and ffmpeg).

## When adding a new API route

1. Define request/response schemas in `lib/validation/api.ts`.
2. Add localized error codes to `locales/*/errors.json` and `locales/*/api.json` if user-visible.
3. Use `route-helpers.ts` for multipart parsing + temp-session lifecycle.
4. Keep handlers in `app/api/.../route.ts` thin; push logic into `lib/`.
5. Update the API table in `README.md`.

## When touching the studio UI

- Editor state lives in `components/studio/StudioWorkspace.tsx` and the hooks in `lib/hooks/`. Do not duplicate it. Clip CRUD lives in `useClipLibrary`; long-running action wiring lives in `useStudioActions`. Tab panels render through `StudioTabPanel`.
- Studio API calls go through `lib/studio/api-client.ts`.
- Tunables (trim limits, supported MIME types, etc.) belong in `lib/constants/studio.ts`.

## Security

- Server-only secrets via `lib/config/env.ts`; nothing else reads `process.env`.
- `next.config.ts` sets `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` — preserve them.
- Validate file MIME and size at the route boundary before handing bytes to ffmpeg.
- Never echo upload paths or API keys in error messages.

## Documentation

- Update `README.md` whenever you change an API contract, env var, npm script, or top-level architecture.
- Keep this file (`AGENTS.md`) authoritative; `CLAUDE.md` and `.github/copilot-instructions.md` are thin pointers to it.
