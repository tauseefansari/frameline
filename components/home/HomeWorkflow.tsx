"use client";

import { alpha, Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import OutboundOutlined from "@mui/icons-material/OutboundOutlined";
import RecordVoiceOverOutlined from "@mui/icons-material/RecordVoiceOverOutlined";
import SubtitlesOutlined from "@mui/icons-material/SubtitlesOutlined";
import { useTranslations } from "next-intl";
import { glassPaperBg, sectionAccentBand } from "@/components/home/theme-visuals";
import { HomeWorkflowReveal } from "@/components/home/HomeWorkflowReveal";

interface HomeWorkflowProps {
  reduced: boolean;
}

const stepIconSx = {
  color: (th: import("@mui/material").Theme) =>
    th.palette.mode === "light" ? th.palette.primary.main : th.palette.primary.light,
};

const workflowSteps = [
  {
    titleKey: "workflow.step1Title" as const,
    bodyKey: "workflow.step1Body" as const,
    icon: <CloudUploadOutlined sx={stepIconSx} />,
  },
  {
    titleKey: "workflow.step2Title" as const,
    bodyKey: "workflow.step2Body" as const,
    icon: <SubtitlesOutlined sx={stepIconSx} />,
  },
  {
    titleKey: "workflow.step3Title" as const,
    bodyKey: "workflow.step3Body" as const,
    icon: <RecordVoiceOverOutlined sx={stepIconSx} />,
  },
  {
    titleKey: "workflow.step4Title" as const,
    bodyKey: "workflow.step4Body" as const,
    icon: <OutboundOutlined sx={stepIconSx} />,
  },
];

export function HomeWorkflow({ reduced }: HomeWorkflowProps) {
  const theme = useTheme();
  const t = useTranslations("home");

  return (
    <Box
      id="workflow"
      sx={{
        scrollMarginTop: "96px",
        mt: { xs: 4, md: 6 },
        py: { xs: 8, md: 10 },
        px: { xs: 2, sm: 3, md: 4 },
        borderRadius: { md: 4 },
        background: sectionAccentBand(theme),
        border: `1px solid`,
        borderColor: "divider",
      }}
    >
      <Typography variant="overline" color="primary" sx={{ letterSpacing: "0.24em" }}>
        {t("workflow.eyebrow")}
      </Typography>
      <Typography variant="h2" sx={{ mt: 1, mb: 1, maxWidth: 720 }}>
        {t("workflow.title")}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 640, mb: 4, lineHeight: 1.78 }}
      >
        {t("workflow.subtitle")}
      </Typography>

      <HomeWorkflowReveal reducedMotion={reduced}>
        <Stack spacing={2.25}>
          {workflowSteps.map((step) => (
            <Paper
              key={step.titleKey}
              data-work-step
              elevation={0}
              sx={{
                p: { xs: 2.25, md: 3 },
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                borderRadius: 3,
                background: glassPaperBg(theme, 0.45, 0.88),
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                }}
              >
                {step.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 650, letterSpacing: "-0.02em" }}>
                  {t(step.titleKey)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.75, lineHeight: 1.72 }}
                >
                  {t(step.bodyKey)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>
      </HomeWorkflowReveal>
    </Box>
  );
}
