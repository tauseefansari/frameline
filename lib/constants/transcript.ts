/**
 * Vision / transcript pipeline tunables. The narration model writes to a
 * fixed words-per-minute baseline so the synthesized voice fills every
 * second of the video without dead air.
 */

/** Piper's natural speaking rate. Used to size the model's word budget.
 *  Measured at ~130 wpm on default Piper voices at normal speed. */
export const WORDS_PER_MINUTE = 130;

/** Aim for roughly one segment every ~18 s on long clips. */
export const SECONDS_PER_SEGMENT_TARGET = 18;

/**
 * Max words per transcript segment when rebalancing (~two UI lines at body2).
 */
export const MAX_WORDS_PER_SEGMENT = 20;

/** Max natural speech duration per segment before splitting. */
export const MAX_SEGMENT_SPEECH_SEC = 8;

/** Max whole sentences combined into one segment. */
export const MAX_SENTENCES_PER_SEGMENT = 2;

/** Buffer applied to the per-segment word budget so the speaker never finishes early. */
export const WORD_BUDGET_BUFFER = 1.15;

/**
 * Target fill for the whole-script word budget. Slightly above 1.0 so Piper
 * has enough text to fill the runtime at natural speed.
 */
export const SPEECH_FILL_MARGIN = 1.02;

/**
 * External LLMs (ChatGPT, Gemini, …) routinely overshoot stated word limits.
 * Used only in prompt copy to suggest a planning floor — sync/TTS use {@link SPEECH_FILL_MARGIN}.
 */
export const EXTERNAL_PROMPT_OVERSHOOT_FACTOR = 1.12;

/** Min speech/video duration ratio before tempo-stretching short voiceover to fill the clip. */
export const SPEECH_STRETCH_MIN_RATIO = 0.8;

/** Hard floor for any segment so ffmpeg trim doesn't choke on zero-length slots. */
export const MIN_SEGMENT_DURATION_SEC = 0.2;

/** How much of the head of the video to scan for leading silence/black. */
export const INTRO_PROBE_SEC = 2;

/** Minimum number of frames sent to the vision model. */
export const MIN_FRAMES = 2;

/** Maximum number of frames sent to the vision model in a single call. */
export const MAX_FRAMES = 16;

/** One frame per ~4 seconds gives the model enough temporal signal to fill the narration. */
export const SECONDS_PER_FRAME = 4;

/** Threshold (mean luminance, 0..1) under which a starting frame counts as "black". */
export const INTRO_BLACK_LUMA_MAX = 0.08;
