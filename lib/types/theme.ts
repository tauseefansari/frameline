import type { ColorMode } from "@/lib/theme/color-mode";

/** Value exposed by `ColorModeContext` and consumed via `useColorMode()`. */
export type ColorModeContextValue = {
  mode: ColorMode;
  toggleColorMode: () => void;
};
