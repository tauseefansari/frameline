import { z } from "zod";
import { ScriptTone, TtsFormat } from "@/lib/types/studio";
import { MAX_FRAMES, MIN_FRAMES } from "@/lib/constants/transcript";
import { CUSTOM_TONE_MAX_LENGTH, REPO_CONTEXT_MAX_LENGTH } from "@/lib/constants/studio";
import {
  LANGUAGE_CODE_MAX,
  LANGUAGE_CODE_MIN,
  MAX_SYNC_SEGMENTS,
  MAX_TTS_TEXT_LENGTH,
} from "@/lib/constants/api";

export const transcribeFormSchema = z.object({
  language: z.string().optional(),
});

export const ttsBodySchema = z.object({
  text: z.string().min(1).max(MAX_TTS_TEXT_LENGTH),
  voice: z.string().min(1),
  format: z.enum([TtsFormat.Mp3, TtsFormat.Wav]).optional().default(TtsFormat.Mp3),
});

export const transcriptSegmentSchema = z.object({
  id: z.number().int(),
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
});

export const ttsSyncBodySchema = z.object({
  segments: z.array(transcriptSegmentSchema).min(1).max(MAX_SYNC_SEGMENTS),
  voice: z.string().min(1),
  /** Total track duration in seconds. Output audio will be padded to this length if shorter. */
  totalDurationSec: z.number().positive(),
});

/** JSON payload returned by POST /api/tts/sync. */
export const ttsSyncResponseSchema = z.object({
  audioBase64: z.string().min(1),
  segments: z.array(transcriptSegmentSchema),
});

export const cutBodySchema = z.object({
  startSec: z.coerce.number().min(0),
  endSec: z.coerce.number().min(0),
});

export const muxBodySchema = z.object({
  normalizeAudio: z.boolean().optional(),
});

export const scriptBodySchema = z.object({
  tone: z.enum(Object.values(ScriptTone) as [string, ...string[]]).optional(),
  /** Free-text tone override used when tone === "custom". */
  customTone: z.string().max(CUSTOM_TONE_MAX_LENGTH).optional(),
  language: z.string().min(LANGUAGE_CODE_MIN).max(LANGUAGE_CODE_MAX).optional(),
  /**
   * Number of evenly-spaced frames sampled from the source. The default
   * vision model accepts multiple images so the server picks a
   * sensible value (one per ~5 s) when omitted.
   */
  frameCount: z.coerce.number().int().min(MIN_FRAMES).max(MAX_FRAMES).optional(),
  /** Optional free-text context (README, notes, etc.) to help the AI write a more accurate narration. */
  repoContext: z.string().max(REPO_CONTEXT_MAX_LENGTH).optional(),
});

/** Query schema for `/api/tts/preview?voice=...`. */
export const voicePreviewQuerySchema = z.object({
  voice: z.string().min(1),
});
