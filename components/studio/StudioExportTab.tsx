"use client";

import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import IosShareOutlined from "@mui/icons-material/IosShareOutlined";
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FULL_RANGE_EPSILON_SEC } from "@/lib/constants/studio";
import { downloadBlob, formatMegabytes } from "@/lib/format";
import { useVideoPlayer } from "@/lib/hooks/use-video-player";
import type { RenderOptions } from "@/lib/types/api";
import type { TimelineRange, TranscriptSegment } from "@/lib/types/studio";
import { VideoStage } from "@/components/studio/VideoStage";
import { SectionTitle } from "@/components/studio/SectionTitle";
import { VideoStageSkeleton } from "@/components/studio/StudioSkeletons";

type Props = {
  hasVideo: boolean;
  audioBlob: Blob | null | undefined;
  segments: TranscriptSegment[];
  range: TimelineRange;
  playerDuration: number;
  isPending: boolean;
  renderBlob: Blob | null | undefined;
  renderUrl: string | null;
  onRender: (options: RenderOptions, includeVoiceover: boolean) => void;
};

/**
 * The "Export" tab — owns the local "include voiceover / captions" toggles
 * and assembles the {@link RenderOptions} payload before calling `onRender`.
 */
export function StudioExportTab({
  hasVideo,
  audioBlob,
  segments,
  range,
  playerDuration,
  isPending,
  renderBlob,
  renderUrl,
  onRender,
}: Props) {
  const t = useTranslations("studio");
  const [withVoiceover, setWithVoiceover] = useState(true);
  const [withCaptions, setWithCaptions] = useState(false);
  // Dedicated player instance for the rendered MP4 so the preview stays
  // independent of the source-clip player (different src, different fullscreen
  // root, etc.). The state is local to the Export tab and resets when this
  // component remounts.
  const renderPlayer = useVideoPlayer();
  const renderFileName = t("files.exportVideo");
  const renderSizeMb = renderBlob ? formatMegabytes(renderBlob.size) : "0";

  const hasActiveTrim =
    range.out > range.in &&
    !(range.in === 0 && Math.abs(range.out - playerDuration) < FULL_RANGE_EPSILON_SEC);

  const handleRender = () => {
    const options: RenderOptions = {
      burnCaptions: withCaptions,
      ...(withCaptions && segments.length > 0 ? { segments } : {}),
    };
    if (hasActiveTrim) {
      options.trim = { startSec: range.in, endSec: range.out };
    }
    onRender(options, withVoiceover && !!audioBlob);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>{t("export.title")}</SectionTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("export.renderHint")}
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 650, mb: 1 }}>
          {t("export.includeTitle")}
        </Typography>
        <Stack spacing={0.5}>
          <FormControlLabel
            control={
              <Checkbox
                checked={withVoiceover && !!audioBlob}
                disabled={!audioBlob || isPending}
                onChange={(_event, checked: boolean) => setWithVoiceover(checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("export.optionVoiceover")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {audioBlob ? t("export.optionVoiceoverHint") : t("export.optionVoiceoverMissing")}
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={withCaptions}
                disabled={isPending || segments.length === 0}
                onChange={(_event, checked: boolean) => setWithCaptions(checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("export.optionCaptions")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {segments.length === 0
                    ? t("export.optionCaptionsMissing")
                    : t("export.optionCaptionsHint")}
                </Typography>
              </Box>
            }
          />
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button
          variant="contained"
          size="large"
          startIcon={<IosShareOutlined />}
          onClick={handleRender}
          disabled={!hasVideo || isPending}
        >
          {isPending ? t("export.rendering") : t("export.render")}
        </Button>
        {renderBlob ? (
          <Button
            variant="outlined"
            startIcon={<DownloadOutlined />}
            onClick={() => downloadBlob(renderBlob, t("files.exportVideo"))}
          >
            {t("export.downloadRender")}
          </Button>
        ) : null}
      </Stack>
      {isPending ? <VideoStageSkeleton /> : null}
      {!isPending && renderBlob && renderUrl ? (
        <Box sx={{ mt: 1 }}>
          <VideoStage
            src={renderUrl}
            player={renderPlayer}
            fileName={renderFileName}
            fileSizeMb={renderSizeMb}
          />
        </Box>
      ) : null}
    </Stack>
  );
}
