"use client";

import ContentCutOutlined from "@mui/icons-material/ContentCutOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { alpha, Box, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  MERGE_THUMB_HEIGHT_PX,
  MERGE_THUMB_WIDTH_PX,
  THUMB_INNER_WIDTH_PX,
} from "@/lib/constants/studio";
import { formatMegabytes, formatTimecode } from "@/lib/format";
import { useGlobalProgress } from "@/lib/hooks/use-global-progress";
import { getEffectiveDuration } from "@/lib/studio/clip-utils";
import type { ClipRange, StudioClip } from "@/lib/types/studio";
import { generateVideoThumbnail } from "@/lib/video/thumbnail.client";
import { MergeTrimDialog } from "@/components/studio/MergeTrimDialog";

export type ClipMeta = {
  durationSec: number;
  range: ClipRange | null;
};

interface MergeClipRowProps {
  clip: StudioClip;
  meta: ClipMeta | undefined;
  index: number;
  excluded: boolean;
  startSec: number;
  onToggle: () => void;
  onChangeRange: (range: ClipRange | null) => void;
}

export function MergeClipRow({
  clip,
  meta,
  index,
  excluded,
  startSec,
  onToggle,
  onChangeRange,
}: MergeClipRowProps) {
  const t = useTranslations("studio.merge");
  const theme = useTheme();
  const [thumb, setThumb] = useState<string | null>(null);
  const [trimOpen, setTrimOpen] = useState(false);

  const durationSec = meta?.durationSec ?? 0;
  const range = meta?.range ?? null;
  const effectiveDuration = getEffectiveDuration(range, durationSec);

  const { wrap: wrapProgress } = useGlobalProgress();
  useEffect(() => {
    let cancelled = false;
    void wrapProgress(generateVideoThumbnail(clip.file, { width: THUMB_INNER_WIDTH_PX })).then(
      (data) => {
        if (!cancelled) setThumb(data);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [clip.file, wrapProgress]);

  return (
    <Stack
      direction="row"
      spacing={{ xs: 1, sm: 1.5 }}
      useFlexGap
      sx={{
        alignItems: "center",
        flexWrap: { xs: "wrap", sm: "nowrap" },
        p: 1,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        bgcolor: alpha(theme.palette.primary.main, excluded ? 0.02 : 0.04),
        opacity: excluded ? 0.55 : 1,
        transition: "opacity 160ms ease, background-color 160ms ease",
      }}
    >
      <Box
        sx={{
          width: MERGE_THUMB_WIDTH_PX,
          height: MERGE_THUMB_HEIGHT_PX,
          borderRadius: 1.5,
          overflow: "hidden",
          bgcolor: alpha(theme.palette.text.primary, 0.06),
          backgroundImage: thumb ? `url(${thumb})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          flexShrink: 0,
        }}
      />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {t("rowLabel", { index: index + 1, name: clip.file.name })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {excluded
            ? t("excludedHint")
            : t("rowMeta", {
                start: formatTimecode(startSec),
                duration: formatTimecode(effectiveDuration),
                size: formatMegabytes(clip.file.size),
              })}
          {range && !excluded ? ` · ${t("trimmedHint")}` : ""}
        </Typography>
      </Stack>
      <Tooltip title={t("trim")}>
        <span>
          <IconButton
            aria-label={t("trim")}
            size="small"
            onClick={() => setTrimOpen(true)}
            disabled={durationSec <= 0 || excluded}
          >
            <ContentCutOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={excluded ? t("include") : t("exclude")}>
        <IconButton
          size="small"
          onClick={onToggle}
          aria-label={excluded ? t("include") : t("exclude")}
        >
          {excluded ? (
            <VisibilityOffOutlined fontSize="small" />
          ) : (
            <VisibilityOutlined fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      {trimOpen && (
        <MergeTrimDialog
          clip={clip}
          durationSec={durationSec}
          range={range}
          onClose={() => setTrimOpen(false)}
          onSave={(next) => {
            onChangeRange(next);
            setTrimOpen(false);
          }}
        />
      )}
    </Stack>
  );
}
