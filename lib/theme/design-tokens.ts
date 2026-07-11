import type { PaletteMode } from "@mui/material";

/**
 * Minimal design tokens. Two surfaces (canvas/paper) + a single accent +
 * neutral text/borders. Deliberately solid (no translucency) so toasts,
 * menus, and dialogs render the same over any background.
 */
export type AppDesignTokens = {
  accent: {
    main: string;
    light: string;
    dark: string;
    muted: string;
  };
  canvas: string;
  paper: string;
  paperElevated: string;
  borderSubtle: string;
  divider: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  /** Severity colors used by alerts/toasts. Kept solid for legibility. */
  feedback: {
    success: string;
    info: string;
    warning: string;
    error: string;
    /** Foreground that pairs with the filled severity background. */
    onFilled: string;
  };
  noise: {
    opacity: number;
    blendMode: "overlay" | "multiply" | "soft-light";
  };
  scrollbar: {
    thumb: string;
    track: string;
  };
};

const dark: AppDesignTokens = {
  accent: {
    main: "#5eead4",
    light: "#99f6e4",
    dark: "#2dd4bf",
    muted: "rgba(94, 234, 212, 0.55)",
  },
  // Solid neutral slate scale — no translucency, so cards never bleed
  // through one another on busy hero backgrounds.
  canvas: "#0b1120",
  paper: "#111a2e",
  paperElevated: "#172238",
  borderSubtle: "rgba(148, 163, 184, 0.18)",
  divider: "rgba(148, 163, 184, 0.14)",
  text: {
    primary: "#f1f5f9",
    secondary: "#cbd5e1",
    disabled: "rgba(203, 213, 225, 0.42)",
  },
  feedback: {
    success: "#34d399",
    info: "#60a5fa",
    warning: "#fbbf24",
    error: "#f87171",
    onFilled: "#0b1120",
  },
  noise: { opacity: 0.03, blendMode: "overlay" },
  scrollbar: { thumb: "#475569", track: "transparent" },
};

const light: AppDesignTokens = {
  accent: {
    main: "#0d9488",
    light: "#2dd4bf",
    dark: "#0f766e",
    muted: "rgba(13, 148, 136, 0.4)",
  },
  canvas: "#f8fafc",
  paper: "#ffffff",
  paperElevated: "#ffffff",
  borderSubtle: "rgba(15, 23, 42, 0.1)",
  divider: "rgba(15, 23, 42, 0.09)",
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    disabled: "rgba(71, 85, 105, 0.5)",
  },
  feedback: {
    success: "#15803d",
    info: "#1d4ed8",
    warning: "#b45309",
    error: "#b91c1c",
    onFilled: "#ffffff",
  },
  noise: { opacity: 0.02, blendMode: "multiply" },
  scrollbar: { thumb: "#cbd5e1", track: "transparent" },
};

export const APP_DESIGN_TOKENS: Record<PaletteMode, AppDesignTokens> = {
  dark,
  light,
};

export function getDesignTokens(mode: PaletteMode): AppDesignTokens {
  return APP_DESIGN_TOKENS[mode];
}
