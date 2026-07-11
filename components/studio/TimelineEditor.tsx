"use client";

import ContentCutOutlined from "@mui/icons-material/ContentCutOutlined";
import PublishedWithChangesOutlined from "@mui/icons-material/PublishedWithChangesOutlined";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import RestartAltOutlined from "@mui/icons-material/RestartAltOutlined";
import StopOutlined from "@mui/icons-material/StopOutlined";
import { alpha, Button, Chip, Stack, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { formatTimecode } from "@/lib/format";
import type { VideoPlayerState } from "@/lib/types/video";
import type { TimelineRange } from "@/lib/types/studio";
import { PLAYHEAD_SLIDER_STEP_SEC } from "@/lib/constants/studio";
import { TABULAR_NUMBER_SX } from "@/lib/constants/ui";
import { FilmstripRangeRail } from "@/components/studio/FilmstripRangeRail";

export function TimelineEditor({
  player,
  videoUrl,
  range,
  onRangeChange,
  onApply,
  onReset,
  onDownload,
  isCutting,
  hasCut,
  onClipInPlace,
  isClipping = false,
}: {
  player: VideoPlayerState;
  videoUrl: string | null;
  range: TimelineRange;
  onRangeChange: (next: TimelineRange) => void;
  onApply: () => void;
  onReset: () => void;
  onDownload: () => void;
  isCutting: boolean;
  hasCut: boolean;
  /** When provided, renders the "Clip in place" action next to "Trim clip". */
  onClipInPlace?: () => void;
  isClipping?: boolean;
}) {
  const t = useTranslations("studio.timeline");
  const theme = useTheme();
  const duration = Math.max(player.duration, 0);

  // Snap range to a fresh duration the first time it's known.
  useEffect(() => {
    if (duration > 0 && range.out <= 0) {
      onRangeChange({ in: 0, out: duration });
    }
  }, [duration, range.out, onRangeChange]);

  const value = useMemo<[number, number]>(
    () => [Math.min(range.in, duration), Math.min(range.out > 0 ? range.out : duration, duration)],
    [range, duration],
  );

  const length = Math.max(value[1] - value[0], 0);

  const playSelection = () => {
    player.seek(value[0]);
    void player.play();
  };

  // Auto-pause when playhead crosses the OUT marker during selection playback.
  useEffect(() => {
    if (!player.isPlaying) return;
    if (player.currentTime >= value[1] && value[1] > 0) {
      player.pause();
    }
  }, [player, value]);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Chip
          size="small"
          icon={<FlagOutlined />}
          label={`${t("inLabel")} · ${formatTimecode(value[0])}`}
          sx={{
            ...TABULAR_NUMBER_SX,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
          }}
        />
        <Chip
          size="small"
          icon={<FlagOutlined />}
          label={`${t("outLabel")} · ${formatTimecode(value[1])}`}
          sx={{
            ...TABULAR_NUMBER_SX,
            bgcolor: alpha(theme.palette.secondary.main, 0.12),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.28)}`,
          }}
        />
        <Chip
          size="small"
          label={`${t("lengthLabel")} · ${formatTimecode(length)}`}
          sx={TABULAR_NUMBER_SX}
        />
      </Stack>

      {/* Pro-style filmstrip rail: thin horizontal strip showing every part
        of the clip with vertical IN/OUT trim handles overlaid. Inspired by
        CapCut / Premiere — the slider thumbs become full-height grabbers and
        the unselected portions are dimmed. */}
      <FilmstripRangeRail
        videoUrl={videoUrl}
        durationSec={duration}
        value={value}
        onChange={(v) => onRangeChange({ in: v[0], out: v[1] })}
        step={PLAYHEAD_SLIDER_STEP_SEC}
        disabled={!player.isReady}
        ariaLabel={t("title")}
        playheadSec={player.currentTime}
      />

      <Typography variant="body2" color="text.secondary">
        {t("rangeHint", {
          start: formatTimecode(value[0]),
          end: formatTimecode(value[1]),
        })}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        useFlexGap
        sx={{ flexWrap: "wrap", gap: 1.25 }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            onRangeChange({ in: player.currentTime, out: Math.max(value[1], player.currentTime) })
          }
          disabled={!player.isReady}
        >
          {t("setIn")}
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            onRangeChange({ in: Math.min(value[0], player.currentTime), out: player.currentTime })
          }
          disabled={!player.isReady}
        >
          {t("setOut")}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PlayArrowOutlined />}
          onClick={playSelection}
          disabled={!player.isReady || length <= 0}
        >
          {t("playRange")}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<StopOutlined />}
          onClick={() => {
            player.pause();
            player.seek(value[0]);
          }}
          disabled={!player.isReady}
        >
          {t("stopRange")}
        </Button>
        <Button size="small" variant="text" startIcon={<RestartAltOutlined />} onClick={onReset}>
          {t("reset")}
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} useFlexGap sx={{ flexWrap: "wrap", gap: 1.5 }}>
        <Button
          variant="contained"
          onClick={onApply}
          disabled={isCutting || length <= 0 || !player.isReady}
          startIcon={<ContentCutOutlined />}
        >
          {isCutting ? t("cutting") : t("apply")}
        </Button>
        {onClipInPlace ? (
          <Button
            variant="outlined"
            onClick={onClipInPlace}
            disabled={isClipping || length <= 0 || !player.isReady}
            startIcon={<PublishedWithChangesOutlined />}
          >
            {isClipping ? t("clipping") : t("clipInPlace")}
          </Button>
        ) : null}
        {hasCut ? (
          <Button variant="outlined" onClick={onDownload}>
            {t("downloadCut")}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
