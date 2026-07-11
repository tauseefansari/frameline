import { getTranslations } from "next-intl/server";
import { isDevelopment } from "@/lib/config/env";

/** Error codes mapped in `locales/<locale>/errors.json` (top-level keys). */

export enum AppErrorCode {
  ValidationError = "validation_error",
  MissingVideo = "missing_video",
  BadMime = "bad_mime",
  BadVoice = "bad_voice",
  BadRange = "bad_range",
  PayloadTooLarge = "payload_too_large",
  TooManyFiles = "too_many_files",
  ScriptGenerationFailed = "script_generation_failed",
  LocalVisionDisabled = "local_vision_disabled",
}

export class AppError extends Error {
  readonly status: number;
  readonly code: AppErrorCode;

  constructor(status: number, code: AppErrorCode) {
    super(code);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export async function toErrorResponse(err: unknown, locale: string): Promise<Response> {
  const t = await getTranslations({ locale, namespace: "errors" });
  if (err instanceof AppError) {
    return Response.json({ error: t(err.code), code: err.code }, { status: err.status });
  }
  console.error(err);
  // In development, surface the underlying error message so the UI toast
  // shows the real cause (e.g. Ollama not reachable, model not found) instead
  // of a generic "internal_server_error".
  const isDev = isDevelopment();
  const detail = isDev && err instanceof Error && err.message ? err.message : null;
  return Response.json(
    {
      error: detail ?? t("internal_server_error"),
      code: "internal_server_error",
    },
    { status: 500 },
  );
}
