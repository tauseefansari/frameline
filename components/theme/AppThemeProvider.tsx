"use client";

import { ThemeProvider, CssBaseline, GlobalStyles } from "@mui/material";
import type { PaletteMode } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { setColorModeCookie } from "@/app/actions/preferences";
import { createAppTheme } from "@/lib/theme/create-app-theme";
import { ColorMode } from "@/lib/theme/color-mode";
import { getDesignTokens } from "@/lib/theme/design-tokens";
import { ColorModeContext } from "@/components/theme/color-mode-context";

export function AppThemeProvider({
  children,
  initialColorMode,
}: {
  children: ReactNode;
  initialColorMode: ColorMode;
}) {
  const [mode, setMode] = useState<ColorMode>(initialColorMode);

  const toggleColorMode = useCallback(() => {
    setMode((m) => {
      const next = m === ColorMode.Dark ? ColorMode.Light : ColorMode.Dark;
      return next;
    });
  }, []);

  // Keep the cookie in sync after each mode change. Using useEffect ensures
  // the server action is called after the render, never during it — which
  // avoids the "setState on Router while rendering" warning React 19 emits
  // when a server action is invoked inside a useState updater.
  useEffect(() => {
    void setColorModeCookie(mode);
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode as PaletteMode), [mode]);

  const tokens = useMemo(() => getDesignTokens(mode as PaletteMode), [mode]);

  const value = useMemo(() => ({ mode, toggleColorMode }), [mode, toggleColorMode]);

  return (
    <ColorModeContext value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            "@media (prefers-reduced-motion: reduce)": {
              "*, *::before, *::after": {
                animationDuration: "0.001ms !important",
                animationIterationCount: "1 !important",
                transitionDuration: "0.001ms !important",
              },
            },
            body: {
              position: "relative",
              minHeight: "100dvh",
              overflowX: "hidden",
            },
            html: {
              position: "relative",
              overflowX: "hidden",
            },
            "body::before": {
              content: '""',
              pointerEvents: "none",
              position: "fixed",
              inset: 0,
              opacity: tokens.noise.opacity,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
              mixBlendMode: tokens.noise.blendMode,
              zIndex: 0,
            },
            "#___mui-root-stack": {
              position: "relative",
              zIndex: 1,
            },
          }}
        />
        <div id="___mui-root-stack">{children}</div>
      </ThemeProvider>
    </ColorModeContext>
  );
}
