"use client";

import { Box, Paper, Typography, useTheme } from "@mui/material";
import LayersOutlined from "@mui/icons-material/LayersOutlined";
import MovieFilterOutlined from "@mui/icons-material/MovieFilterOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import { useTranslations } from "next-intl";
import { glassPaperBg } from "@/components/home/theme-visuals";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";

interface HomeSpecsProps {
  reduced: boolean;
}

const specCards = [
  {
    titleKey: "specs.c1t" as const,
    bodyKey: "specs.c1b" as const,
    icon: <LayersOutlined sx={{ fontSize: 28, opacity: 0.9 }} />,
  },
  {
    titleKey: "specs.c2t" as const,
    bodyKey: "specs.c2b" as const,
    icon: <TuneOutlined sx={{ fontSize: 28, opacity: 0.9 }} />,
  },
  {
    titleKey: "specs.c3t" as const,
    bodyKey: "specs.c3b" as const,
    icon: <SecurityOutlined sx={{ fontSize: 28, opacity: 0.9 }} />,
  },
  {
    titleKey: "specs.c4t" as const,
    bodyKey: "specs.c4b" as const,
    icon: <MovieFilterOutlined sx={{ fontSize: 28, opacity: 0.9 }} />,
  },
];

export function HomeSpecs({ reduced }: HomeSpecsProps) {
  const theme = useTheme();
  const t = useTranslations("home");

  return (
    <Box sx={{ mt: { xs: 6, md: 8 } }}>
      <RevealOnScroll reduced={reduced} y={22} duration={0.55} margin="0px">
        <Typography variant="h2" sx={{ mb: 1.5 }}>
          {t("specs.title")}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 560, mb: 3, lineHeight: 1.78 }}
        >
          {t("specs.body")}
        </Typography>
      </RevealOnScroll>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {specCards.map((card, idx) => (
          <RevealOnScroll
            key={card.titleKey}
            reduced={reduced}
            y={32}
            duration={0.55}
            delay={idx * 0.06}
            margin="-40px"
          >
            <Paper
              sx={{
                p: 3,
                height: "100%",
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                background: glassPaperBg(theme, 0.42, 0.88),
              }}
            >
              <Box
                sx={{
                  color: (th) =>
                    th.palette.mode === "light"
                      ? th.palette.primary.main
                      : th.palette.primary.light,
                }}
              >
                {card.icon}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 650 }}>
                {t(card.titleKey)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.72 }}>
                {t(card.bodyKey)}
              </Typography>
            </Paper>
          </RevealOnScroll>
        ))}
      </Box>
    </Box>
  );
}
