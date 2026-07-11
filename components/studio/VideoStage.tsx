"use client";

import { alpha, Box, Chip, Stack, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { formatTimecode } from "@/lib/format";
import type { VideoPlayerState } from "@/lib/types/video";
import { VideoStageControls } from "@/components/studio/VideoStageControls";
import { VideoStageShortcuts } from "@/components/studio/VideoStageShortcuts";

export function VideoStage({
  src,
  player,
  fileName,
  fileSizeMb,
}: {
  src: string;
  player: VideoPlayerState;
  fileName: string;
  fileSizeMb: string;
}) {
  const t = useTranslations("studio.stage");
  const theme = useTheme();
  const { attach, duration, isFullscreen, toggle, toggleFullscreen } = player;

  const stageRef = useRef<HTMLDivElement | null>(null);

  return (
    <Stack spacing={2.25}>
      <Box
        ref={stageRef}
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          bgcolor: "common.black",
          aspectRatio: isFullscreen ? "auto" : "16 / 9",
          width: "100%",
          height: isFullscreen ? "100%" : undefined,
        }}
      >
        <Box
          component="video"
          ref={attach}
          src={src}
          playsInline
          onClick={toggle}
          onDoubleClick={() => toggleFullscreen(stageRef.current)}
          sx={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain",
            cursor: "pointer",
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            alignItems: "center",
            flexWrap: "wrap",
            pointerEvents: "none",
          }}
        >
          <Chip
            size="small"
            label={fileName}
            sx={{
              bgcolor: alpha(theme.palette.common.black, 0.55),
              color: "#f8fafc",
              border: `1px solid ${alpha("#fff", 0.16)}`,
              maxWidth: { xs: 160, sm: 200, md: 240 },
            }}
          />
          <Chip
            size="small"
            label={t("metaSize", { size: fileSizeMb })}
            sx={{
              bgcolor: alpha(theme.palette.common.black, 0.55),
              color: "#f8fafc",
              border: `1px solid ${alpha("#fff", 0.16)}`,
            }}
          />
          {duration > 0 ? (
            <Chip
              size="small"
              label={t("metaDuration", { duration: formatTimecode(duration) })}
              sx={{
                bgcolor: alpha(theme.palette.common.black, 0.55),
                color: "#f8fafc",
                border: `1px solid ${alpha("#fff", 0.16)}`,
              }}
            />
          ) : null}
        </Stack>

        <VideoStageControls player={player} stageRef={stageRef} />
      </Box>

      <VideoStageShortcuts />
    </Stack>
  );
}
