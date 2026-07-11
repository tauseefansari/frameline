import path from "path";
import ffmpegStatic from "ffmpeg-static";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import ffmpeg from "fluent-ffmpeg";

/**
 * Resolve the bundled ffmpeg/ffprobe binary even when bundlers rewrite the
 * path with a `\ROOT\` placeholder (Next.js Turbopack on Windows). Falls back
 * to the exported value untouched.
 */
function resolveBinary(input: string | null): string | null {
  if (!input) return null;
  const ROOT_TOKEN = /^[\\/]ROOT[\\/]/;
  if (ROOT_TOKEN.test(input)) {
    // turbopackIgnore: dynamic join of cwd + bundler-rewritten path; not a real
    // module require, so suppress NFT over-tracing of the whole project.
    return path.join(/* turbopackIgnore: true */ process.cwd(), input.replace(ROOT_TOKEN, ""));
  }
  return input;
}

const ffmpegBin = resolveBinary(ffmpegStatic as string | null);
if (ffmpegBin) {
  ffmpeg.setFfmpegPath(ffmpegBin);
}

// `ffmpeg-static` only ships ffmpeg, so wire `@ffprobe-installer/ffprobe`
// for any operation that needs to read media metadata (durations,
// stream layout) — without this, fluent-ffmpeg throws "Cannot find ffprobe".
const ffprobeBin = resolveBinary(ffprobeInstaller.path);
if (ffprobeBin) {
  ffmpeg.setFfprobePath(ffprobeBin);
}

export function getFfmpeg(): typeof ffmpeg {
  return ffmpeg;
}
