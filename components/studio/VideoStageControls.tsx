"use client";

import FastForwardOutlined from "@mui/icons-material/FastForwardOutlined";
import FastRewindOutlined from "@mui/icons-material/FastRewindOutlined";
import FullscreenExitOutlined from "@mui/icons-material/FullscreenExitOutlined";
import FullscreenOutlined from "@mui/icons-material/FullscreenOutlined";
import PauseOutlined from "@mui/icons-material/PauseOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import SlowMotionVideoOutlined from "@mui/icons-material/SlowMotionVideoOutlined";
import VolumeDownOutlined from "@mui/icons-material/VolumeDownOutlined";
import VolumeOffOutlined from "@mui/icons-material/VolumeOffOutlined";
import VolumeUpOutlined from "@mui/icons-material/VolumeUpOutlined";
import {
  alpha,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Slider,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useState, type MouseEvent, type RefObject } from "react";
import { PLAYBACK_RATES, PLAYHEAD_SLIDER_STEP_SEC } from "@/lib/constants/studio";
import { TABULAR_NUMBER_SX } from "@/lib/constants/ui";
import { formatTimecode } from "@/lib/format";
import type { VideoPlayerState } from "@/lib/types/video";

interface VideoStageControlsProps {
  player: VideoPlayerState;
  stageRef: RefObject<HTMLDivElement | null>;
}

export function VideoStageControls({ player, stageRef }: VideoStageControlsProps) {
  const t = useTranslations("studio.stage");
  const theme = useTheme();
  const {
    duration,
    currentTime,
    isPlaying,
    isReady,
    isMuted,
    volume,
    playbackRate,
    isFullscreen,
    toggle,
    step,
    seek,
    setVolume,
    toggleMuted,
    setPlaybackRate,
    toggleFullscreen,
  } = player;

  const [speedAnchor, setSpeedAnchor] = useState<HTMLElement | null>(null);
  const openSpeedMenu = (e: MouseEvent<HTMLElement>) => setSpeedAnchor(e.currentTarget);
  const closeSpeedMenu = () => setSpeedAnchor(null);

  const VolumeIcon =
    isMuted || volume === 0
      ? VolumeOffOutlined
      : volume < 0.5
        ? VolumeDownOutlined
        : VolumeUpOutlined;

  const speedLabelFor = (rate: number) =>
    rate === 1 ? t("speedNormal") : `${rate.toString().replace(/\.0$/, "")}×`;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: "auto 0 0 0",
        px: 1.25,
        pt: 4,
        pb: 0.75,
        background: `linear-gradient(180deg, ${alpha(
          theme.palette.common.black,
          0,
        )} 0%, ${alpha(theme.palette.common.black, 0.78)} 100%)`,
        color: "#f8fafc",
        opacity: isReady ? 1 : 0,
        transition: "opacity 180ms ease",
      }}
    >
      <Slider
        size="small"
        value={Math.min(currentTime, duration || 0)}
        min={0}
        max={Math.max(duration, 0.001)}
        step={PLAYHEAD_SLIDER_STEP_SEC}
        disabled={!isReady}
        onChange={(_, v) => seek(typeof v === "number" ? v : v[0])}
        aria-label={t("playLabel")}
        sx={{
          color: theme.palette.primary.main,
          py: 0.5,
          "& .MuiSlider-thumb": { width: 12, height: 12 },
          "& .MuiSlider-rail": { opacity: 0.42, color: "#fff" },
        }}
      />

      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <Tooltip title={isPlaying ? t("pauseLabel") : t("playLabel")}>
          <span>
            <IconButton size="small" onClick={toggle} disabled={!isReady} sx={{ color: "#f8fafc" }}>
              {isPlaying ? (
                <PauseOutlined fontSize="small" />
              ) : (
                <PlayArrowOutlined fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t("stepBack")}>
          <span>
            <IconButton
              size="small"
              onClick={() => step(-1)}
              disabled={!isReady}
              sx={{ color: "#f8fafc" }}
            >
              <FastRewindOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t("stepForward")}>
          <span>
            <IconButton
              size="small"
              onClick={() => step(1)}
              disabled={!isReady}
              sx={{ color: "#f8fafc" }}
            >
              <FastForwardOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: "center",
            ml: 0.5,
            "& .volume-slider": { width: 0, opacity: 0, transition: "all 180ms ease" },
            "&:hover .volume-slider, &:focus-within .volume-slider": {
              width: 84,
              opacity: 1,
              ml: 0.5,
            },
          }}
        >
          <Tooltip title={isMuted ? t("unmuteLabel") : t("muteLabel")}>
            <IconButton
              size="small"
              onClick={toggleMuted}
              aria-label={isMuted ? t("unmuteLabel") : t("muteLabel")}
              sx={{ color: "#f8fafc" }}
            >
              <VolumeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box
            className="volume-slider"
            sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}
          >
            <Slider
              size="small"
              value={isMuted ? 0 : volume}
              min={0}
              max={1}
              step={0.01}
              onChange={(_, v) => setVolume(typeof v === "number" ? v : v[0])}
              aria-label={t("volumeLabel")}
              sx={{
                color: "#f8fafc",
                "& .MuiSlider-thumb": { width: 10, height: 10 },
                "& .MuiSlider-rail": { opacity: 0.42 },
              }}
            />
          </Box>
        </Stack>

        <Box sx={{ width: 8 }} />

        <Typography
          variant="caption"
          sx={{ ...TABULAR_NUMBER_SX, ml: 1, color: alpha("#fff", 0.92), whiteSpace: "nowrap" }}
        >
          {`${formatTimecode(currentTime)} / ${formatTimecode(duration)}`}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={t("speedLabel")}>
          <IconButton
            size="small"
            onClick={openSpeedMenu}
            aria-label={t("speedLabel")}
            sx={{ color: "#f8fafc", gap: 0.25 }}
          >
            <SlowMotionVideoOutlined fontSize="small" />
            <Typography variant="caption" sx={{ ml: 0.25, color: "inherit" }}>
              {speedLabelFor(playbackRate)}
            </Typography>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={speedAnchor}
          open={Boolean(speedAnchor)}
          onClose={closeSpeedMenu}
          disableScrollLock
          slotProps={{ paper: { sx: { minWidth: 120 } } }}
        >
          {PLAYBACK_RATES.map((rate) => (
            <MenuItem
              key={rate}
              selected={Math.abs(rate - playbackRate) < 0.001}
              onClick={() => {
                setPlaybackRate(rate);
                closeSpeedMenu();
              }}
            >
              {speedLabelFor(rate)}
            </MenuItem>
          ))}
        </Menu>

        <Tooltip title={isFullscreen ? t("fullscreenExit") : t("fullscreenEnter")}>
          <IconButton
            size="small"
            onClick={() => toggleFullscreen(stageRef.current)}
            aria-label={isFullscreen ? t("fullscreenExit") : t("fullscreenEnter")}
            sx={{ color: "#f8fafc" }}
          >
            {isFullscreen ? (
              <FullscreenExitOutlined fontSize="small" />
            ) : (
              <FullscreenOutlined fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
