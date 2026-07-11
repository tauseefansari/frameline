"use client";

import { Box, LinearProgress } from "@mui/material";
import { useGlobalProgress } from "@/lib/hooks/use-global-progress";

/**
 * Fixed progress strip rendered just under the AppBar. Shows whenever any
 * {@link useApiAction} dispatch is in flight (script generation, TTS, video
 * render/cut/clip/concat) plus any local async wrapped via `wrap()` (thumbnail
 * decoding, duration probes), so individual buttons no longer need their own
 * circular spinners or per-section LinearProgress.
 */
export function GlobalProgressBar() {
  const { active } = useGlobalProgress();
  const visible = active > 0;
  return (
    <Box
      role="progressbar"
      aria-busy={visible}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        zIndex: (theme) => theme.zIndex.appBar + 2,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease-out",
        // Soft glow makes the bar legible on top of the translucent AppBar.
        boxShadow: (theme) => (visible ? `0 1px 8px 0 ${theme.palette.primary.main}80` : "none"),
      }}
    >
      {visible ? (
        <LinearProgress
          color="primary"
          sx={{
            height: 4,
            backgroundColor: (theme) => `${theme.palette.primary.main}1f`,
            "& .MuiLinearProgress-bar": {
              transitionDuration: "1.2s",
              backgroundImage: (theme) =>
                `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            },
          }}
        />
      ) : null}
    </Box>
  );
}
