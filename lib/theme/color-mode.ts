/** Cookie used for SSR theme hydration (see `app/layout.tsx`). */

export const COLOR_MODE_COOKIE = "frameline-color-mode";

export enum ColorMode {
  Light = "light",
  Dark = "dark",
}

export const DEFAULT_COLOR_MODE = ColorMode.Dark;

export function parseColorModeCookie(value: string | undefined): ColorMode | null {
  if (value === ColorMode.Light || value === ColorMode.Dark) return value;
  return null;
}
