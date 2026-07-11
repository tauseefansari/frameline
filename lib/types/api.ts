import type { ClipRange, TranscriptSegment } from "@/lib/types/studio";

/** Response payload from POST /api/script. */
export type TranscribeApiResponse = {
  text: string;
  segments: TranscriptSegment[];
  durationSec: number;
  language?: string;
  /** Detected leading silence/black in the source. Client may use it as a default trim-in. */
  introSec?: number;
  error?: string;
};

/** Options passed to POST /api/video/render (the one-shot trim+mux+caption pipeline). */
export type RenderOptions = {
  trim?: ClipRange;
  burnCaptions?: boolean;
  /** Pre-computed transcript segments to burn as captions. When provided the
   *  server adjusts timestamps for any trim offset and converts them directly
   *  to SRT — no extra processing step needed. */
  segments?: TranscriptSegment[];
};

/** Result of POST /api/tts/sync — synchronized voiceover MP3 plus optional adjusted timings. */
export type SyncedSpeechResult = {
  audioBlob: Blob;
  /**
   * Adjusted segment timings returned by the server in the JSON body. When
   * present these supersede the pre-synth slots so captions stay locked to the
   * rendered MP3.
   */
  adjustedSegments: TranscriptSegment[] | null;
};
