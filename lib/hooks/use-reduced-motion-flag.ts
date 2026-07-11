"use client";

import { useMediaQuery } from "@mui/material";

/** Boolean flag — collapses MUI's media query API for downstream callers. */
export function useReducedMotionFlag(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
