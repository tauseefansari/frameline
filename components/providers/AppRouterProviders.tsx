"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { ReactNode } from "react";
import type { ColorMode } from "@/lib/theme/color-mode";
import { AppThemeProvider } from "@/components/theme/AppThemeProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { GlobalProgressProvider } from "@/lib/hooks/use-global-progress";

export function AppRouterProviders({
  children,
  initialColorMode,
}: {
  children: ReactNode;
  initialColorMode: ColorMode;
}) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <AppThemeProvider initialColorMode={initialColorMode}>
        <GlobalProgressProvider>
          <ToastProvider>{children}</ToastProvider>
        </GlobalProgressProvider>
      </AppThemeProvider>
    </AppRouterCacheProvider>
  );
}
