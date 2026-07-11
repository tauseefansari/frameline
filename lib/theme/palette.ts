"use client";

import { alpha, type PaletteMode, type PaletteOptions } from "@mui/material/styles";
import type { AppDesignTokens } from "@/lib/theme/design-tokens";

export function buildPalette(
  mode: PaletteMode,
  t: AppDesignTokens,
  isDark: boolean,
  focusRing: string,
): PaletteOptions {
  return {
    mode,
    primary: {
      main: t.accent.main,
      light: t.accent.light,
      dark: t.accent.dark,
      contrastText: isDark ? "#0b1020" : "#ffffff",
    },
    secondary: { main: t.accent.muted },
    success: { main: t.feedback.success, contrastText: t.feedback.onFilled },
    info: { main: t.feedback.info, contrastText: t.feedback.onFilled },
    warning: { main: t.feedback.warning, contrastText: t.feedback.onFilled },
    error: { main: t.feedback.error, contrastText: t.feedback.onFilled },
    background: {
      default: t.canvas,
      paper: t.paper,
    },
    divider: t.divider,
    text: {
      primary: t.text.primary,
      secondary: t.text.secondary,
      disabled: t.text.disabled,
    },
    action: {
      hover: alpha(t.accent.main, isDark ? 0.08 : 0.1),
      selected: alpha(t.accent.main, isDark ? 0.14 : 0.12),
      disabled: t.text.disabled,
      disabledBackground: alpha(t.text.primary, isDark ? 0.08 : 0.06),
      focus: focusRing,
    },
  };
}
