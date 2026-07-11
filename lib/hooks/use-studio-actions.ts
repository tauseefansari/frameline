"use client";

import { useCallback } from "react";
import {
  clipVideoInline,
  cutVideo,
  generateScriptFromVideo,
  renderFinalVideo,
  synthesizeSpeech,
  synthesizeSyncedSpeech,
} from "@/lib/studio/api-client";
import type { PiperVoiceId } from "@/lib/constants/piper-voices";
import type { RenderOptions, SyncedSpeechResult, TranscribeApiResponse } from "@/lib/types/api";
import type { ScriptTone, TranscriptSegment } from "@/lib/types/studio";
import { useApiAction } from "./use-api-action";

type SuccessKey = "transcribe" | "synth" | "cut" | "render";

interface UseStudioActionsOptions {
  fallback: string;
  notifySuccess: (key: SuccessKey) => void;
  notifyError: (message: string) => void;
  /** Called when an intro frame range was detected during transcription. */
  onIntroDetected: (introSec: number) => void;
  /** Optional hook when synced speech returned adjusted segment timings. */
  onSyncedSegments?: (segments: TranscriptSegment[]) => void;
}

/**
 * Bundles the six studio API actions (transcribe / synth / synth-synced /
 * cut / clip-in-place / render) behind a single hook so `StudioWorkspace`
 * doesn't have to re-declare boilerplate per action.
 */
export function useStudioActions({
  fallback,
  notifySuccess,
  notifyError,
  onIntroDetected,
  onSyncedSegments,
}: UseStudioActionsOptions) {
  const transcribe = useApiAction<
    { file: File; tone: ScriptTone; customTone: string; repoContext: string },
    TranscribeApiResponse
  >(
    ({ file, tone, customTone, repoContext }) =>
      generateScriptFromVideo(
        file,
        { tone, customTone: customTone || undefined, repoContext: repoContext || undefined },
        fallback,
      ),
    {
      fallbackError: fallback,
      onSuccess: (data) => {
        notifySuccess("transcribe");
        if (typeof data.introSec === "number" && data.introSec > 0) {
          onIntroDetected(data.introSec);
        }
      },
      onError: notifyError,
    },
  );

  const synth = useApiAction<{ text: string; voice: PiperVoiceId }, Blob>(
    ({ text, voice }) => synthesizeSpeech({ text, voice, format: "mp3" }, fallback),
    {
      fallbackError: fallback,
      onSuccess: () => notifySuccess("synth"),
      onError: notifyError,
    },
  );

  const synthSync = useApiAction<
    { segments: TranscriptSegment[]; voice: PiperVoiceId; totalDurationSec: number },
    SyncedSpeechResult
  >(
    ({ segments, voice, totalDurationSec }) =>
      synthesizeSyncedSpeech({ segments, voice, totalDurationSec }, fallback),
    {
      fallbackError: fallback,
      onSuccess: (res) => {
        notifySuccess("synth");
        if (res.adjustedSegments) onSyncedSegments?.(res.adjustedSegments);
      },
      onError: notifyError,
    },
  );

  const cut = useApiAction<{ file: File; in: number; out: number }, Blob>(
    ({ file, in: i, out: o }) => cutVideo(file, i, o, fallback),
    {
      fallbackError: fallback,
      onSuccess: () => notifySuccess("cut"),
      onError: notifyError,
    },
  );

  // "Clip in place": same trim args as cut, but the response is streamed
  // inline and the resulting Blob is wrapped in a File and added to the
  // library so users can keep stacking sub-clips from a single source.
  const clip = useApiAction<{ file: File; in: number; out: number }, Blob>(
    ({ file, in: i, out: o }) => clipVideoInline(file, i, o, fallback),
    {
      fallbackError: fallback,
      onError: notifyError,
    },
  );

  const render = useApiAction<{ video: File; audio: File | null; options: RenderOptions }, Blob>(
    ({ video, audio, options }) => renderFinalVideo(video, audio, options, fallback),
    {
      fallbackError: fallback,
      onSuccess: () => notifySuccess("render"),
      onError: notifyError,
    },
  );

  const resetAll = useCallback(() => {
    transcribe.reset();
    synth.reset();
    synthSync.reset();
    cut.reset();
    clip.reset();
    render.reset();
  }, [transcribe, synth, synthSync, cut, clip, render]);

  return { transcribe, synth, synthSync, cut, clip, render, resetAll };
}
