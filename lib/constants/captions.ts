/**
 * ASS / SRT caption styling. The ASS subtitle file shipped to ffmpeg uses
 * fixed PlayRes so libass scales the font proportionally at any resolution.
 */

export const ASS_PLAY_RES_X = 1920;
export const ASS_PLAY_RES_Y = 1080;
export const ASS_FONT_SIZE = 44;
export const ASS_OUTLINE = 4;
export const ASS_MARGIN_V = 40;
export const ASS_MARGIN_H = 120;

/** Caption wrap behavior. */
export const CAPTION_LINE_CHAR_LIMIT = 42;
export const CAPTION_MAX_LINES = 2;

/** Minimum on-screen duration so libass doesn't refuse zero-length cues. */
export const CAPTION_MIN_DURATION_SEC = 0.1;
