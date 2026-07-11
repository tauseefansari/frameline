"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoPlayerState } from "@/lib/types/video";

/** Imperative video controls + reactive snapshot. Owns its element via callback ref. */
export function useVideoPlayer(): VideoPlayerState {
  const elRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const detach = useRef<(() => void) | null>(null);

  const attach = useCallback((el: HTMLVideoElement | null) => {
    detach.current?.();
    detach.current = null;
    elRef.current = el;
    if (!el) {
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      setIsReady(false);
      return;
    }

    const onLoaded = () => {
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
      setIsReady(true);
    };
    const onTime = () => setCurrentTime(el.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onVolume = () => {
      setIsMutedState(el.muted);
      setVolumeState(el.volume);
    };
    const onRate = () => setPlaybackRateState(el.playbackRate);

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("durationchange", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("volumechange", onVolume);
    el.addEventListener("ratechange", onRate);

    detach.current = () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("durationchange", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("volumechange", onVolume);
      el.removeEventListener("ratechange", onRate);
    };
  }, []);

  useEffect(() => () => detach.current?.(), []);

  // Track document fullscreen state globally — the user can exit via Esc.
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const play = useCallback(async () => {
    const el = elRef.current;
    if (!el) return;
    try {
      await el.play();
    } catch {
      /* user gesture / autoplay block — ignore */
    }
  }, []);

  const pause = useCallback(() => {
    elRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const el = elRef.current;
    if (!el) return;
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    el.currentTime = safe;
    setCurrentTime(safe);
  }, []);

  const step = useCallback(
    (delta: number) => {
      const el = elRef.current;
      if (!el) return;
      seek(el.currentTime + delta);
    },
    [seek],
  );

  const setMuted = useCallback((next: boolean) => {
    const el = elRef.current;
    if (!el) return;
    el.muted = next;
    setIsMutedState(next);
  }, []);

  const toggleMuted = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMutedState(el.muted);
  }, []);

  const setVolume = useCallback((value: number) => {
    const el = elRef.current;
    if (!el) return;
    const clamped = Math.min(1, Math.max(0, value));
    el.volume = clamped;
    // Adjusting volume above 0 implicitly unmutes — mirror native player UX.
    if (clamped > 0 && el.muted) el.muted = false;
    setVolumeState(clamped);
    setIsMutedState(el.muted);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const el = elRef.current;
    if (!el) return;
    const safe = Number.isFinite(rate) && rate > 0 ? rate : 1;
    el.playbackRate = safe;
    setPlaybackRateState(safe);
  }, []);

  const toggleFullscreen = useCallback(async (container?: HTMLElement | null) => {
    const target = container ?? elRef.current;
    if (!target) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
    } catch {
      /* user denied / unsupported — ignore */
    }
  }, []);

  return {
    attach,
    duration,
    currentTime,
    isPlaying,
    isReady,
    isMuted,
    volume,
    playbackRate,
    isFullscreen,
    play,
    pause,
    toggle,
    seek,
    step,
    setMuted,
    toggleMuted,
    setVolume,
    setPlaybackRate,
    toggleFullscreen,
  };
}
