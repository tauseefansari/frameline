"use client";

import { Box, Chip, Stack, Typography, useTheme } from "@mui/material";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import HubOutlined from "@mui/icons-material/HubOutlined";
import MovieFilterOutlined from "@mui/icons-material/MovieFilterOutlined";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { glassPaperBg } from "@/components/home/theme-visuals";
import { forwardRef } from "react";
import { motionChipChild, motionChipParent } from "@/components/home/home-motion";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";

interface HomeFeaturesProps {
  reduced: boolean;
}

export const HomeFeatures = forwardRef<HTMLElement, HomeFeaturesProps>(function HomeFeatures(
  { reduced },
  ref,
) {
  const t = useTranslations("home");
  const theme = useTheme();

  return (
    <Box
      component="section"
      id="features"
      ref={ref}
      sx={{
        scrollMarginTop: "96px",
        mt: { xs: 3, md: 5 },
        py: { xs: 8, md: 11 },
        borderRadius: { md: 4 },
        border: `1px solid`,
        borderColor: "divider",
        background: glassPaperBg(theme, 0.38, 0.72),
        backdropFilter: "blur(28px) saturate(160%)",
        px: { xs: 2.5, sm: 3.5, md: 4 },
      }}
    >
      <RevealOnScroll reduced={reduced} y={28} duration={0.65} margin="-80px">
        <Typography
          variant="h2"
          gutterBottom
          sx={{
            maxWidth: 720,
            fontSize: { xs: "clamp(1.55rem, 4vw, 2.25rem)", md: undefined },
          }}
        >
          {t("features.title")}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 620, mb: 3.5, lineHeight: 1.78 }}
        >
          {t("features.body")}
        </Typography>
        <motion.div
          variants={motionChipParent(reduced)}
          initial={reduced ? false : "hidden"}
          whileInView={reduced ? undefined : "show"}
          viewport={{ once: true, margin: "-40px" }}
        >
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.25 }}>
            <motion.div variants={motionChipChild(reduced)}>
              <Chip icon={<HubOutlined />} label={t("features.chip1")} variant="outlined" />
            </motion.div>
            <motion.div variants={motionChipChild(reduced)}>
              <Chip icon={<MovieFilterOutlined />} label={t("features.chip2")} variant="outlined" />
            </motion.div>
            <motion.div variants={motionChipChild(reduced)}>
              <Chip icon={<AutoAwesomeOutlined />} label={t("features.chip3")} variant="outlined" />
            </motion.div>
          </Stack>
        </motion.div>
      </RevealOnScroll>
    </Box>
  );
});
