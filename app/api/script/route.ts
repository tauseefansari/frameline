import fs from "fs/promises";
import path from "path";
import { writeBufferToFile } from "@/lib/api/temp-session";
import { detectContentStartSec, extractEvenlySpacedFrames } from "@/lib/ffmpeg/operations";
import { createLocalVoiceProvider } from "@/lib/providers/local-voice.provider";
import { ScriptTone } from "@/lib/types/studio";
import { isLocalVisionEnabled } from "@/lib/config/env";
import { AppError, AppErrorCode } from "@/lib/errors/app-error";
import { scriptBodySchema } from "@/lib/validation/api";
import { fileExt, handleRoute, readFileFromForm } from "@/lib/api/route-helpers";
import {
  INTRO_PROBE_SEC,
  MAX_FRAMES,
  MIN_FRAMES,
  SECONDS_PER_FRAME,
} from "@/lib/constants/transcript";

/**
 * Pick a sensible default frame count when the client didn't ask for one. We
 * sample roughly one frame every {@link SECONDS_PER_FRAME} seconds, clamped
 * to the [{@link MIN_FRAMES}, {@link MAX_FRAMES}] range so the vision model
 * isn't overwhelmed on long clips and still gets enough temporal signal on
 * short ones.
 */
function defaultFrameCount(durationSec: number): number {
  const target = Math.round(durationSec / SECONDS_PER_FRAME);
  return Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, target));
}

export async function POST(req: Request) {
  return handleRoute(req, async ({ createDir }) => {
    if (!isLocalVisionEnabled()) {
      throw new AppError(503, AppErrorCode.LocalVisionDisabled);
    }

    const formData = await req.formData();
    const { file, buffer } = await readFileFromForm(formData, {
      requireVideoMime: true,
    });

    const parsed = scriptBodySchema.safeParse({
      tone: formData.get("tone") ?? undefined,
      customTone: formData.get("customTone") ?? undefined,
      language: formData.get("language") ?? undefined,
      frameCount: formData.get("frameCount") ?? undefined,
      repoContext: formData.get("repoContext") ?? undefined,
    });
    if (!parsed.success) {
      throw new AppError(400, AppErrorCode.ValidationError);
    }
    const { tone, customTone, language, frameCount, repoContext } = parsed.data;

    const dir = await createDir();
    const videoPath = path.join(dir, `input${fileExt(file)}`);
    await writeBufferToFile(videoPath, buffer);

    // Probe the head of the clip for a leading silent / black intro so the
    // narration starts when actual content does. The script writer is told
    // about this offset so the very first sentence covers it explicitly
    // ("Welcome — today we'll …") instead of leaving dead air.
    const introSec = await detectContentStartSec(videoPath, INTRO_PROBE_SEC);

    // Probe duration cheaply, then choose a count and resample if needed.
    const initial = await extractEvenlySpacedFrames(videoPath, dir, MIN_FRAMES);
    const targetCount = frameCount ?? defaultFrameCount(initial.durationSec);
    const { paths, timestamps, durationSec } =
      targetCount === MIN_FRAMES && introSec === 0
        ? initial
        : await extractEvenlySpacedFrames(videoPath, dir, targetCount, { startSec: introSec });

    const frames = await Promise.all(
      paths.map(async (p, i) => ({
        base64Jpeg: (await fs.readFile(p)).toString("base64"),
        atSec: timestamps[i],
      })),
    );

    const provider = createLocalVoiceProvider();
    const result = await provider.generateVideoScript({
      frames,
      durationSec,
      tone: tone as ScriptTone | undefined,
      customTone,
      language,
      repoContext,
    });

    if (!result.text || result.segments.length === 0) {
      throw new AppError(502, AppErrorCode.ScriptGenerationFailed);
    }

    return Response.json({
      text: result.text,
      segments: result.segments,
      durationSec: result.durationSec,
      language: result.language,
      introSec,
    });
  });
}
