"use client";

import { alpha, Box, Button, Stack, Typography, useTheme } from "@mui/material";
import GraphicEqOutlined from "@mui/icons-material/GraphicEqOutlined";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";
import { Link } from "@/lib/i18n/navigation";
import { headlineGradientCss } from "@/components/home/theme-visuals";

interface HomeClosingProps {
  studioHref: string;
  reduced: boolean;
  rootRef: RefObject<HTMLElement | null>;
}

export function HomeClosing({ studioHref, reduced, rootRef }: HomeClosingProps) {
  const theme = useTheme();
  const t = useTranslations("home");
  const heroBg = headlineGradientCss(theme);

  return (
    <Box
      sx={{
        py: { xs: 8, md: 10 },
        px: { xs: 3, md: 5 },
        borderRadius: { md: 4 },
        mb: { xs: 2, md: 4 },
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
        background: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.06),
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          background: heroBg,
          maskImage: "linear-gradient(135deg, black, transparent 65%)",
        }}
      />
      <Stack spacing={2.5} sx={{ position: "relative", zIndex: 1, alignItems: "flex-start" }}>
        <Typography variant="h2" sx={{ maxWidth: 560 }}>
          {t("closing.title")}
        </Typography>
        <Typography
          variant="body1"
          sx={{ maxWidth: 520, color: "text.secondary", lineHeight: 1.78 }}
        >
          {t("closing.body")}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 1 }}>
          <Button
            component={Link}
            href={studioHref}
            variant="contained"
            color="primary"
            size="large"
            startIcon={<GraphicEqOutlined />}
          >
            {t("closing.cta")}
          </Button>
          <Button
            component={Link}
            href="#top"
            variant="outlined"
            color="inherit"
            size="large"
            onClick={(e) => {
              e.preventDefault();
              rootRef.current?.scrollIntoView({
                behavior: reduced ? "auto" : "smooth",
                block: "start",
              });
            }}
          >
            {t("closing.secondary")}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
