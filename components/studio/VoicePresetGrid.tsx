"use client";

import { Stack, ToggleButtonGroup, Typography, alpha, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { glassPaperBg } from "@/components/home/theme-visuals";
import { PIPER_VOICE_IDS, type PiperVoiceId } from "@/lib/constants/piper-voices";
import { useVoicePreview } from "@/lib/hooks/use-voice-preview";
import { VoicePresetCard } from "@/components/studio/VoicePresetCard";

type VoicePresetGridProps = {
  /** Currently selected voice. */
  value: PiperVoiceId;
  /** Selection handler. */
  onChange: (voice: PiperVoiceId) => void;
  /** Disable all cards while synthesis is running. */
  disabled?: boolean;
};

/**
 * Voice picker grid — wraps every available Piper voice in a
 * {@link VoicePresetCard} and owns the shared preview audio state via
 * {@link useVoicePreview}. Drop-in replacement for the inline grid that used
 * to live inside `StudioWorkspace`.
 */
export function VoicePresetGrid({ value, onChange, disabled = false }: VoicePresetGridProps) {
  const t = useTranslations("studio");
  const theme = useTheme();
  const preview = useVoicePreview();

  return (
    <Stack spacing={1}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}
      >
        {t("voice.voiceLabel")}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        disabled={disabled}
        onChange={(_, next: PiperVoiceId | null) => {
          if (next) onChange(next);
        }}
        sx={{
          flexWrap: "wrap",
          gap: 1.25,
          "& .MuiToggleButtonGroup-grouped": {
            // Reset MUI's default group styles so each card looks
            // standalone with its own rounded border.
            border: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.7),
            borderRadius: 2.5,
            backgroundColor: glassPaperBg(theme, 0.4, 0.9),
            transition:
              "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
            "&:hover": {
              borderColor: alpha(theme.palette.primary.main, 0.4),
              transform: "translateY(-1px)",
              boxShadow: `0 6px 18px -10px ${alpha(theme.palette.primary.main, 0.5)}`,
            },
            "&.Mui-disabled": {
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.7),
            },
            "&:not(:first-of-type)": {
              marginLeft: 0,
              borderLeft: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.7),
            },
          },
        }}
      >
        {PIPER_VOICE_IDS.map((id) => (
          <VoicePresetCard
            key={id}
            voiceId={id}
            isSelected={value === id}
            isPlaying={preview.activeVoice === id && preview.state === "playing"}
            isLoading={preview.activeVoice === id && preview.state === "loading"}
            onTogglePreview={() => preview.toggle(id)}
          />
        ))}
      </ToggleButtonGroup>
      <Typography variant="caption" color="text.secondary">
        {t("voice.previewSentence")}
      </Typography>
    </Stack>
  );
}
