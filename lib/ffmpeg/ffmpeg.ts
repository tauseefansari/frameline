import { accessSync, constants as fsConstants } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import ffmpeg from "fluent-ffmpeg";

function isExecutable(filePath: string): boolean {
  try {
    accessSync(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve an ffmpeg/ffprobe binary even when bundlers rewrite the path with a
 * `\ROOT\` placeholder (Next.js Turbopack on Windows). Falls back to the
 * system PATH when the bundled install is missing or incomplete.
 */
function resolveBinary(input: string | null): string | null {
  if (!input) return null;
  const ROOT_TOKEN = /^[\\/]ROOT[\\/]/;
  const candidate = ROOT_TOKEN.test(input)
    ? path.join(/* turbopackIgnore: true */ process.cwd(), input.replace(ROOT_TOKEN, ""))
    : input;

  if (isExecutable(candidate)) {
    return candidate;
  }

  return null;
}

function resolveBinaryFromPath(binaryName: string): string | null {
  const lookupCommand = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(lookupCommand, [binaryName], { encoding: "utf8" });
  if (result.status !== 0) {
    return null;
  }

  const candidate = result.stdout.trim();
  if (!candidate || !isExecutable(candidate)) {
    return null;
  }

  return candidate;
}

const ffmpegBin = resolveBinary(ffmpegStatic as string | null) ?? resolveBinaryFromPath("ffmpeg");
if (ffmpegBin) {
  ffmpeg.setFfmpegPath(ffmpegBin);
}

// `ffmpeg-static` only ships ffmpeg, so wire `@ffprobe-installer/ffprobe`
// for any operation that needs to read media metadata (durations,
// stream layout) — without this, fluent-ffmpeg throws "Cannot find ffprobe".
const ffprobeBin = resolveBinary(ffprobeInstaller.path) ?? resolveBinaryFromPath("ffprobe");
if (ffprobeBin) {
  ffmpeg.setFfprobePath(ffprobeBin);
}

export function getFfmpeg(): typeof ffmpeg {
  return ffmpeg;
}
