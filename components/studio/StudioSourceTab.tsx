"use client";

import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import { Chip, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionTitle } from "@/components/studio/SectionTitle";
import { formatTimecode } from "@/lib/format";

type Props = {
  localVisionEnabled: boolean;
  hasVideo: boolean;
  durationSec: number;
  estMinutes: number | null;
};

/**
 * The "Source" tab — clip upload state at a glance. The actual upload UI
 * lives in the preview panel; script generation now lives on the Transcript
 * tab so this tab stays a single-purpose status surface.
 */
export function StudioSourceTab({ localVisionEnabled, hasVideo, durationSec, estMinutes }: Props) {
  const t = useTranslations("studio");
  return (
    <Stack spacing={2}>
      <SectionTitle>{t("source.title")}</SectionTitle>
      <Typography variant="body2" color="text.secondary">
        {t("source.uploadHint")}
      </Typography>
      {hasVideo ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Chip
            size="small"
            icon={<CloudUploadOutlined />}
            label={t("source.ready", { duration: formatTimecode(durationSec) })}
          />
          {estMinutes !== null ? (
            <Chip
              size="small"
              label={`${t("source.estimateLabel")} · ${t("source.estimateValue", { minutes: estMinutes })}`}
            />
          ) : null}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {localVisionEnabled ? t("source.nextStepHint") : t("source.nextStepHintExternal")}
        </Typography>
      )}
    </Stack>
  );
}
