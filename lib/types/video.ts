/** Imperative video controls + reactive snapshot returned by `useVideoPlayer`. */
export type VideoPlayerState = {
  /** Callback ref to attach to the underlying `<video>` element. */
  attach: (el: HTMLVideoElement | null) => void;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isReady: boolean;
  isMuted: boolean;
  /** Volume in [0, 1]. */
  volume: number;
  /** Playback speed multiplier (1 = normal). */
  playbackRate: number;
  /** True when the player container is currently in browser fullscreen. */
  isFullscreen: boolean;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  step: (deltaSeconds: number) => void;
  setMuted: (next: boolean) => void;
  toggleMuted: () => void;
  setVolume: (value: number) => void;
  setPlaybackRate: (rate: number) => void;
  /**
   * Request/exit fullscreen on the supplied container element (so overlay
   * controls remain visible). Falls back to the `<video>` element itself.
   */
  toggleFullscreen: (container?: HTMLElement | null) => Promise<void>;
};
