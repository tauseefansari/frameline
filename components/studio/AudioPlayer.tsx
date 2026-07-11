"use client";

import { Box, IconButton, Paper, Stack, Typography, alpha, useTheme } from "@mui/material";
import PauseRounded from "@mui/icons-material/PauseRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import StopRounded from "@mui/icons-material/StopRounded";
import { WaveformSkeleton } from "@/components/studio/StudioSkeletons";
import { useTranslations } from "next-intl";
import { glassPaperBg } from "@/components/home/theme-visuals";
import { useEffect, useRef, useState } from "react";
import {
  WAVEFORM_BAR_GAP_PX,
  WAVEFORM_BAR_WIDTH_PX,
  WAVEFORM_CURSOR_WIDTH_PX,
  WAVEFORM_HEIGHT_PX,
} from "@/lib/constants/audio";
import { TABULAR_NUMBER_SX } from "@/lib/constants/ui";
import { formatTimecode } from "@/lib/format";

type Props = {
  /** URL to the MP3/WAV. May be `null` to render an empty placeholder. */
  src: string | null;
  /** Optional title shown above the waveform. */
  title?: string;
  /** Optional subtitle / hint. */
  subtitle?: string;
};

/**
 * MUI-styled audio player that renders the waveform via wavesurfer.js. Drops
 * the bare `<audio controls>` element so the studio's audio surfaces match
 * the rest of the design system (Paper card, themed buttons, theme colors
 * for the waveform).
 *
 * Loads wavesurfer lazily so it doesn't ship in the home-page bundle.
 */
export function AudioPlayer({ src, title, subtitle }: Props) {
  const theme = useTheme();
  const t = useTranslations("studio.player");
  const containerRef = useRef<HTMLDivElement | null>(null);
  // wavesurfer's instance type is loaded async; keep as unknown-ish ref.
  const waveRef = useRef<{ destroy: () => void; playPause: () => void; stop: () => void } | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !src) {
      return undefined;
    }
    let cancelled = false;
    setIsReady(false);
    setError(null);
    setDuration(0);
    setCurrentTime(0);

    (async () => {
      try {
        // Dynamic import keeps wavesurfer out of the home-page bundle.
        const mod = await import("wavesurfer.js");
        if (cancelled || !containerRef.current) return;
        const ws = mod.default.create({
          container: containerRef.current,
          waveColor: alpha(theme.palette.primary.main, 0.4),
          progressColor: theme.palette.primary.main,
          cursorColor: theme.palette.text.primary,
          cursorWidth: WAVEFORM_CURSOR_WIDTH_PX,
          barWidth: WAVEFORM_BAR_WIDTH_PX,
          barGap: WAVEFORM_BAR_GAP_PX,
          height: WAVEFORM_HEIGHT_PX,
          normalize: true,
          url: src,
        });
        ws.on("ready", () => {
          if (cancelled) return;
          setIsReady(true);
          setDuration(ws.getDuration());
        });
        ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
        ws.on("seeking", () => setCurrentTime(ws.getCurrentTime()));
        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => setIsPlaying(false));
        ws.on("error", (err: unknown) => {
          setError(err instanceof Error ? err.message : t("loadError"));
        });
        waveRef.current = ws;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("initError"));
        }
      }
    })();

    return () => {
      cancelled = true;
      waveRef.current?.destroy();
      waveRef.current = null;
    };
  }, [src, t, theme.palette.primary.main, theme.palette.text.primary]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: glassPaperBg(theme, 0.5, 0.96),
      }}
    >
      <Stack spacing={1.25}>
        {title || subtitle ? (
          <Stack spacing={0.25}>
            {title ? (
              <Typography variant="subtitle2" sx={{ fontWeight: 650 }}>
                {title}
              </Typography>
            ) : null}
            {subtitle ? (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        <Box
          ref={containerRef}
          sx={{
            width: "100%",
            minHeight: WAVEFORM_HEIGHT_PX,
            position: "relative",
          }}
        >
          {!isReady && src ? <WaveformSkeleton /> : null}
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <IconButton
            size="small"
            color="primary"
            disabled={!isReady}
            onClick={() => waveRef.current?.playPause()}
            aria-label={isPlaying ? t("pause") : t("play")}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.16),
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.26) },
            }}
          >
            {isPlaying ? <PauseRounded /> : <PlayArrowRounded />}
          </IconButton>
          <IconButton
            size="small"
            disabled={!isReady}
            onClick={() => waveRef.current?.stop()}
            aria-label={t("stop")}
          >
            <StopRounded />
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ ...TABULAR_NUMBER_SX, ml: 1 }}>
            {formatTimecode(currentTime)} / {formatTimecode(duration)}
          </Typography>
          {error ? (
            <Typography variant="caption" color="error" sx={{ ml: "auto" }}>
              {error}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
