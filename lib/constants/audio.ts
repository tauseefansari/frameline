/** Audio + voiceover tunables shared between server (Piper/ffmpeg) and client (waveform). */

/** Bitrate for every MP3 we render (Piper voiceover, synced track, etc.). */
export const MP3_BITRATE = "192k";

/** Numeric form (kbps) — for places that want a number rather than the ffmpeg string. */
export const MP3_BITRATE_KBPS = 192;

/** Output channel count for every voiceover MP3. */
export const VOICEOVER_CHANNEL_COUNT = 2;

/** Sample rate used when mixing synced voiceover clips. */
export const VOICEOVER_SAMPLE_RATE_HZ = 44_100;

/** Waveform bar visuals (wavesurfer.js). */
export const WAVEFORM_BAR_WIDTH_PX = 2;
export const WAVEFORM_BAR_GAP_PX = 1;
export const WAVEFORM_HEIGHT_PX = 64;
export const WAVEFORM_CURSOR_WIDTH_PX = 1;

/** Tolerance used when comparing wall-clock segment boundaries. */
export const SEGMENT_BOUNDARY_EPSILON_SEC = 0.01;

/** Tolerance when fitting composed voiceover length to the video runtime. */
export const SPEECH_COMPOSE_EPSILON_SEC = 0.05;

/** Sample sentence used by the voice-preview endpoint (pre-localized hint key in en/api.json). */
export const VOICE_PREVIEW_FALLBACK_SENTENCE =
  "Hi! I'm a Frameline voice. Pick me to narrate your next video.";

/** TTL for cached voice-preview MP3s (seconds). 24h is fine — voices never change without a rebuild. */
export const VOICE_PREVIEW_CACHE_MAX_AGE_SEC = 86_400;
