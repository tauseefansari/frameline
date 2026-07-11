"use client";

import GitHubIcon from "@mui/icons-material/GitHub";
import NotesOutlined from "@mui/icons-material/NotesOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslations } from "next-intl";
import { studioCollapsiblePanelSx } from "@/components/studio/studio-collapsible-panel";
import { REPO_CONTEXT_MAX_LENGTH, REPO_CONTEXT_WARN_RATIO } from "@/lib/constants/studio";
import { TABULAR_NUMBER_SX } from "@/lib/constants/ui";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RepoContextPanel({ value, onChange, disabled }: Props) {
  const t = useTranslations("studio.source");
  const tPanel = useTranslations("studio.transcript.collapsible");

  const hasContent = value.trim().length > 0;

  return (
    <Accordion disableGutters elevation={0} sx={studioCollapsiblePanelSx}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <GitHubIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 650 }}>{t("repoContextLabel")}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {tPanel("expandHint")}
            </Typography>
            {hasContent ? (
              <Typography variant="caption" color="text.secondary" sx={TABULAR_NUMBER_SX}>
                {t("repoContextFilled", { count: value.length.toLocaleString() })}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <NotesOutlined sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {t("repoContextHint")}
            </Typography>
          </Stack>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            placeholder={t("repoContextPlaceholder")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            slotProps={{ htmlInput: { maxLength: REPO_CONTEXT_MAX_LENGTH } }}
          />
          <Stack
            direction="row"
            sx={{ justifyContent: "flex-end", alignItems: "flex-start", gap: 1 }}
          >
            <Typography
              variant="caption"
              sx={{
                whiteSpace: "nowrap",
                ...TABULAR_NUMBER_SX,
                color:
                  value.length >= REPO_CONTEXT_MAX_LENGTH * REPO_CONTEXT_WARN_RATIO
                    ? "error.main"
                    : "text.disabled",
              }}
            >
              {value.length.toLocaleString()} / {REPO_CONTEXT_MAX_LENGTH.toLocaleString()}
            </Typography>
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
