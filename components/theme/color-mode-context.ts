"use client";

import { createContext } from "react";
import { ColorMode } from "@/lib/theme/color-mode";
import type { ColorModeContextValue } from "@/lib/types/theme";

/**
 * Provider lives in `AppThemeProvider`; consumers read with React 19.2 `use(ColorModeContext)`.
 * Default value lets tooling/Storybook render in light mode without a wrapper.
 */
export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: ColorMode.Dark,
  toggleColorMode: () => {},
});

ColorModeContext.displayName = "ColorModeContext";
