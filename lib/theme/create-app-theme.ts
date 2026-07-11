"use client";

import { alpha, createTheme, type PaletteMode, type Theme } from "@mui/material/styles";
import { getDesignTokens } from "@/lib/theme/design-tokens";
import { buildPalette } from "@/lib/theme/palette";
import { typographyOptions } from "@/lib/theme/typography";
import { buildComponents } from "@/lib/theme/theme-components";

export function createAppTheme(mode: PaletteMode): Theme {
  const t = getDesignTokens(mode);
  const isDark = mode === "dark";

  const focusRing = alpha(t.accent.main, isDark ? 0.55 : 0.45);
  const fieldBg = alpha(t.canvas, isDark ? 0.35 : 0.55);
  const fieldBgHover = alpha(t.canvas, isDark ? 0.5 : 0.7);

  return createTheme({
    palette: buildPalette(mode, t, isDark, focusRing),
    shape: { borderRadius: 16 },
    typography: typographyOptions,
    components: buildComponents(t, isDark, fieldBg, fieldBgHover, focusRing),
  });
}
