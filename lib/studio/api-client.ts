import type { TranscriptSegment, ClipRange } from "@/lib/types/studio";
import type { TranscribeApiResponse, RenderOptions, SyncedSpeechResult } from "@/lib/types/api";
import { apiFetch, ENDPOINTS, buildApiUrl } from "@/lib/api/endpoints";
import { base64ToBlob } from "@/lib/format/base64-blob";
import { ttsSyncResponseSchema } from "@/lib/validation/api";

export async function generateScriptFromVideo(
  file: File,
  options:
    | {
        tone?: string;
        customTone?: string;
        language?: string;
        frameCount?: number;
        repoContext?: string;
      }
    | undefined,
  fallbackError: string,
): Promise<TranscribeApiResponse> {
  const fd = new FormData();
  fd.append("video", file);
  if (options?.tone) fd.append("tone", options.tone);
  if (options?.customTone) fd.append("customTone", options.customTone);
  if (options?.repoContext) fd.append("repoContext", options.repoContext);
  if (options?.language) fd.append("language", options.language);
  if (options?.frameCount !== undefined) {
    fd.append("frameCount", String(options.frameCount));
  }
  const res = await apiFetch(ENDPOINTS.script, { method: "POST", body: fd, fallbackError });
  return (await res.json()) as TranscribeApiResponse;
}

export async function synthesizeSpeech(
  payload: { text: string; voice: string; format?: "mp3" | "wav" },
  fallbackError: string,
): Promise<Blob> {
  const res = await apiFetch(ENDPOINTS.tts, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format: "mp3", ...payload }),
    fallbackError,
  });
  return res.blob();
}

export async function cutVideo(
  file: File,
  startSec: number,
  endSec: number,
  fallbackError: string,
): Promise<Blob> {
  const fd = new FormData();
  fd.append("video", file);
  fd.append("startSec", String(startSec));
  fd.append("endSec", String(endSec));
  const res = await apiFetch(ENDPOINTS.videoCut, { method: "POST", body: fd, fallbackError });
  return res.blob();
}

/**
 * "Clip on the fly": trims a sub-range from a source video and returns the
 * result as an in-memory Blob ready to be played inline or staged in the
 * library. The server response is `Content-Disposition: inline` so no
 * download dialog ever appears.
 */
export async function clipVideoInline(
  file: File,
  startSec: number,
  endSec: number,
  fallbackError: string,
): Promise<Blob> {
  const fd = new FormData();
  fd.append("video", file);
  fd.append("startSec", String(startSec));
  fd.append("endSec", String(endSec));
  const res = await apiFetch(ENDPOINTS.videoClip, { method: "POST", body: fd, fallbackError });
  return res.blob();
}

/**
 * Concatenates the provided videos in the order given. The server preserves
 * the FormData order, so callers control the final timeline by appending in
 * the desired sequence. `ranges` is parallel to `files` — pass `null` for any
 * clip that should not be trimmed before merging.
 */
export async function concatVideosApi(
  files: File[],
  ranges: Array<ClipRange | null> | undefined,
  fallbackError: string,
): Promise<Blob> {
  const fd = new FormData();
  for (const f of files) fd.append("videos", f);
  if (ranges && ranges.some((r) => r !== null)) {
    fd.append("ranges", JSON.stringify(ranges));
  }
  const res = await apiFetch(ENDPOINTS.videoConcat, { method: "POST", body: fd, fallbackError });
  return res.blob();
}

/**
 * One-shot "render final video" call that runs the server-side pipeline:
 * optional trim → optional voiceover mux → optional caption burn-in.
 * Replaces the previous "click mux, then click captions" two-step flow.
 */
export async function renderFinalVideo(
  video: File,
  audio: File | null,
  options: RenderOptions,
  fallbackError: string,
): Promise<Blob> {
  const fd = new FormData();
  fd.append("video", video);
  if (audio) fd.append("audio", audio);
  fd.append("options", JSON.stringify(options));
  const res = await apiFetch(ENDPOINTS.videoRender, { method: "POST", body: fd, fallbackError });
  return res.blob();
}

/**
 * Synthesizes each segment with Piper, tempo-fits every clip into its video
 * window, and places each at its `start` timecode via `adelay` + `amix`.
 * Adjusted segment timings are returned in the JSON body so captions stay
 * locked to the rendered MP3.
 */
export async function synthesizeSyncedSpeech(
  payload: { segments: TranscriptSegment[]; voice: string; totalDurationSec: number },
  fallbackError: string,
): Promise<SyncedSpeechResult> {
  const res = await apiFetch(ENDPOINTS.ttsSync, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    fallbackError,
  });
  const json: unknown = await res.json();
  const parsed = ttsSyncResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(fallbackError);
  }
  const audioBlob = base64ToBlob(parsed.data.audioBase64, "audio/mpeg");
  return { audioBlob, adjustedSegments: parsed.data.segments };
}

/**
 * URL of the per-voice MP3 preview. The server caches the rendered sample on
 * disk so repeated requests for the same voice are nearly free. Returned as a
 * URL string so wavesurfer / `<audio>` can stream it directly.
 */
export function voicePreviewUrl(voice: string): string {
  return buildApiUrl(ENDPOINTS.ttsPreview, { voice });
}
