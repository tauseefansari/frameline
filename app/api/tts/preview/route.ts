import path from "path";
import os from "os";
import fs from "fs/promises";
import { createLocalVoiceProvider } from "@/lib/providers/local-voice.provider";
import { isPiperVoiceId } from "@/lib/constants/piper-voices";
import { TtsFormat } from "@/lib/types/studio";
import { AppError, AppErrorCode } from "@/lib/errors/app-error";
import { voicePreviewQuerySchema } from "@/lib/validation/api";
import { handleRoute } from "@/lib/api/route-helpers";
import {
  VOICE_PREVIEW_CACHE_MAX_AGE_SEC,
  VOICE_PREVIEW_FALLBACK_SENTENCE,
} from "@/lib/constants/audio";

/**
 * Cache rendered voice samples on disk so repeat hits cost nothing. Each
 * voice maps to one MP3; the directory is created lazily on first use and
 * survives across requests (lives in the OS temp dir, swept by the OS).
 */
const PREVIEW_CACHE_DIR = path.join(os.tmpdir(), "frameline-voice-preview-cache");

async function ensurePreviewMp3(voice: string): Promise<string> {
  await fs.mkdir(PREVIEW_CACHE_DIR, { recursive: true });
  const previewPath = path.join(PREVIEW_CACHE_DIR, `${voice}.mp3`);
  try {
    await fs.access(previewPath);
    return previewPath;
  } catch {
    /* fall through and synthesize */
  }
  const provider = createLocalVoiceProvider();
  const audio = await provider.synthesize({
    text: VOICE_PREVIEW_FALLBACK_SENTENCE,
    voice,
    format: TtsFormat.Mp3,
  });
  await fs.writeFile(previewPath, audio);
  return previewPath;
}

/**
 * GET /api/tts/preview?voice=<id>
 *
 * Streams a short MP3 sample of the requested Piper voice. Results are
 * cached on disk so repeat requests are nearly free.
 */
export async function GET(req: Request) {
  return handleRoute(req, async () => {
    const url = new URL(req.url);
    const parsed = voicePreviewQuerySchema.safeParse({ voice: url.searchParams.get("voice") });
    if (!parsed.success) {
      throw new AppError(400, AppErrorCode.ValidationError);
    }
    const { voice } = parsed.data;
    if (!isPiperVoiceId(voice)) {
      throw new AppError(400, AppErrorCode.BadVoice);
    }

    const previewPath = await ensurePreviewMp3(voice);
    const buf = await fs.readFile(previewPath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": `public, max-age=${VOICE_PREVIEW_CACHE_MAX_AGE_SEC}, immutable`,
        "Content-Disposition": `inline; filename="${voice}-preview.mp3"`,
      },
    });
  });
}
