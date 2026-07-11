"use client";

/**
 * Client-side video utilities. Each helper allocates a hidden HTMLVideoElement,
 * loads metadata from the supplied `File`, and revokes the object URL on
 * completion so callers don't have to manage lifecycles.
 */

/** Resolve to the duration (seconds) of a video file, or 0 if unreadable. */
export function probeVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.remove();
    };
    v.onloadedmetadata = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 0;
      cleanup();
      resolve(d);
    };
    v.onerror = () => {
      cleanup();
      resolve(0);
    };
  });
}

export type ThumbnailOptions = {
  /** Output width in CSS pixels. Height auto-computed from aspect. */
  width?: number;
  /** 0..1 fraction of duration to grab the frame from. Defaults to 0.1. */
  positionFraction?: number;
  /** JPEG quality 0..1. Defaults to 0.7. */
  quality?: number;
};

/** Render a frame from `file` to a JPEG data URL, or null on failure. */
export function generateVideoThumbnail(
  file: File,
  opts: ThumbnailOptions = {},
): Promise<string | null> {
  const { width = 160, positionFraction = 0.1, quality = 0.7 } = opts;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      v.remove();
      resolve(value);
    };
    v.onloadedmetadata = () => {
      const safe = Math.max(0, Math.min(1, positionFraction));
      v.currentTime = Math.min(0.5, (v.duration || 1) * safe);
    };
    v.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const aspect = v.videoHeight / Math.max(1, v.videoWidth);
        const h = Math.max(1, Math.round(aspect * width));
        canvas.width = width;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(v, 0, 0, width, h);
        finish(canvas.toDataURL("image/jpeg", quality));
      } catch {
        finish(null);
      }
    };
    v.onerror = () => finish(null);
  });
}

export type FilmstripOptions = {
  /** Number of evenly spaced frames to capture across the duration. */
  frames?: number;
  /** Width in CSS pixels for each frame. Height auto-computed from aspect. */
  frameWidth?: number;
  /** JPEG quality 0..1. */
  quality?: number;
};

/**
 * Capture a row of evenly-spaced frame thumbnails from a video URL — used to
 * build a "filmstrip" backdrop for trim/scrub UIs. Frames are extracted
 * sequentially (browsers serialize seeks anyway) and the helper resolves with
 * an array of JPEG data URLs in chronological order. Resolves to an empty
 * array on any failure so callers can render a blank rail without crashing.
 */
export function generateVideoFilmstrip(
  url: string,
  opts: FilmstripOptions = {},
): Promise<string[]> {
  const { frames = 14, frameWidth = 160, quality = 0.6 } = opts;
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    v.src = url;

    const out: string[] = [];
    let i = 0;
    let timestamps: number[] = [];

    const finish = (value: string[]) => {
      v.remove();
      resolve(value);
    };

    const seekNext = () => {
      if (i >= timestamps.length) {
        finish(out);
        return;
      }
      v.currentTime = timestamps[i];
    };

    v.onloadedmetadata = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 0;
      if (!d) {
        finish([]);
        return;
      }
      const count = Math.max(1, Math.min(frames, Math.ceil(d * 2)));
      // Bias the first frame slightly off zero (some encoders return a black
      // frame at exactly 0) and the last off the end.
      timestamps = Array.from({ length: count }, (_, idx) => {
        const t = (idx + 0.5) * (d / count);
        return Math.min(Math.max(t, 0.05), Math.max(0, d - 0.05));
      });
      seekNext();
    };

    v.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const aspect = v.videoHeight / Math.max(1, v.videoWidth);
        const h = Math.max(1, Math.round(aspect * frameWidth));
        canvas.width = frameWidth;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(v, 0, 0, frameWidth, h);
          out.push(canvas.toDataURL("image/jpeg", quality));
        }
      } catch {
        // ignore single-frame failures; keep going.
      }
      i += 1;
      seekNext();
    };

    v.onerror = () => finish(out);
  });
}
