"use client";

import { alpha, Box, Button, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import TimelineOutlined from "@mui/icons-material/TimelineOutlined";
import { motion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef, type RefObject } from "react";
import { Link } from "@/lib/i18n/navigation";
import {
  glassPaperBg,
  headlineGradientCss,
  heroGridBackground,
  heroGridOpacity,
  heroOrbBackground,
  heroVignetteBackground,
  heroWashBackground,
} from "@/components/home/theme-visuals";
import { EASE_OUT_QUART } from "@/components/home/home-motion";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";

interface HomeHeroProps {
  studioHref: string;
  reduced: boolean;
  featuresRef: RefObject<HTMLElement | null>;
}

export function HomeHero({ studioHref, reduced, featuresRef }: HomeHeroProps) {
  const theme = useTheme();
  const t = useTranslations("home");
  const heroBg = headlineGradientCss(theme);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const gridParallaxY = useTransform(heroProgress, [0, 1], reduced ? [0, 0] : [0, -84]);
  const washFade = useTransform(heroProgress, [0, 1], reduced ? [1, 1] : [1, 0.42]);

  const cardShadow =
    theme.palette.mode === "dark"
      ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}, 0 28px 90px ${alpha(theme.palette.primary.main, 0.12)}`
      : `0 0 0 1px ${alpha(theme.palette.primary.main, 0.22)}, 0 22px 72px ${alpha(theme.palette.primary.main, 0.14)}`;

  return (
    <Box
      ref={heroRef}
      sx={{
        position: "relative",
        minHeight: "100dvh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: 7, md: 9 },
        px: { xs: 3, sm: 4, md: 6, lg: 8 },
        overflow: "hidden",
        borderRadius: { xs: 3, md: 4 },
        border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.55 : 0.85)}`,
        isolation: "isolate",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          borderRadius: "inherit",
        }}
      >
        <Box
          component={motion.div}
          style={{ opacity: washFade }}
          sx={{ position: "absolute", inset: 0, background: heroWashBackground(theme) }}
        />
        <Box sx={{ position: "absolute", inset: 0, background: heroOrbBackground(theme) }} />
        <Box sx={{ position: "absolute", inset: 0, background: heroVignetteBackground(theme) }} />
        <motion.div style={{ y: gridParallaxY }} aria-hidden>
          <Box
            sx={{
              position: "absolute",
              inset: "-28% -14%",
              opacity: heroGridOpacity(theme),
              backgroundImage: heroGridBackground(theme),
              backgroundSize: "52px 52px",
              maskImage: "radial-gradient(ellipse 78% 68% at 50% 42%, black 18%, transparent 100%)",
            }}
          />
        </motion.div>
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 5, md: 7 }}
        sx={{
          position: "relative",
          zIndex: 1,
          alignItems: { xs: "stretch", md: "center" },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT_QUART }}
          >
            <Typography variant="overline" color="primary">
              {t("hero.eyebrow")}
            </Typography>
          </motion.div>

          <Stack
            direction="row"
            sx={{
              flexWrap: "wrap",
              columnGap: { xs: 1, md: 1.25 },
              rowGap: 1,
              mt: 1.25,
            }}
          >
            {[t("hero.titleWord1"), t("hero.titleWord2"), t("hero.titleWord3")].map((word, idx) => (
              <motion.span
                key={word}
                initial={reduced ? false : { opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: reduced ? 0 : 0.07 * idx,
                  duration: 0.62,
                  ease: EASE_OUT_QUART,
                }}
                style={{ display: "inline-block" }}
              >
                <Typography
                  variant="h1"
                  component="span"
                  sx={{
                    mr: idx === 2 ? 0 : { xs: 0.65, md: 0.85 },
                    background: heroBg,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                  }}
                >
                  {word}
                </Typography>
              </motion.span>
            ))}
          </Stack>

          <RevealOnScroll reduced={reduced} y={16} duration={0.65} margin="0px">
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 560,
                mt: 2.25,
                fontSize: { xs: "1.03rem", sm: "1.08rem" },
                lineHeight: 1.78,
              }}
            >
              {t("hero.subtitle")}
            </Typography>
          </RevealOnScroll>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              pt: { xs: 2.5, md: 3.5 },
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <motion.div
              whileHover={reduced ? undefined : { scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              style={{ width: "fit-content" }}
            >
              <Button
                component={Link}
                href={studioHref}
                variant="contained"
                size="large"
                startIcon={<AutoAwesomeOutlined />}
              >
                {t("hero.cta")}
              </Button>
            </motion.div>
            <Button
              component={Link}
              href="/#features"
              variant="text"
              color="inherit"
              onClick={(e) => {
                const target = featuresRef.current;
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({
                  behavior: reduced ? "auto" : "smooth",
                  block: "start",
                });
              }}
              sx={{
                alignSelf: { xs: "flex-start", sm: "center" },
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "text.secondary",
                px: 1.5,
                "&:hover": {
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                },
              }}
            >
              {t("hero.secondary")}
            </Button>
          </Stack>
        </Box>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT_QUART }}
          style={{ alignSelf: "stretch", flex: "1 1 0", minWidth: 0 }}
        >
          <Paper
            elevation={0}
            sx={{
              height: "100%",
              minHeight: { xs: 280, md: 360 },
              p: { xs: 2.25, md: 3 },
              borderRadius: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              boxShadow: cardShadow,
              background: glassPaperBg(theme, 0.55, 0.92),
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="overline" color="primary">
                {t("preview.eyebrow")}
              </Typography>
              <Chip
                size="small"
                icon={<TimelineOutlined />}
                label={t("preview.status")}
                sx={{
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                }}
              />
            </Stack>
            <Typography variant="h2" sx={{ fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)" }}>
              {t("preview.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
              {t("preview.body")}
            </Typography>
            <Stack spacing={1} sx={{ mt: "auto", pt: 1 }}>
              {[72, 54, 88, 48].map((w, i) => (
                <Box
                  key={w}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    width: `${w}%`,
                    bgcolor: alpha(theme.palette.primary.main, 0.14 + i * 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.06em" }}>
              {t("preview.hint")}
            </Typography>
          </Paper>
        </motion.div>
      </Stack>
    </Box>
  );
}
