import path from "path";
import fs from "fs/promises";
import { AppError, AppErrorCode } from "@/lib/errors/app-error";
import { isPiperVoiceId } from "@/lib/constants/piper-voices";
import { TtsFormat, type TranscriptSegment } from "@/lib/types/studio";
import { ttsSyncBodySchema } from "@/lib/validation/api";
import { handleRoute } from "@/lib/api/route-helpers";
import { createTempJobDir } from "@/lib/api/temp-session";
import { synthesizeWithPiper } from "@/lib/providers/piper.provider";
import { composeSequentialVoiceover, getMediaDurationSec } from "@/lib/ffmpeg/operations";
import { SEGMENT_BOUNDARY_EPSILON_SEC } from "@/lib/constants/audio";
import { MIN_SEGMENT_DURATION_SEC } from "@/lib/constants/transcript";
import { trimSegmentsIfOverVideoBudget, voiceoverTimingScale } from "@/lib/format/speech-budget";
import { enforceSequentialSegmentGrid } from "@/lib/studio/speech-sync";

type RenderedClip = {
  segment: TranscriptSegment;
  clipPath: string;
  playDurationSec: number;
};

/**
 * POST /api/tts/sync
 *
 * Synthesizes each segment at Piper's natural rate and concatenates clips
 * back-to-back with no silence gaps. Returned segment timings match the MP3.
 */
export async function POST(req: Request) {
  return handleRoute(req, async () => {
    const json: unknown = await req.json();
    const parsed = ttsSyncBodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(400, AppErrorCode.ValidationError);
    }
    const { segments, voice, totalDurationSec } = parsed.data;

    if (!isPiperVoiceId(voice)) {
      throw new AppError(400, AppErrorCode.BadVoice);
    }

    const orderedSegments = trimSegmentsIfOverVideoBudget(
      enforceSequentialSegmentGrid(segments, totalDurationSec),
      totalDurationSec,
    );
    if (orderedSegments.length === 0) {
      throw new AppError(400, AppErrorCode.ValidationError);
    }

    const { dir, cleanup } = await createTempJobDir();
    try {
      const rendered: RenderedClip[] = [];

      for (let order = 0; order < orderedSegments.length; order += 1) {
        const seg = orderedSegments[order];
        const text = seg.text.trim();
        if (!text) continue;

        const clipPath = path.join(dir, `seg-${order}.mp3`);
        const audio = await synthesizeWithPiper({
          text,
          voice,
          format: TtsFormat.Mp3,
          workDir: dir,
        });
        await fs.writeFile(clipPath, audio);
        const playDurationSec = await getMediaDurationSec(clipPath);

        rendered.push({
          segment: seg,
          clipPath,
          playDurationSec,
        });
      }

      if (rendered.length === 0) {
        throw new AppError(400, AppErrorCode.ValidationError);
      }

      const outputPath = path.join(dir, "synced.mp3");
      const totalSpeechSec = rendered.reduce(
        (sum, clip) => sum + Math.max(MIN_SEGMENT_DURATION_SEC, clip.playDurationSec),
        0,
      );
      await composeSequentialVoiceover(
        rendered.map(({ clipPath, playDurationSec }) => ({ clipPath, playDurationSec })),
        outputPath,
        totalDurationSec,
      );

      const mp3Buffer = await fs.readFile(outputPath);
      const timingScale = voiceoverTimingScale(totalSpeechSec, totalDurationSec);

      let cursor = 0;
      const adjustedSegments: TranscriptSegment[] = rendered.map(
        ({ segment, playDurationSec }, i) => {
          const scaledDuration = playDurationSec * timingScale;
          const start = Number(cursor.toFixed(3));
          const end = Number((cursor + scaledDuration).toFixed(3));
          cursor = end;
          return {
            id: i,
            start,
            end: Number(Math.max(start + SEGMENT_BOUNDARY_EPSILON_SEC, end).toFixed(3)),
            text: segment.text,
          };
        },
      );

      return Response.json({
        audioBase64: mp3Buffer.toString("base64"),
        segments: adjustedSegments,
      });
    } finally {
      await cleanup();
    }
  });
}
