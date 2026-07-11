import { alpha, type Theme } from "@mui/material/styles";

/** Headline gradient — derived from palette primary only */
export function headlineGradientCss(theme: Theme): string {
  const { primary, mode } = theme.palette;
  const a = alpha(primary.light, mode === "dark" ? 0.98 : 0.96);
  const b = alpha(primary.main, mode === "dark" ? 0.9 : 0.94);
  return `linear-gradient(120deg, ${a}, ${b})`;
}

export function heroWashBackground(theme: Theme): string {
  const c = theme.palette.primary.main;
  return `radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha(c, theme.palette.mode === "dark" ? 0.15 : 0.12)}, transparent 55%)`;
}

export function heroOrbBackground(theme: Theme): string {
  const c = theme.palette.primary.light;
  return `radial-gradient(circle at 85% 15%, ${alpha(c, theme.palette.mode === "dark" ? 0.12 : 0.1)}, transparent 42%)`;
}

export function heroVignetteBackground(theme: Theme): string {
  return theme.palette.mode === "dark"
    ? `radial-gradient(ellipse 90% 70% at 50% 100%, ${alpha(theme.palette.common.black, 0.48)}, transparent 55%)`
    : `radial-gradient(ellipse 95% 65% at 50% 108%, ${alpha(theme.palette.text.primary, 0.06)}, transparent 52%)`;
}

export function heroGridBackground(theme: Theme): string {
  const line = alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.055 : 0.065);
  return `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`;
}

export function sectionAccentBand(theme: Theme): string {
  const p = theme.palette.primary.main;
  return `linear-gradient(180deg, ${alpha(p, 0.07)}, transparent 45%, ${alpha(p, 0.05)})`;
}

export function heroGridOpacity(theme: Theme): number {
  return theme.palette.mode === "dark" ? 0.4 : 0.52;
}

/**
 * Translucent paper background for "glass" surfaces.
 * Picks a different opacity for dark vs. light so the surface stays legible.
 */
export function glassPaperBg(theme: Theme, darkOpacity = 0.45, lightOpacity = 0.88): string {
  return alpha(
    theme.palette.background.paper,
    theme.palette.mode === "dark" ? darkOpacity : lightOpacity,
  );
}
