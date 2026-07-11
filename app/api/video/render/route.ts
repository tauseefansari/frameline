import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import { writeBufferToFile } from "@/lib/api/temp-session";
import { FfmpegPipeline } from "@/lib/ffmpeg/pipeline";
import { trimAudio } from "@/lib/ffmpeg/operations";
import { AppError, AppErrorCode } from "@/lib/errors/app-error";
import { ApiDownloadKey, getDownloadBasename } from "@/lib/i18n/api-download-label";
import {
  fileExt,
  handleRoute,
  readAsDownloadResponse,
  readFileFromForm,
} from "@/lib/api/route-helpers";
import { segmentsToAss } from "@/lib/video/captions.server";
import { transcriptSegmentSchema } from "@/lib/validation/api";

const optionsSchema = z.object({
  trim: z
    .object({
      startSec: z.coerce.number().min(0),
      endSec: z.coerce.number().min(0),
    })
    .optional(),
  burnCaptions: z.coerce.boolean().optional().default(false),
  segments: z.array(transcriptSegmentSchema).optional(),
});

/**
 * Single endpoint that runs the studio's "Render final video" pipeline:
 * optional trim → optional voiceover mux → optional caption burn-in. Each
 * step is skipped when its inputs aren't supplied, so the same endpoint
 * powers every "make me the final file" scenario from the UI.
 *
 * Form fields:
 *   - video       (required) the source video
 *   - audio       (optional) replacement audio track to mux in
 *   - options     (optional) JSON { trim?, burnCaptions?, segments? }
 *
 * When burnCaptions is true, `segments` must be supplied — caller is
 * responsible for providing timestamps (edit them in the Transcript tab).
 */
export async function POST(req: Request) {
  return handleRoute(req, async ({ locale, createDir }) => {
    const formData = await req.formData();
    const { file: videoFile, buffer: videoBuf } = await readFileFromForm(formData, {
      requireVideoMime: true,
    });

    const optionsRaw = formData.get("options");
    let options: z.infer<typeof optionsSchema> = { burnCaptions: false };
    if (typeof optionsRaw === "string" && optionsRaw.length > 0) {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(optionsRaw);
      } catch {
        throw new AppError(400, AppErrorCode.ValidationError);
      }
      const parsed = optionsSchema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new AppError(400, AppErrorCode.ValidationError);
      }
      options = parsed.data;
    }

    const audioForm = formData.get("audio");
    const audioFile = audioForm instanceof File ? audioForm : null;

    const dir = await createDir();
    const ext = fileExt(videoFile);
    const inputPath = path.join(dir, `input${ext}`);
    await writeBufferToFile(inputPath, videoBuf);

    let audioPath: string | null = null;
    if (audioFile) {
      audioPath = path.join(dir, `voiceover${path.extname(audioFile.name) || ".mp3"}`);
      const audioBuf = Buffer.from(await audioFile.arrayBuffer());
      await writeBufferToFile(audioPath, audioBuf);
      // If the video is being trimmed we also need to trim the voiceover so
      // it stays in sync — otherwise `-shortest` would silently drop the
      // audio tail (when the trim shortens the video) or the visuals would
      // run out before the narration ends.
      const trim = options.trim;
      if (trim && trim.endSec > trim.startSec) {
        const trimmedAudioPath = path.join(dir, "voiceover-trimmed.mp3");
        await trimAudio(audioPath, trimmedAudioPath, trim.startSec, trim.endSec);
        audioPath = trimmedAudioPath;
      }
    }

    // Stage 1: trim + (optional) mux. We do these first so any caption
    // transcription downstream sees the *exact* audio the viewer will hear.
    const muxPipeline = new FfmpegPipeline(inputPath, dir, ext)
      .trim(options.trim ?? { startSec: 0, endSec: 0 })
      .mux(audioPath);
    const postMuxPath = await muxPipeline.run();

    // Stage 2: optional caption burn-in using the segments supplied by the client.
    let finalPath = postMuxPath;
    if (options.burnCaptions) {
      if (!options.segments || options.segments.length === 0) {
        throw new AppError(400, AppErrorCode.ValidationError);
      }

      // Adjust timestamps for any trim offset so they stay in sync with the
      // trimmed output rather than the original source file.
      const offset = options.trim?.startSec ?? 0;
      const captionSegments = options.segments
        .map((seg) => ({
          ...seg,
          start: Math.max(0, seg.start - offset),
          end: Math.max(0, seg.end - offset),
        }))
        .filter((seg) => seg.end > seg.start);

      if (captionSegments.length === 0) {
        throw new AppError(400, AppErrorCode.ValidationError);
      }

      const ass = segmentsToAss(captionSegments);
      const captionsPath = path.join(dir, "captions.ass");
      await fs.writeFile(captionsPath, ass, "utf8");
      finalPath = await new FfmpegPipeline(postMuxPath, dir, ext).burnCaptions(captionsPath).run();
    }

    const stem = await getDownloadBasename(locale, ApiDownloadKey.Render);
    return readAsDownloadResponse(finalPath, `${stem}${ext}`);
  });
}
