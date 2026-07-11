"use client";

import { use } from "react";
import { ColorModeContext } from "@/components/theme/color-mode-context";
import type { ColorModeContextValue } from "@/lib/types/theme";

/** React 19.2 `use(Context)` consumer. No conditional read — safe everywhere under the provider. */
export function useColorMode(): ColorModeContextValue {
  return use(ColorModeContext);
}
