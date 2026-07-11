"use client";

import { alpha, Box, Slider, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { formatTimecode } from "@/lib/format";
import { generateVideoFilmstrip } from "@/lib/video/thumbnail.client";

interface FilmstripRangeRailProps {
  videoUrl: string | null;
  durationSec: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  step: number;
  disabled?: boolean;
  ariaLabel: string;
  /** Optional live playhead overlay (Timeline tab only). */
  playheadSec?: number;
}

/**
 * Pro-style NLE filmstrip rail with full-height vertical IN/OUT trim handles.
 * Shared between TimelineEditor (with live playhead) and MergeTrimDialog.
 */
export function FilmstripRangeRail({
  videoUrl,
  durationSec,
  value,
  onChange,
  step,
  disabled = false,
  ariaLabel,
  playheadSec,
}: FilmstripRangeRailProps) {
  const theme = useTheme();
  const [filmstrip, setFilmstrip] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!videoUrl) {
        if (!cancelled) setFilmstrip([]);
        return;
      }
      const frames = await generateVideoFilmstrip(videoUrl, { frames: 14, frameWidth: 192 });
      if (!cancelled) setFilmstrip(frames);
    })();
    return () => {
      cancelled = true;
    };
  }, [videoUrl]);

  const safeDuration = Math.max(durationSec, 0);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: 72, sm: 88, md: 104 },
        borderRadius: 0,
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
        bgcolor: alpha(theme.palette.common.black, 0.85),
      }}
    >
      {filmstrip.length > 0 ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          {filmstrip.map((src, idx) => (
            <Box
              key={idx}
              component="img"
              src={src}
              alt=""
              draggable={false}
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                height: "100%",
                objectFit: "cover",
                display: "block",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          ))}
        </Box>
      ) : null}

      {safeDuration > 0 ? (
        <>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: `${(value[0] / safeDuration) * 100}%`,
              bgcolor: alpha(theme.palette.common.black, 0.62),
              pointerEvents: "none",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: `${((safeDuration - value[1]) / safeDuration) * 100}%`,
              bgcolor: alpha(theme.palette.common.black, 0.62),
              pointerEvents: "none",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${(value[0] / safeDuration) * 100}%`,
              width: `${((value[1] - value[0]) / safeDuration) * 100}%`,
              borderTop: `2px solid ${theme.palette.primary.main}`,
              borderBottom: `2px solid ${theme.palette.primary.main}`,
              pointerEvents: "none",
            }}
          />
          {typeof playheadSec === "number" ? (
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `calc(${(playheadSec / safeDuration) * 100}% - 1px)`,
                width: 2,
                bgcolor: theme.palette.warning.main,
                boxShadow: `0 0 0 1px ${alpha(theme.palette.common.black, 0.6)}`,
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          ) : null}
        </>
      ) : null}

      <Slider
        value={value}
        min={0}
        max={Math.max(safeDuration, 0.001)}
        step={step}
        disabled={disabled}
        onChange={(_, v) => {
          if (!Array.isArray(v)) return;
          onChange([v[0], v[1]] as [number, number]);
        }}
        aria-label={ariaLabel}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => formatTimecode(v)}
        disableSwap
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          padding: "0 !important",
          color: theme.palette.primary.main,
          "& .MuiSlider-rail": { opacity: 0, height: "100%" },
          "& .MuiSlider-track": { opacity: 0, border: "none" },
          "& .MuiSlider-thumb": {
            width: 12,
            height: "100%",
            borderRadius: 1,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 0 0 1px ${alpha(theme.palette.common.black, 0.45)}`,
            transition: "background-color 120ms ease",
            "&::after": {
              content: '""',
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 2,
              height: "55%",
              bgcolor: alpha(theme.palette.common.white, 0.85),
              borderRadius: 1,
            },
            "&:hover, &.Mui-focusVisible, &.Mui-active": {
              bgcolor: theme.palette.primary.dark,
              boxShadow: `0 0 0 6px ${alpha(theme.palette.primary.main, 0.18)}`,
            },
          },
        }}
      />
    </Box>
  );
}
