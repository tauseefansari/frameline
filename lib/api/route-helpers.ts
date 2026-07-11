import fs from "fs/promises";
import path from "path";
import { AppError, AppErrorCode, toErrorResponse } from "@/lib/errors/app-error";
import { createTempJobDir } from "@/lib/api/temp-session";
import { resolveRequestLocale } from "@/lib/i18n/resolve-request-locale";
import { MAX_UPLOAD_BYTES } from "@/lib/constants/api";

const VIDEO_MIME_PREFIX = "video/";

/** Lightweight MIME guard shared by every video-accepting route. */
export function isVideoMime(mime: string): boolean {
  return mime.startsWith(VIDEO_MIME_PREFIX);
}

export type ReadFileOptions = {
  /** Form field names tried in order. Defaults to ["video", "file"]. */
  keys?: readonly string[];
  /** When true, rejects non-`video/*` mime types with `BadMime`. */
  requireVideoMime?: boolean;
  /** Error thrown when no file is found. Defaults to `MissingVideo`. */
  missingError?: AppErrorCode;
  /** Per-file size limit. Defaults to `MAX_UPLOAD_BYTES`. */
  maxBytes?: number;
};

export type ReadFileResult = {
  file: File;
  buffer: Buffer;
};

/**
 * Pull a `File` from FormData under any of the given keys, validate its mime
 * + size, and decode it into a Buffer in one step.
 */
export async function readFileFromForm(
  formData: FormData,
  opts: ReadFileOptions = {},
): Promise<ReadFileResult> {
  const keys = opts.keys ?? ["video", "file"];
  let file: File | null = null;
  for (const k of keys) {
    const v = formData.get(k);
    if (v instanceof File) {
      file = v;
      break;
    }
  }
  if (!file) {
    throw new AppError(400, opts.missingError ?? AppErrorCode.MissingVideo);
  }
  if (opts.requireVideoMime && !isVideoMime(file.type)) {
    throw new AppError(400, AppErrorCode.BadMime);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const max = opts.maxBytes ?? MAX_UPLOAD_BYTES;
  if (buffer.length > max) {
    throw new AppError(413, AppErrorCode.PayloadTooLarge);
  }
  return { file, buffer };
}

/** Returns the filename extension (with dot) or a fallback. */
export function fileExt(file: File, fallback = ".mp4"): string {
  return path.extname(file.name) || fallback;
}

/** Build a downloadable mp4 response from an in-memory buffer. */
export function videoDownloadResponse(
  buffer: Buffer,
  filename: string,
  contentType = "video/mp4",
): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/** Read a file from disk and turn it into a download response. */
export async function readAsDownloadResponse(
  outputPath: string,
  filename: string,
  contentType = "video/mp4",
): Promise<Response> {
  const buf = await fs.readFile(outputPath);
  return videoDownloadResponse(buf, filename, contentType);
}

export type RouteContext = {
  req: Request;
  locale: string;
  /** Lazily create a temp working directory; cleanup runs after the handler. */
  createDir: () => Promise<string>;
};

/**
 * Standard route wrapper: resolves locale, exposes a lazy temp-dir creator,
 * unifies error responses, and guarantees cleanup. Replaces the
 * locale + try/catch/finally + cleanup boilerplate every video route had.
 */
export async function handleRoute(
  req: Request,
  handler: (ctx: RouteContext) => Promise<Response>,
): Promise<Response> {
  const locale = resolveRequestLocale(req);
  let cleanup: () => Promise<void> = async () => {};
  const createDir = async (): Promise<string> => {
    const r = await createTempJobDir();
    cleanup = r.cleanup;
    return r.dir;
  };
  try {
    return await handler({ req, locale, createDir });
  } catch (err) {
    return toErrorResponse(err, locale);
  } finally {
    await cleanup();
  }
}
