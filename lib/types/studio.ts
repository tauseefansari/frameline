/** Shared studio domain types (UI + API + ffmpeg pipeline). */

/** A user-uploaded video clip held in the studio library. */
export type StudioClip = {
  id: string;
  file: File;
};

/** Editor-friendly trim range in seconds (display + scrubbing). */
export type TimelineRange = { in: number; out: number };

/** A trim range expressed in seconds, used for cut/trim and concat operations. */
export type ClipRange = {
  startSec: number;
  endSec: number;
};

/** A single timed caption segment, relative to media start. */
export type TranscriptSegment = {
  id: number;
  /** Seconds, relative to media start. */
  start: number;
  /** Seconds, relative to media start. */
  end: number;
  text: string;
};

export type TranscriptResult = {
  text: string;
  /** Empty if the upstream model does not return a verbose payload. */
  segments: TranscriptSegment[];
  /** Seconds. `0` if the model did not report duration. */
  durationSec: number;
  /** ISO-639-1, if reported by the model. */
  language?: string;
};

export enum TtsFormat {
  Mp3 = "mp3",
  Wav = "wav",
}

export enum ScriptTone {
  Cinematic = "cinematic",
  Documentary = "documentary",
  Demo = "demo",
  Energetic = "energetic",
  Calm = "calm",
  Educational = "educational",
  Promotional = "promotional",
  /** User supplies their own tone description via `customTone`. */
  Custom = "custom",
}
