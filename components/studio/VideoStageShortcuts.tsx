"use client";

import { alpha, Box, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";

export function VideoStageShortcuts() {
  const t = useTranslations("studio.stage");
  const theme = useTheme();

  const shortcuts = [
    { keys: ["Space"], label: t("shortcutPlay") },
    { keys: ["J", "L"], label: t("shortcutStep") },
    { keys: ["I", "O"], label: t("shortcutInOut") },
    { keys: ["M"], label: t("shortcutMute") },
    { keys: ["F"], label: t("shortcutFullscreen") },
  ];

  return (
    <Box
      component="section"
      aria-label={t("shortcutsLabel")}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 1,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.04 : 0.025),
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: "text.secondary",
          mr: 0.5,
        }}
      >
        {t("shortcutsLabel")}
      </Typography>
      {shortcuts.map((s) => (
        <Box
          key={s.label}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "inline-flex", gap: 0.25 }}>
            {s.keys.map((k) => (
              <Box
                key={`${s.label}-${k}`}
                component="kbd"
                sx={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  lineHeight: 1,
                  minWidth: 22,
                  px: 0.75,
                  py: 0.4,
                  textAlign: "center",
                  color: "text.primary",
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.18 : 0.1,
                  ),
                  border: 1,
                  borderColor: alpha(theme.palette.primary.main, 0.35),
                  borderRadius: 0.75,
                  boxShadow: `inset 0 -1px 0 ${alpha(theme.palette.primary.main, 0.25)}`,
                }}
              >
                {k}
              </Box>
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
            {s.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
