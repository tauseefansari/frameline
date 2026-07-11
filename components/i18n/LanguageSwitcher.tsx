"use client";

import { alpha, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import LanguageOutlined from "@mui/icons-material/LanguageOutlined";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition, type ReactNode } from "react";
import { setLocaleCookie } from "@/app/actions/preferences";
import { type LocaleCode, routing } from "@/lib/i18n/routing";

/** Tiny inline SVG flags — Windows fonts don't ship regional-indicator emojis. */
function FlagUS() {
  return (
    <svg viewBox="0 0 19 10" width={20} height={14} role="presentation" aria-hidden>
      <rect width="19" height="10" fill="#b22234" />
      {[1, 3, 5, 7, 9].map((y) => (
        <rect key={y} y={y} width="19" height="1" fill="#fff" />
      ))}
      <rect width="8" height="5" fill="#3c3b6e" />
    </svg>
  );
}

function FlagES() {
  return (
    <svg viewBox="0 0 6 4" width={20} height={14} role="presentation" aria-hidden>
      <rect width="6" height="4" fill="#aa151b" />
      <rect y="1" width="6" height="2" fill="#f1bf00" />
    </svg>
  );
}

/** Single registry for every locale rendered in the switcher.
 *  Add a new locale to `routing.locales` then drop its flag here. */
const LOCALE_FLAGS: Record<LocaleCode, ReactNode> = {
  en: <FlagUS />,
  es: <FlagES />,
};

export function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const activeLocale = useLocale();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [, startTransition] = useTransition();

  const open = Boolean(anchorEl);
  const options = useMemo(
    () =>
      routing.locales.map((code) => ({
        code,
        label: t(code),
        flag: LOCALE_FLAGS[code],
      })),
    [t],
  );

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleSelect = useCallback(
    (code: LocaleCode) => {
      setAnchorEl(null);
      if (code === activeLocale) return;
      startTransition(async () => {
        await setLocaleCookie(code);
        router.refresh();
      });
    },
    [activeLocale, router],
  );

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-label={t("label")}
        aria-haspopup="menu"
        aria-expanded={open || undefined}
        sx={(theme) => ({
          color: "text.primary",
          border: `1px solid ${alpha(theme.palette.divider, 0.95)}`,
          borderRadius: 2,
          bgcolor: alpha(
            theme.palette.background.paper,
            theme.palette.mode === "light" ? 0.72 : 0.38,
          ),
        })}
      >
        <LanguageOutlined />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 180, borderRadius: 2 } } }}
        disableScrollLock
      >
        {options.map((opt) => (
          <MenuItem
            key={opt.code}
            selected={opt.code === activeLocale}
            onClick={() => handleSelect(opt.code)}
          >
            <ListItemIcon sx={{ minWidth: 32, display: "flex", alignItems: "center" }}>
              {opt.flag}
            </ListItemIcon>
            <ListItemText primary={opt.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
