"use client";

import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import {
  Button,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionTitle } from "@/components/studio/SectionTitle";
import { ExternalTranscriptPromptPanel } from "@/components/studio/ExternalTranscriptPromptPanel";
import { RepoContextPanel } from "@/components/studio/RepoContextPanel";
import { TranscriptPanel } from "@/components/studio/TranscriptPanel";
import { TranscriptSkeleton } from "@/components/studio/StudioSkeletons";
import { CUSTOM_TONE_MAX_LENGTH } from "@/lib/constants/studio";
import { formatTimecode } from "@/lib/format";
import { ScriptTone, type TranscriptSegment } from "@/lib/types/studio";

const SCRIPT_TONES: ScriptTone[] = [
  ScriptTone.Cinematic,
  ScriptTone.Documentary,
  ScriptTone.Demo,
  ScriptTone.Energetic,
  ScriptTone.Calm,
  ScriptTone.Educational,
  ScriptTone.Promotional,
  ScriptTone.Custom,
];

type Props = {
  localVisionEnabled: boolean;
  isPending: boolean;
  text: string;
  segments: TranscriptSegment[];
  language: string | undefined;
  videoDuration: number | undefined;
  hasVideo: boolean;
  durationSec: number;
  tone: ScriptTone;
  onToneChange: (tone: ScriptTone) => void;
  customTone: string;
  onCustomToneChange: (value: string) => void;
  repoContext: string;
  onRepoContextChange: (value: string) => void;
  onTranscribe: () => void;
  onTextChange: (next: string) => void;
  onSegmentsChange: (next: TranscriptSegment[] | null) => void;
  onDownload: () => void;
  onUseInVoice: () => void;
  onSyncTimestamps: () => void;
};

/**
 * The "Transcript" tab — hosts the script generation controls (tone,
 * additional context, Generate button) at the top, then either a loading
 * skeleton or the editable {@link TranscriptPanel} once a script exists.
 */
export function StudioTranscriptTab({
  localVisionEnabled,
  isPending,
  text,
  segments,
  language,
  videoDuration,
  hasVideo,
  durationSec,
  tone,
  onToneChange,
  customTone,
  onCustomToneChange,
  repoContext,
  onRepoContextChange,
  onTranscribe,
  onTextChange,
  onSegmentsChange,
  onDownload,
  onUseInVoice,
  onSyncTimestamps,
}: Props) {
  const t = useTranslations("studio");

  return (
    <Stack spacing={2}>
      <SectionTitle>{t("transcript.title")}</SectionTitle>
      <Typography variant="body2" color="text.secondary">
        {localVisionEnabled ? t("transcript.empty") : t("transcript.emptyExternal")}
      </Typography>

      <Stack spacing={1}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}
        >
          {t("source.toneLabel")}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={tone}
          onChange={(_, value: ScriptTone | null) => {
            if (value) onToneChange(value);
          }}
          disabled={isPending}
          sx={{ flexWrap: "wrap", gap: 0.75 }}
        >
          {SCRIPT_TONES.map((id) => (
            <ToggleButton
              key={id}
              value={id}
              sx={{
                textTransform: "none",
                borderRadius: 1.5,
                px: 1.75,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {t(`source.tones.${id}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {tone === ScriptTone.Custom ? (
          <TextField
            size="small"
            fullWidth
            placeholder={t("source.customTonePlaceholder")}
            value={customTone}
            onChange={(e) => onCustomToneChange(e.target.value)}
            disabled={isPending}
            slotProps={{ htmlInput: { maxLength: CUSTOM_TONE_MAX_LENGTH } }}
            sx={{ mt: 1 }}
          />
        ) : null}
      </Stack>

      <RepoContextPanel value={repoContext} onChange={onRepoContextChange} disabled={isPending} />

      {localVisionEnabled ? (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <span>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeOutlined />}
                disabled={!hasVideo || isPending}
                onClick={onTranscribe}
              >
                {isPending
                  ? t("source.transcribing", { duration: formatTimecode(durationSec) })
                  : segments.length > 0 || !!text.trim()
                    ? t("source.regenerate")
                    : t("source.transcribe")}
              </Button>
            </span>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t("source.transcribeHint")}
          </Typography>
        </>
      ) : (
        <Typography variant="caption" color="text.secondary">
          {t("source.externalWorkflowHint")}
        </Typography>
      )}

      <ExternalTranscriptPromptPanel
        durationSec={videoDuration ?? durationSec}
        tone={tone}
        customTone={customTone}
        repoContext={repoContext}
      />

      <Divider flexItem />
      {isPending ? (
        <TranscriptSkeleton />
      ) : (
        <TranscriptPanel
          text={text}
          segments={segments}
          language={language}
          videoDuration={videoDuration}
          onTextChange={onTextChange}
          onSegmentsChange={onSegmentsChange}
          onDownload={onDownload}
          onUseInVoice={onUseInVoice}
          onSyncTimestamps={onSyncTimestamps}
          syncDisabled={!hasVideo || (videoDuration ?? 0) <= 0}
          syncDisabledHint={t("transcript.syncNeedsVideo")}
        />
      )}
    </Stack>
  );
}
