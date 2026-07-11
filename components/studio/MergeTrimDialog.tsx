"use client";

import RestartAltOutlined from "@mui/icons-material/RestartAltOutlined";
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FilmstripRangeRail } from "@/components/studio/FilmstripRangeRail";
import {
  MIN_TRIM_DURATION_SEC,
  MIN_TRIM_TOTAL_SEC,
  TRIM_SLIDER_STEP_SEC,
} from "@/lib/constants/studio";
import { TABULAR_NUMBER_SX } from "@/lib/constants/ui";
import { formatTimecode } from "@/lib/format";
import { useObjectUrl } from "@/lib/hooks/use-object-url";
import { isFullClipRange } from "@/lib/studio/clip-utils";
import type { ClipRange, StudioClip } from "@/lib/types/studio";

interface MergeTrimDialogProps {
  clip: StudioClip;
  durationSec: number;
  range: ClipRange | null;
  onClose: () => void;
  onSave: (range: ClipRange | null) => void;
}

export function MergeTrimDialog({
  clip,
  durationSec,
  range,
  onClose,
  onSave,
}: MergeTrimDialogProps) {
  const t = useTranslations("studio.merge");
  const theme = useTheme();
  const total = Math.max(MIN_TRIM_TOTAL_SEC, durationSec);
  const videoUrl = useObjectUrl(clip.file);
  const [value, setValue] = useState<[number, number]>(() => [
    range?.startSec ?? 0,
    range?.endSec ?? total,
  ]);

  const handleSave = () => {
    const [s, e] = value;
    if (isFullClipRange(s, e, total) || e - s < MIN_TRIM_DURATION_SEC) {
      onSave(null);
      return;
    }
    onSave({ startSec: s, endSec: e });
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="trim-dialog-title">
      <DialogTitle id="trim-dialog-title">
        {t("trimDialog.title", { name: clip.file.name })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t("trimDialog.subtitle", { duration: formatTimecode(total) })}
          </Typography>
          <FilmstripRangeRail
            videoUrl={videoUrl}
            durationSec={total}
            value={value}
            onChange={setValue}
            step={TRIM_SLIDER_STEP_SEC}
            ariaLabel={t("trimDialog.title", { name: clip.file.name })}
          />
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <Chip
              size="small"
              label={t("trimDialog.in", { value: formatTimecode(value[0]) })}
              sx={{
                ...TABULAR_NUMBER_SX,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
              }}
            />
            <Chip
              size="small"
              label={t("trimDialog.out", { value: formatTimecode(value[1]) })}
              sx={{
                ...TABULAR_NUMBER_SX,
                bgcolor: alpha(theme.palette.secondary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.28)}`,
              }}
            />
            <Chip
              size="small"
              label={t("trimDialog.length", {
                value: formatTimecode(Math.max(0, value[1] - value[0])),
              })}
              sx={TABULAR_NUMBER_SX}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<RestartAltOutlined />} onClick={() => setValue([0, total])}>
          {t("trimDialog.reset")}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{t("trimDialog.cancel")}</Button>
        <Button variant="contained" onClick={handleSave}>
          {t("trimDialog.apply")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
