"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { TimelineEditor } from "@/components/studio/TimelineEditor";
import { SectionTitle } from "@/components/studio/SectionTitle";
import { VideoStage } from "@/components/studio/VideoStage";
import { VideoStageSkeleton } from "@/components/studio/StudioSkeletons";
import { downloadBlob, formatMegabytes } from "@/lib/format";
import { useVideoPlayer } from "@/lib/hooks/use-video-player";
import type { TimelineRange } from "@/lib/types/studio";

type VideoPlayer = ReturnType<typeof useVideoPlayer>;

type Props = {
  hasVideo: boolean;
  videoUrl: string | null;
  player: VideoPlayer;
  range: TimelineRange;
  onRangeChange: (next: TimelineRange) => void;
  cutBlob: Blob | null | undefined;
  cutUrl: string | null;
  isCutting: boolean;
  isClipping: boolean;
  onCut: () => void;
  onClipInPlace: () => void;
};

/**
 * The "Timeline" tab — wraps the trim editor and shows the cut preview,
 * if any.
 */
export function StudioTimelineTab({
  hasVideo,
  videoUrl,
  player,
  range,
  onRangeChange,
  cutBlob,
  cutUrl,
  isCutting,
  isClipping,
  onCut,
  onClipInPlace,
}: Props) {
  const t = useTranslations("studio");
  // Dedicated player for the cut preview so it doesn't share state with the
  // source-clip player above.
  const cutPlayer = useVideoPlayer();
  return (
    <Stack spacing={2}>
      <SectionTitle>{t("timeline.title")}</SectionTitle>
      <Typography variant="body2" color="text.secondary">
        {t("timeline.subtitle")}
      </Typography>
      {hasVideo ? (
        <TimelineEditor
          player={player}
          videoUrl={videoUrl}
          range={range}
          onRangeChange={onRangeChange}
          onApply={onCut}
          onReset={() => onRangeChange({ in: 0, out: player.duration })}
          onDownload={() => cutBlob && downloadBlob(cutBlob, t("files.cutVideo"))}
          isCutting={isCutting}
          hasCut={Boolean(cutBlob)}
          onClipInPlace={onClipInPlace}
          isClipping={isClipping}
        />
      ) : (
        <Typography color="text.secondary">{t("errors.noVideo")}</Typography>
      )}
      {isCutting ? <VideoStageSkeleton /> : null}
      {!isCutting && cutBlob && cutUrl ? (
        <Box sx={{ mt: 1 }}>
          <VideoStage
            src={cutUrl}
            player={cutPlayer}
            fileName={t("files.cutVideo")}
            fileSizeMb={formatMegabytes(cutBlob.size)}
          />
        </Box>
      ) : null}
    </Stack>
  );
}
