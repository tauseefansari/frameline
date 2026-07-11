"use client";

import { keyframes } from "@emotion/react";
import PauseRounded from "@mui/icons-material/PauseRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  ToggleButton,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import type { PiperVoiceId } from "@/lib/constants/piper-voices";

// --- Pseudo waveform ------------------------------------------------------

const WAVEFORM_BAR_COUNT = 28;
const waveformBounce = keyframes`
  0%, 100% { transform: scaleY(0.28); }
  50% { transform: scaleY(1); }
`;

/** Tiny string hash so each voice id maps to a stable bar pattern. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function VoicePresetWaveform({
  voiceId,
  isPlaying,
  isSelected,
}: {
  voiceId: string;
  isPlaying: boolean;
  isSelected: boolean;
}) {
  const theme = useTheme();
  const seed = hashString(voiceId);
  const accent = isSelected ? theme.palette.primary.main : theme.palette.text.primary;
  return (
    <Box
      aria-hidden
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "3px",
        height: 32,
        flex: 1,
        minWidth: 80,
        ml: 1,
        opacity: isPlaying ? 1 : isSelected ? 0.9 : 0.6,
        transition: "opacity 200ms ease",
      }}
    >
      {Array.from({ length: WAVEFORM_BAR_COUNT }).map((_, i) => {
        // Pseudo-random height in [0.25, 1.0] derived from (seed, index).
        const r = ((seed * 9301 + i * 49297) % 233280) / 233280;
        const height = 0.25 + r * 0.75;
        // Bars near the centre lean slightly taller for an organic envelope.
        const center = WAVEFORM_BAR_COUNT / 2;
        const envelope = 1 - Math.abs(i - center) / (center * 1.6);
        const finalHeight = Math.min(1, height * (0.65 + envelope * 0.55));
        const delay = (i % 9) * 70;
        return (
          <Box
            key={i}
            sx={{
              width: 2.5,
              height: "100%",
              borderRadius: 999,
              transformOrigin: "center",
              transform: `scaleY(${finalHeight})`,
              background: `linear-gradient(180deg, ${alpha(accent, 0.95)} 0%, ${alpha(accent, 0.55)} 100%)`,
              animation: isPlaying
                ? `${waveformBounce} 950ms ease-in-out ${delay}ms infinite`
                : "none",
              transition: "background 200ms ease, transform 220ms ease",
            }}
          />
        );
      })}
    </Box>
  );
}

// --- Voice preset card ----------------------------------------------------

type VoicePresetCardProps = {
  /** Voice id this card represents. */
  voiceId: PiperVoiceId;
  /** Whether the user has selected this voice for synthesis. */
  isSelected: boolean;
  /** Whether the card's preview audio is actively playing. */
  isPlaying: boolean;
  /** Whether the preview is currently loading (fetching the MP3). */
  isLoading: boolean;
  /** Toggle play/pause for this card's preview. */
  onTogglePreview: () => void;
  /** Pass-through props from `ToggleButtonGroup` (`value`, `selected`, etc.). */
  // ToggleButton inside a ToggleButtonGroup receives extra props at runtime;
  // we forward them via spread so the group's controlled state still works.
  // We cannot tighten this without losing MUI's selection wiring.
  toggleButtonProps?: Record<string, unknown>;
};

/**
 * Single ElevenLabs-style voice preset row. The whole card acts as a
 * `ToggleButton` for selection; the inset play/pause icon controls the
 * in-place audio preview without bubbling up to the selection handler.
 */
export function VoicePresetCard({
  voiceId,
  isSelected,
  isPlaying,
  isLoading,
  onTogglePreview,
  toggleButtonProps,
}: VoicePresetCardProps) {
  const theme = useTheme();
  const t = useTranslations("studio");

  const previewLabel = isPlaying
    ? (t("voice.previewStop") as string)
    : (t("voice.previewPlay") as string);

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        minWidth: { xs: 0, sm: 280 },
        flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 10px)", lg: "1 1 320px" },
        maxWidth: { sm: "calc(50% - 10px)", lg: 380 },
      }}
    >
      <ToggleButton
        value={voiceId}
        {...toggleButtonProps}
        sx={{
          textTransform: "none",
          // Reserve space on the left for the absolutely-positioned play button.
          pl: 7.5,
          pr: 1.5,
          py: 1.25,
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1.5,
          "&.Mui-selected": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            borderColor: alpha(theme.palette.primary.main, 0.55),
            boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.35)}, 0 8px 24px -14px ${alpha(theme.palette.primary.main, 0.7)}`,
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.16),
              borderColor: alpha(theme.palette.primary.main, 0.7),
            },
          },
        }}
      >
        <Stack spacing={0} sx={{ alignItems: "flex-start", textAlign: "left", minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {t(`voices.${voiceId}.label`)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {t(`voices.${voiceId}.hint`)}
          </Typography>
        </Stack>
        <VoicePresetWaveform voiceId={voiceId} isPlaying={isPlaying} isSelected={isSelected} />
      </ToggleButton>
      {/*
        The play/pause control is rendered as a sibling overlaying the
        ToggleButton (rather than as a child) to avoid nesting a <button>
        inside another <button>, which is invalid HTML and trips React's
        hydration validator.
      */}
      <Tooltip title={previewLabel} placement="top" arrow>
        <IconButton
          size="small"
          aria-label={previewLabel}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePreview();
          }}
          sx={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 38,
            height: 38,
            color: isSelected ? "primary.main" : "text.primary",
            background: isSelected
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.28)} 0%, ${alpha(theme.palette.primary.main, 0.14)} 100%)`
              : alpha(theme.palette.text.primary, 0.08),
            boxShadow: isPlaying ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.18)}` : "none",
            transition: "background 200ms ease, box-shadow 220ms ease, color 180ms ease",
            "&:hover": {
              background: isSelected
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)} 0%, ${alpha(theme.palette.primary.main, 0.22)} 100%)`
                : alpha(theme.palette.text.primary, 0.16),
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={16} thickness={5} color="inherit" />
          ) : isPlaying ? (
            <PauseRounded fontSize="small" />
          ) : (
            <PlayArrowRounded fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
