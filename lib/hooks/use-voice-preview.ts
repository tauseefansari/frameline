"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { voicePreviewUrl } from "@/lib/studio/api-client";
import type { PiperVoiceId } from "@/lib/constants/piper-voices";

export type VoicePreviewState = "idle" | "loading" | "playing";

export type VoicePreviewApi = {
  /** Currently active voice (loading or playing), or `null` if idle. */
  activeVoice: PiperVoiceId | null;
  /** Lifecycle state of the shared audio element. */
  state: VoicePreviewState;
  /** Toggle play/pause for the given voice. Swaps source if a different one is active. */
  toggle: (voice: PiperVoiceId) => void;
};

/**
 * Single shared `HTMLAudioElement` that plays Piper voice previews on demand.
 * Used by the voice picker so each preset card can act as its own play /
 * pause control without creating a wavesurfer instance per card.
 */
export function useVoicePreview(): VoicePreviewApi {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeVoice, setActiveVoice] = useState<PiperVoiceId | null>(null);
  const [state, setState] = useState<VoicePreviewState>("idle");

  const toggle = useCallback(
    (id: PiperVoiceId) => {
      if (typeof window === "undefined") return;
      const audio = audioRef.current ?? new Audio();
      if (!audioRef.current) {
        audio.preload = "auto";
        audio.addEventListener("ended", () => {
          setState("idle");
          setActiveVoice(null);
        });
        audioRef.current = audio;
      }
      // Same card → toggle pause/play.
      if (activeVoice === id && !audio.paused) {
        audio.pause();
        setState("idle");
        setActiveVoice(null);
        return;
      }
      setActiveVoice(id);
      setState("loading");
      audio.src = voicePreviewUrl(id);
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setState("playing"))
        .catch(() => {
          setState("idle");
          setActiveVoice(null);
        });
    },
    [activeVoice],
  );

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  return { activeVoice, state, toggle };
}
