import type { ToastSeverity } from "@/lib/types/toast";

/** Maximum centered content width (px) inside page gutters. */
export const CONTENT_MAX_PX = 1920;

/** How many toasts can stack on screen before older ones are dropped. */
export const TOAST_MAX_VISIBLE = 4;

/** Default auto-dismiss timing per severity (ms). `null` means sticky. */
export const TOAST_DEFAULT_DURATION_MS: Record<ToastSeverity, number | null> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: null,
};

/**
 * Enables OpenType tabular figures so timecodes and counters don't jitter as
 * digits change. Spread into any `sx` that renders numeric/timecode text:
 * `sx={{ ...TABULAR_NUMBER_SX, ml: 1 }}`.
 */
export const TABULAR_NUMBER_SX = { fontFeatureSettings: '"tnum"' } as const;
