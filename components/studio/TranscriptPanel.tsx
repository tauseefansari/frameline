"use client";

import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import GraphicEqOutlined from "@mui/icons-material/GraphicEqOutlined";
import SyncOutlined from "@mui/icons-material/SyncOutlined";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { countWords } from "@/lib/format";
import type { TranscriptSegment } from "@/lib/types/studio";
import { SEGMENT_EDIT_MIN_GAP_SEC, TRANSCRIPT_PANEL_MAX_HEIGHT_PX } from "@/lib/constants/studio";
import { TABULAR_NUMBER_SX } from "@/lib/constants/ui";
import { TimecodeSpinner } from "@/components/studio/TimecodeSpinner";

export function TranscriptPanel({
  text,
  segments,
  language,
  videoDuration,
  onTextChange,
  onSegmentsChange,
  onDownload,
  onUseInVoice,
  onSyncTimestamps,
  syncDisabled,
  syncDisabledHint,
}: {
  text: string;
  segments: TranscriptSegment[];
  language?: string;
  /** Total video duration in seconds — used to clamp segment edits. */
  videoDuration?: number;
  onTextChange: (next: string) => void;
  onSegmentsChange: (next: TranscriptSegment[]) => void;
  onDownload: () => void;
  onUseInVoice: () => void;
  onSyncTimestamps?: () => void;
  syncDisabled?: boolean;
  syncDisabledHint?: string;
}) {
  const t = useTranslations("studio.transcript");
  const theme = useTheme();
  const wordCount = countWords(text);
  const maxSec = videoDuration ?? Infinity;

  const updateSegment = useCallback(
    (id: number, patch: Partial<Pick<TranscriptSegment, "start" | "end">>) => {
      const idx = segments.findIndex((s) => s.id === id);
      if (idx === -1) return;

      const updated = [...segments];
      const seg = updated[idx];
      const next = { ...seg, ...patch };

      next.start = Math.min(Math.max(0, next.start), maxSec);
      next.end = Math.min(Math.max(next.start + SEGMENT_EDIT_MIN_GAP_SEC, next.end), maxSec);
      updated[idx] = next;

      if ("end" in patch && idx + 1 < updated.length) {
        updated[idx + 1] = {
          ...updated[idx + 1],
          start: Math.min(next.end, updated[idx + 1].end - SEGMENT_EDIT_MIN_GAP_SEC),
        };
      }
      if ("start" in patch && idx > 0) {
        updated[idx - 1] = {
          ...updated[idx - 1],
          end: Math.max(next.start, updated[idx - 1].start + SEGMENT_EDIT_MIN_GAP_SEC),
        };
      }

      onSegmentsChange(updated);
    },
    [segments, onSegmentsChange, maxSec],
  );

  const deleteSegment = useCallback(
    (id: number) => {
      const idx = segments.findIndex((s) => s.id === id);
      if (idx === -1) return;
      if (segments.length === 1) {
        onSegmentsChange([]);
        return;
      }
      const deleted = segments[idx];
      const updated = segments.filter((s) => s.id !== id);
      if (idx < segments.length - 1) {
        // Next segment absorbs — extend its start back to fill the gap
        updated[idx] = { ...updated[idx], start: deleted.start };
      } else {
        // Was the last segment — previous segment absorbs by extending end
        updated[idx - 1] = { ...updated[idx - 1], end: deleted.end };
      }
      onSegmentsChange(updated);
    },
    [segments, onSegmentsChange],
  );

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Chip size="small" label={t("wordCount", { count: wordCount })} />
        {language ? (
          <Chip
            size="small"
            label={`${t("languageLabel")} · ${language.toUpperCase()}`}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
            }}
          />
        ) : null}
        <Box sx={{ flex: 1 }} />
        {onSyncTimestamps ? (
          <Tooltip title={syncDisabled && syncDisabledHint ? syncDisabledHint : t("syncHint")}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SyncOutlined />}
                onClick={onSyncTimestamps}
                disabled={syncDisabled || !text.trim()}
              >
                {t("sync")}
              </Button>
            </span>
          </Tooltip>
        ) : null}
        <Button
          size="small"
          variant="text"
          startIcon={<GraphicEqOutlined />}
          onClick={onUseInVoice}
          disabled={!text.trim()}
        >
          {t("useInVoice")}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={onDownload}
          disabled={!text.trim()}
        >
          {t("downloadTxt")}
        </Button>
      </Stack>

      <TextField
        label={t("label")}
        placeholder={t("placeholder")}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        multiline
        minRows={6}
        maxRows={14}
        fullWidth
      />

      <Box>
        <Typography variant="overline" color="text.secondary">
          {t("segmentsTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t("segmentsHint")}
        </Typography>
        {segments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("noSegments")}
          </Typography>
        ) : (
          <Stack
            spacing={0.75}
            sx={{ maxHeight: TRANSCRIPT_PANEL_MAX_HEIGHT_PX, overflowY: "auto", pr: 0.5 }}
          >
            {segments.map((seg, segIdx) => (
              <Box
                key={seg.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 1.25,
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.035),
                  alignItems: "center",
                  transition: "border-color 0.15s, background-color 0.15s",
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.28),
                    bgcolor: alpha(theme.palette.primary.main, 0.07),
                  },
                }}
              >
                {/* Left: number badge + IN/OUT spinners */}
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      ...TABULAR_NUMBER_SX,
                      minWidth: 16,
                      textAlign: "center",
                      color: alpha(theme.palette.primary.main, 0.45),
                      userSelect: "none",
                    }}
                  >
                    {segIdx + 1}
                  </Typography>

                  <TimecodeSpinner
                    value={seg.start}
                    label={t("segmentStartLabel")}
                    shortLabel={t("segmentInLabel")}
                    onChange={(v) => updateSegment(seg.id, { start: v })}
                    max={seg.end - SEGMENT_EDIT_MIN_GAP_SEC}
                  />

                  <Typography
                    component="span"
                    sx={{ fontSize: "0.65rem", opacity: 0.35, userSelect: "none", mx: 0.25 }}
                  >
                    →
                  </Typography>

                  <TimecodeSpinner
                    value={seg.end}
                    label={t("segmentEndLabel")}
                    shortLabel={t("segmentOutLabel")}
                    onChange={(v) => updateSegment(seg.id, { end: v })}
                    min={seg.start + SEGMENT_EDIT_MIN_GAP_SEC}
                    max={maxSec}
                  />

                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.6rem",
                      opacity: 0.38,
                      ...TABULAR_NUMBER_SX,
                      userSelect: "none",
                      ml: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("segmentDuration", { dur: (seg.end - seg.start).toFixed(1) })}
                  </Typography>
                </Stack>

                {/* Middle: segment text */}
                <Typography variant="body2" sx={{ lineHeight: 1.6, px: 0.5 }}>
                  {seg.text}
                </Typography>

                {/* Right: delete */}
                <Tooltip title={t("deleteSegment")}>
                  <IconButton
                    size="small"
                    onClick={() => deleteSegment(seg.id)}
                    sx={{
                      p: 0.5,
                      color: alpha(theme.palette.error.main, 0.5),
                      "&:hover": {
                        color: theme.palette.error.main,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                      },
                    }}
                  >
                    <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
