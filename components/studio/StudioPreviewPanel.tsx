"use client";

import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import LayersOutlined from "@mui/icons-material/LayersOutlined";
import { Button, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { glassPaperBg } from "@/components/home/theme-visuals";
import { useRef } from "react";
import { ClipLibrary } from "@/components/studio/ClipLibrary";
import { DropZone } from "@/components/studio/DropZone";
import { VideoStage } from "@/components/studio/VideoStage";
import type { useVideoPlayer } from "@/lib/hooks/use-video-player";
import type { StudioClip } from "@/lib/types/studio";

type VideoPlayer = ReturnType<typeof useVideoPlayer>;

type Props = {
  clips: StudioClip[];
  activeClipId: string | null;
  videoFile: File | null;
  videoUrl: string | null;
  fileSizeMb: string;
  player: VideoPlayer;
  onPickVideo: (file: File | null) => void;
  onAddClips: (files: File[]) => void;
  onSelectClip: (id: string) => void;
  onRemoveClip: (id: string) => void;
  onReorderClips: (next: StudioClip[]) => void;
};

/**
 * The "preview" Paper card at the top of the studio: drop zone / video stage,
 * source chip, the "Remove all" action, and the inline {@link ClipLibrary}.
 */
export function StudioPreviewPanel({
  clips,
  activeClipId,
  videoFile,
  videoUrl,
  fileSizeMb,
  player,
  onPickVideo,
  onAddClips,
  onSelectClip,
  onRemoveClip,
  onReorderClips,
}: Props) {
  const t = useTranslations("studio");
  const theme = useTheme();
  const libraryInputRef = useRef<HTMLInputElement>(null);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        background: glassPaperBg(theme, 0.55, 0.92),
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1, sm: 0 },
          mb: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Typography variant="overline" color="primary">
            {t("preview.overline")}
          </Typography>
          {videoFile ? (
            <Chip
              size="small"
              icon={<LayersOutlined />}
              label={t("stage.metaSize", { size: fileSizeMb })}
              sx={{ ml: { xs: 0, sm: 1 } }}
            />
          ) : null}
        </Stack>
        {videoFile ? (
          <Button
            size="small"
            variant="text"
            color="inherit"
            startIcon={<DeleteOutlineOutlined />}
            onClick={() => onPickVideo(null)}
            sx={{ alignSelf: { xs: "flex-end", sm: "auto" } }}
          >
            {t("source.removeAll")}
          </Button>
        ) : null}
      </Stack>

      <DropZone
        onFile={onPickVideo}
        onFiles={onAddClips}
        multiple
        hasFile={Boolean(videoFile && videoUrl)}
      >
        {videoFile && videoUrl ? (
          <VideoStage
            src={videoUrl}
            player={player}
            fileName={videoFile.name}
            fileSizeMb={fileSizeMb}
          />
        ) : null}
      </DropZone>

      <ClipLibrary
        clips={clips}
        activeId={activeClipId}
        onSelect={onSelectClip}
        onRemove={onRemoveClip}
        onReorder={onReorderClips}
        onAddMore={() => libraryInputRef.current?.click()}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="video/*"
        multiple
        hidden
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("video/"));
          if (list.length > 0) onAddClips(list);
          e.currentTarget.value = "";
        }}
      />
    </Paper>
  );
}
