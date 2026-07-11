"use client";

import { useEffect } from "react";
import type { useVideoPlayer } from "@/lib/hooks/use-video-player";
import type { TimelineRange } from "@/lib/types/studio";

type VideoPlayer = ReturnType<typeof useVideoPlayer>;

/**
 * Wires the studio's editor keyboard shortcuts:
 * - **Space** — toggle play/pause
 * - **J / L** — step one frame back / forward
 * - **I / O** — set the in / out point of the current trim range
 * - **M** — toggle mute
 * - **F** — toggle fullscreen
 *
 * Inputs and contenteditable elements are skipped so typing in text fields
 * doesn't trigger transport controls.
 */
export function useStudioKeyboardShortcuts(
  player: VideoPlayer,
  setRange: (updater: (prev: TimelineRange) => TimelineRange) => void,
): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (!player.isReady) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          player.toggle();
          break;
        case "j":
        case "J":
          player.step(-1);
          break;
        case "l":
        case "L":
          player.step(1);
          break;
        case "i":
        case "I":
          setRange((r) => ({
            in: player.currentTime,
            out: Math.max(r.out, player.currentTime),
          }));
          break;
        case "o":
        case "O":
          setRange((r) => ({
            in: Math.min(r.in, player.currentTime),
            out: player.currentTime,
          }));
          break;
        case "m":
        case "M":
          player.toggleMuted();
          break;
        case "f":
        case "F":
          player.toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player, setRange]);
}
