"use client";

import {
  alpha,
  AppBar,
  Box,
  Button,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import { useTranslations } from "next-intl";
import { type ReactNode } from "react";
import { Link } from "@/lib/i18n/navigation";
import { useColorMode } from "@/components/theme/use-color-mode";
import { ColorMode } from "@/lib/theme/color-mode";
import { CONTENT_MAX_PX } from "@/lib/constants/ui";
import { GlobalProgressBar } from "@/components/feedback/GlobalProgressBar";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function AppShell({
  children,
  studioHref,
  fullBleed,
}: {
  children: ReactNode;
  studioHref: string;
  /** Use wide home layout with centered max-width container */
  fullBleed?: boolean;
}) {
  const theme = useTheme();
  const t = useTranslations("common");
  const { mode, toggleColorMode } = useColorMode();

  const glassBg = alpha(
    theme.palette.background.default,
    theme.palette.mode === "dark" ? 0.78 : 0.86,
  );

  const navMuted =
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.72)
      : alpha(theme.palette.text.primary, 0.78);

  const navButtonSx = {
    fontWeight: 600,
    letterSpacing: "0.05em",
    fontSize: "0.72rem",
    color: navMuted,
    minWidth: 0,
    px: 1,
    whiteSpace: "nowrap",
    "&:hover": {
      color: "primary.main",
      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.08 : 0.1),
    },
  } as const;

  /** Viewport-side inset — large enough to read as deliberate margins on wide screens */
  const pageGutter = {
    xs: "16px",
    sm: "24px",
    md: "40px",
    lg: "64px",
    xl: "96px",
  } as const;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", overflowX: "hidden" }}
    >
      <GlobalProgressBar />
      <AppBar
        position="fixed"
        elevation={0}
        color="transparent"
        sx={{
          top: 0,
          bgcolor: glassBg,
        }}
      >
        <Toolbar
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0,1fr) auto",
              md: "minmax(0,1fr) auto minmax(0,1fr)",
            },
            alignItems: "center",
            columnGap: 2,
            minHeight: { xs: 64, sm: 72 },
            maxWidth: CONTENT_MAX_PX,
            width: "100%",
            mx: "auto",
            px: pageGutter,
            boxSizing: "border-box",
          }}
        >
          <Typography
            variant="overline"
            suppressHydrationWarning
            sx={{
              gridColumn: "1",
              justifySelf: "start",
              letterSpacing: "0.28em",
              fontWeight: 700,
              minWidth: 0,
              background: (th) =>
                th.palette.mode === "light"
                  ? `linear-gradient(90deg, ${th.palette.primary.dark}, ${th.palette.primary.main})`
                  : `linear-gradient(90deg, ${th.palette.primary.light}, ${th.palette.primary.main})`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              {t("nav.brand")}
            </Link>
          </Typography>

          <Stack
            direction="row"
            spacing={0.25}
            sx={{
              gridColumn: "2",
              display: { xs: "none", md: "flex" },
              justifySelf: "center",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
              rowGap: 0.5,
              columnGap: 0.25,
              maxWidth: { md: 520, lg: 580 },
            }}
          >
            <Button component={Link} href="/" variant="text" sx={navButtonSx}>
              {t("nav.home")}
            </Button>
            <Button component={Link} href="/#features" variant="text" sx={navButtonSx}>
              {t("nav.features")}
            </Button>
            <Button component={Link} href="/#workflow" variant="text" sx={navButtonSx}>
              {t("nav.workflow")}
            </Button>
            <Button component={Link} href="/#faq" variant="text" sx={navButtonSx}>
              {t("nav.faq")}
            </Button>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              gridColumn: { xs: "2", md: "3" },
              justifySelf: "end",
              alignItems: "center",
            }}
          >
            <Button
              component={Link}
              href={studioHref}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 999,
                px: 2.25,
                fontWeight: 600,
                borderColor: alpha(theme.palette.primary.main, 0.42),
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {t("nav.studio")}
            </Button>
            <LanguageSwitcher />
            <IconButton
              onClick={toggleColorMode}
              aria-label={mode === ColorMode.Dark ? t("theme.toggleLight") : t("theme.toggleDark")}
              sx={{
                color: "text.primary",
                border: `1px solid ${alpha(theme.palette.divider, 0.95)}`,
                borderRadius: 2,
                bgcolor: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === "light" ? 0.72 : 0.38,
                ),
              }}
            >
              {mode === ColorMode.Dark ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>
      {/* Spacer that matches the AppBar height so content starts below it */}
      <Box sx={{ minHeight: { xs: 64, sm: 72 }, flexShrink: 0 }} />
      <Box component="main" sx={{ flex: 1, width: "100%", minWidth: 0, position: "relative" }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: CONTENT_MAX_PX,
            mx: "auto",
            px: pageGutter,
            boxSizing: "border-box",
            pt: fullBleed ? { xs: 1, sm: 2 } : { xs: 4, md: 7 },
            pb: fullBleed ? { xs: 10, md: 14 } : { xs: 6, md: 9 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
