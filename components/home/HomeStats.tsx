"use client";

import { Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { glassPaperBg } from "@/components/home/theme-visuals";
import { statsChild, statsParent } from "@/components/home/home-motion";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";

interface HomeStatsProps {
  reduced: boolean;
}

const rows = [
  { s: "stats.s1", l: "stats.l1" },
  { s: "stats.s2", l: "stats.l2" },
  { s: "stats.s3", l: "stats.l3" },
] as const;

export function HomeStats({ reduced }: HomeStatsProps) {
  const theme = useTheme();
  const t = useTranslations("home");

  return (
    <Box sx={{ mt: { xs: 5, md: 7 } }}>
      <RevealOnScroll reduced={reduced} y={20} duration={0.55} margin="0px">
        <Typography variant="h2" sx={{ mb: 3, maxWidth: 640 }}>
          {t("stats.title")}
        </Typography>
      </RevealOnScroll>
      <motion.div
        variants={statsParent(reduced)}
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "show"}
        viewport={{ once: true, margin: "-60px" }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.25}>
          {rows.map((row) => (
            <motion.div key={row.s} variants={statsChild(reduced)} style={{ flex: 1 }}>
              <Paper
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  background: glassPaperBg(theme, 0.4, 0.85),
                }}
              >
                <SpeedOutlined sx={{ color: "primary.main", fontSize: 30 }} />
                <Typography variant="h3" sx={{ fontSize: "2rem", fontWeight: 700 }}>
                  {t(row.s)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                  {t(row.l)}
                </Typography>
              </Paper>
            </motion.div>
          ))}
        </Stack>
      </motion.div>
    </Box>
  );
}
