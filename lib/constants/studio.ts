/** Studio editor / merge workspace tunables. */

/** Smallest meaningful trim duration; ranges shorter than this collapse to "no trim". */
export const MIN_TRIM_DURATION_SEC = 0.2;

/** Tolerance used to detect when both endpoints sit at the clip boundaries. */
export const FULL_RANGE_EPSILON_SEC = 0.05;

/** Lower bound for the trim slider "max" so a 0-duration clip still renders. */
export const MIN_TRIM_TOTAL_SEC = 0.1;

/** Granularity of the trim slider, in seconds. */
export const TRIM_SLIDER_STEP_SEC = 0.1;

/** Granularity of the playhead/scrubber slider, in seconds. */
export const PLAYHEAD_SLIDER_STEP_SEC = 0.05;

/** Selectable playback speeds in the video player's speed menu. `1` is normal. */
export const PLAYBACK_RATES: readonly number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** Default volume on player mount, in [0, 1]. */
export const VIDEO_PLAYER_DEFAULT_VOLUME = 1;

/** Step size for the up/down arrow buttons on transcript timecode spinners. */
export const TIMECODE_SPINNER_STEP_SEC = 0.5;

/** Minimum gap kept between adjacent transcript segments while editing. */
export const SEGMENT_EDIT_MIN_GAP_SEC = 0.05;

/** Max-height (px) of the scrollable transcript segment list. */
export const TRANSCRIPT_PANEL_MAX_HEIGHT_PX = 420;

/** Library / merge thumbnail dimensions. */
export const THUMB_WIDTH_PX = 184;
export const THUMB_INNER_WIDTH_PX = 160;
export const MERGE_THUMB_WIDTH_PX = 96;
export const MERGE_THUMB_HEIGHT_PX = 54;

/** Length cap on the free-text "custom tone" input — mirrors the server zod cap. */
export const CUSTOM_TONE_MAX_LENGTH = 120;

/** Length cap on the optional repo/README context — mirrors the server zod cap. */
export const REPO_CONTEXT_MAX_LENGTH = 4_000;

/** Fraction of REPO_CONTEXT_MAX_LENGTH at which the counter turns red. */
export const REPO_CONTEXT_WARN_RATIO = 0.9;

/** Tab-switch animation tunables (motion/react). */
export const PANEL_MOTION_DURATION_SEC = 0.4;
export const PANEL_MOTION_EASING = [0.22, 1, 0.36, 1] as const;
export const PANEL_MOTION_OFFSET_PX = 12;
