"use client";

import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import GraphicEqOutlined from "@mui/icons-material/GraphicEqOutlined";
import { Button, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { AudioPlayer } from "@/components/studio/AudioPlayer";
import { SectionTitle } from "@/components/studio/SectionTitle";
import { VoiceSynthSkeleton } from "@/components/studio/StudioSkeletons";
import { VoicePresetGrid } from "@/components/studio/VoicePresetGrid";
import type { PiperVoiceId } from "@/lib/constants/piper-voices";
import { downloadBlob } from "@/lib/format";

type Props = {
  voice: PiperVoiceId;
  onVoiceChange: (voice: PiperVoiceId) => void;
  hasTranscript: boolean;
  hasSegments: boolean;
  isPending: boolean;
  audioBlob: Blob | null | undefined;
  audioUrl: string | null;
  onSynth: () => void;
};

/**
 * The "Voice" tab — voice picker + the synthesis call-to-action and the
 * resulting audio preview / download row.
 */
export function StudioVoiceTab({
  voice,
  onVoiceChange,
  hasTranscript,
  hasSegments,
  isPending,
  audioBlob,
  audioUrl,
  onSynth,
}: Props) {
  const t = useTranslations("studio");
  return (
    <Stack spacing={2}>
      <SectionTitle>{t("voice.title")}</SectionTitle>
      <VoicePresetGrid value={voice} onChange={onVoiceChange} disabled={isPending} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <span>
          <Button
            variant="contained"
            startIcon={<GraphicEqOutlined />}
            onClick={onSynth}
            disabled={!hasTranscript || isPending}
          >
            {isPending ? t("voice.generating") : t("voice.generate")}
          </Button>
        </span>
      </Stack>
      {hasSegments && !isPending && !audioBlob ? (
        <Typography variant="caption" color="text.secondary">
          {t("voice.syncedAutoHint")}
        </Typography>
      ) : null}
      {isPending ? (
        <VoiceSynthSkeleton />
      ) : audioBlob ? (
        <Stack spacing={1.25}>
          <Typography variant="body2" color="text.secondary">
            {t("voice.previewNotice")}
          </Typography>
          <AudioPlayer src={audioUrl ?? null} />
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlined />}
              onClick={() => downloadBlob(audioBlob, t("files.voiceAudio"))}
            >
              {t("voice.downloadAudio")}
            </Button>
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}
