import fs from "fs";
import path from "path";
import { z } from "zod";
import { OLLAMA_DEFAULT_BASE_URL, OLLAMA_DEFAULT_VISION_MODEL } from "@/lib/constants/vision";
import { PiperVoiceId } from "@/lib/constants/piper-voices";

/** Possible Node.js runtime modes. Mirrors the canonical `NODE_ENV` values. */
type NodeEnv = "development" | "production" | "test";

function getNodeEnv(): NodeEnv {
  const raw = process.env.NODE_ENV;
  if (raw === "production" || raw === "test") return raw;
  return "development";
}

export function isDevelopment(): boolean {
  return getNodeEnv() === "development";
}

export function isProduction(): boolean {
  return getNodeEnv() === "production";
}

function parseTruthyFlag(raw: string | undefined): boolean | undefined {
  if (raw === undefined || raw === "") return undefined;
  return raw === "true" || raw === "1";
}

/**
 * When true, `/api/script` and the studio Generate button are available.
 * Defaults to enabled in development, disabled in production unless
 * `FRAMELINE_ENABLE_LOCAL_VISION=true` is set (runtime or Docker build ARG).
 */
export function isLocalVisionEnabled(): boolean {
  const parsed = parseTruthyFlag(process.env.FRAMELINE_ENABLE_LOCAL_VISION);
  if (parsed !== undefined) return parsed;
  return isDevelopment();
}

/**
 * Default install root for local model binaries + weights. Created by
 * `scripts/setup-models.mjs` and consulted by every local AI provider.
 */
const DEFAULT_MODELS_DIR = path.join(process.cwd(), "models");

const serverSchema = z.object({
  /** Ollama HTTP endpoint hosting the vision model. */
  OLLAMA_BASE_URL: z.string().url().default(OLLAMA_DEFAULT_BASE_URL),
  /** Ollama tag for the vision model used by /api/script. Multi-image capable. */
  OLLAMA_VISION_MODEL: z.string().min(1).default(OLLAMA_DEFAULT_VISION_MODEL),
  /** Sampling temperature override for the vision model (0..1). */
  OLLAMA_TEMPERATURE: z.coerce.number().min(0).max(2).optional(),
  /** Override for `num_predict` (max tokens to generate). */
  OLLAMA_NUM_PREDICT: z.coerce.number().int().positive().optional(),
  /** Override for `num_ctx` (context window in tokens). */
  OLLAMA_NUM_CTX: z.coerce.number().int().positive().optional(),
  /** Keep-alive duration sent on every Ollama request (e.g. "5m", "0"). */
  OLLAMA_KEEP_ALIVE: z.string().min(1).optional(),
  /** Path to the `piper` executable (or `piper.exe` on Windows). */
  PIPER_BIN: z.string().min(1).optional(),
  /** Directory containing piper voice `.onnx` + `.onnx.json` files. */
  PIPER_VOICES_DIR: z.string().min(1).optional(),
  /** Default Piper voice id (matches a key in lib/constants/piper-voices.ts). */
  PIPER_DEFAULT_VOICE: z.string().min(1).default(PiperVoiceId.Amy),
  /** Override for the install dir if you don't want `<cwd>/models`. */
  FRAMELINE_MODELS_DIR: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  cached = parsed.data;
  return parsed.data;
}

/** Resolve a config path to an absolute filesystem path. */
function resolveEnvPath(raw: string): string {
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

/**
 * Resolve an executable path from env. Docker/Linux use bare `piper`; Windows
 * installs `piper.exe`. When the configured path is missing but a `.exe`
 * sibling exists, prefer the sibling so one env value works everywhere.
 */
function resolveExecutablePath(raw: string): string {
  const resolved = resolveEnvPath(raw);
  if (fs.existsSync(resolved)) return resolved;
  if (process.platform === "win32" && !resolved.toLowerCase().endsWith(".exe")) {
    const withExe = `${resolved}.exe`;
    if (fs.existsSync(withExe)) return withExe;
  }
  return resolved;
}

/** Absolute path to the models directory (env override or default). */
export function getModelsDir(): string {
  const raw = getServerEnv().FRAMELINE_MODELS_DIR;
  return raw ? resolveEnvPath(raw) : DEFAULT_MODELS_DIR;
}

/** Default Piper binary path inside the models dir. */
export function getDefaultPiperBin(): string {
  const ext = process.platform === "win32" ? ".exe" : "";
  return path.join(getModelsDir(), "piper", `piper${ext}`);
}

/** Default Piper voices directory inside the models dir. */
export function getDefaultPiperVoicesDir(): string {
  return path.join(getModelsDir(), "piper", "voices");
}

/** Resolved Piper executable — honors `PIPER_BIN` with platform normalization. */
export function getPiperBin(): string {
  const raw = getServerEnv().PIPER_BIN;
  return raw ? resolveExecutablePath(raw) : getDefaultPiperBin();
}

/** Resolved Piper voices directory — honors `PIPER_VOICES_DIR`. */
export function getPiperVoicesDir(): string {
  const raw = getServerEnv().PIPER_VOICES_DIR;
  return raw ? resolveEnvPath(raw) : getDefaultPiperVoicesDir();
}
