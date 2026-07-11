"use client";

import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TipsAndUpdatesOutlined from "@mui/icons-material/TipsAndUpdatesOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { studioCollapsiblePanelSx } from "@/components/studio/studio-collapsible-panel";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { TABULAR_NUMBER_SX } from "@/lib/constants/ui";
import { WORDS_PER_MINUTE } from "@/lib/constants/transcript";
import { useToast } from "@/lib/hooks/use-toast";
import {
  buildExternalTranscriptPrompt,
  externalTranscriptPromptStats,
} from "@/lib/studio/transcript-prompt";
import type { ScriptTone } from "@/lib/types/studio";

const EXTERNAL_PROMPT_STEP_KEYS = [
  "upload",
  "pastePrompt",
  "watchVisuals",
  "copyNarration",
  "pasteScript",
  "sync",
] as const;

type Props = {
  durationSec: number;
  tone: ScriptTone;
  customTone: string;
  repoContext: string;
};

export function ExternalTranscriptPromptPanel({
  durationSec,
  tone,
  customTone,
  repoContext,
}: Props) {
  const t = useTranslations("studio.transcript.externalPrompt");
  const tPanel = useTranslations("studio.transcript.collapsible");
  const locale = useLocale();
  const toast = useToast();

  const languageLabel = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
    } catch {
      return locale;
    }
  }, [locale]);

  const stats = externalTranscriptPromptStats(durationSec);
  const prompt = useMemo(
    () =>
      buildExternalTranscriptPrompt({
        durationSec,
        tone,
        customTone,
        repoContext,
        language: languageLabel,
      }),
    [customTone, durationSec, languageLabel, repoContext, tone],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success(t("copiedMessage"), t("copiedTitle"));
    } catch {
      toast.error(t("copyFailedMessage"), t("copyFailedTitle"));
    }
  }, [prompt, t, toast]);

  return (
    <Accordion disableGutters elevation={0} sx={studioCollapsiblePanelSx}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <TipsAndUpdatesOutlined sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 650 }}>{t("title")}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {tPanel("expandHint")}
            </Typography>
            {stats ? (
              <Typography variant="caption" color="text.secondary" sx={TABULAR_NUMBER_SX}>
                {t("stats", {
                  words: stats.wordTarget,
                  maxWords: stats.maxWords,
                  duration: stats.durationLabel,
                  wpm: WORDS_PER_MINUTE,
                })}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {t("needsDuration")}
              </Typography>
            )}
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            {t("hint")}
          </Typography>
          <Box
            component="ol"
            sx={{
              m: 0,
              pl: 2.75,
              color: "text.secondary",
              listStyleType: "decimal",
              listStylePosition: "outside",
              "& > li": {
                display: "list-item",
                pl: 0.5,
                mb: 0.25,
              },
            }}
          >
            {EXTERNAL_PROMPT_STEP_KEYS.map((key) => (
              <Typography key={key} component="li" variant="caption" sx={{ lineHeight: 1.6 }}>
                {t(`steps.${key}`)}
              </Typography>
            ))}
          </Box>
          {!stats ? (
            <Alert severity="info" sx={{ py: 0.5 }}>
              {t("needsDuration")}
            </Alert>
          ) : null}
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
              fontSize: "0.75rem",
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 280,
              overflow: "auto",
            }}
          >
            {prompt}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyOutlined />}
              onClick={handleCopy}
            >
              {t("copy")}
            </Button>
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
