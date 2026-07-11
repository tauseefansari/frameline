"use client";

import { alpha, type Components, type Theme } from "@mui/material/styles";
import type { AppDesignTokens } from "@/lib/theme/design-tokens";

export function buildComponents(
  t: AppDesignTokens,
  isDark: boolean,
  fieldBg: string,
  fieldBgHover: string,
  focusRing: string,
): Components<Omit<Theme, "components">> {
  return {
    // ---- Baseline ----------------------------------------------------------
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          backgroundColor: t.canvas,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },
        body: {
          backgroundColor: t.canvas,
          color: t.text.primary,
          scrollbarColor: `${t.scrollbar.thumb} ${t.scrollbar.track}`,
        },
        "::selection": {
          backgroundColor: alpha(t.accent.main, isDark ? 0.32 : 0.28),
          color: t.text.primary,
        },
        "*:focus-visible": {
          outline: `2px solid ${focusRing}`,
          outlineOffset: 2,
          borderRadius: 6,
        },
      },
    },

    // ---- Surfaces ----------------------------------------------------------
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${t.borderSubtle}`,
        },
        outlined: { borderColor: t.borderSubtle },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: t.paper,
          border: `1px solid ${t.borderSubtle}`,
          borderRadius: 18,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        title: { fontWeight: 650, letterSpacing: "-0.005em" },
        subheader: { color: t.text.secondary },
      },
    },
    MuiCardActions: {
      styleOverrides: { root: { padding: 16, gap: 8 } },
    },

    MuiMenu: {
      styleOverrides: {
        paper: { backgroundColor: t.paperElevated, borderRadius: 14 },
        list: { paddingBlock: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 6,
          paddingBlock: 8,
          "&.Mui-selected": {
            backgroundColor: alpha(t.accent.main, isDark ? 0.16 : 0.14),
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: t.paperElevated,
          backdropFilter: "blur(24px) saturate(180%)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: t.paperElevated,
          backdropFilter: "blur(24px) saturate(180%)",
          borderRadius: 20,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 650, letterSpacing: "-0.01em" } },
    },
    MuiDialogContentText: {
      styleOverrides: { root: { color: t.text.secondary } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: t.paperElevated,
          backgroundImage: "none",
          borderRight: `1px solid ${t.borderSubtle}`,
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: t.paperElevated,
          color: t.text.primary,
          backdropFilter: "blur(24px) saturate(180%)",
          borderRadius: 12,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: t.paperElevated,
          color: t.text.primary,
          border: `1px solid ${t.borderSubtle}`,
          backdropFilter: "blur(16px) saturate(180%)",
          fontSize: "0.78rem",
          fontWeight: 500,
          paddingBlock: 6,
          paddingInline: 10,
          borderRadius: 8,
        },
        arrow: { color: t.paperElevated },
      },
    },

    // ---- AppBar / Toolbar -------------------------------------------------
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backdropFilter: "blur(22px) saturate(180%)",
          borderBottom: `1px solid ${t.borderSubtle}`,
          boxShadow: "none",
        },
      },
    },
    MuiToolbar: {
      styleOverrides: { root: { minHeight: 64 } },
    },

    // ---- Buttons / IconButton --------------------------------------------
    MuiButtonBase: { defaultProps: { disableRipple: false } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 24,
          paddingBlock: 10,
          boxShadow: "none",
          "&.MuiButton-contained.MuiButton-colorPrimary": {
            boxShadow: isDark
              ? `0 0 0 1px ${alpha(t.text.primary, 0.14)}, 0 12px 40px ${alpha(t.accent.main, 0.22)}`
              : `0 1px 2px ${alpha(t.text.primary, 0.06)}, 0 8px 28px ${alpha(t.accent.main, 0.2)}`,
            "&:hover": {
              boxShadow: isDark
                ? `0 0 0 1px ${alpha(t.text.primary, 0.22)}, 0 16px 44px ${alpha(t.accent.main, 0.28)}`
                : `0 2px 4px ${alpha(t.text.primary, 0.08)}, 0 12px 32px ${alpha(t.accent.main, 0.24)}`,
            },
          },
          "&.MuiButton-outlined": {
            borderColor: t.borderSubtle,
            "&:hover": {
              borderColor: alpha(t.accent.main, 0.55),
              backgroundColor: alpha(t.accent.main, isDark ? 0.08 : 0.06),
            },
          },
          "&.Mui-disabled": {
            color: t.text.disabled,
            borderColor: t.borderSubtle,
          },
        },
        sizeSmall: { paddingInline: 16, paddingBlock: 6, fontSize: "0.85rem" },
        sizeLarge: { paddingInline: 28, paddingBlock: 12, fontSize: "1rem" },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: "background-color 160ms ease, color 160ms ease",
          "&:hover": {
            backgroundColor: alpha(t.accent.main, isDark ? 0.1 : 0.08),
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          borderColor: t.borderSubtle,
          color: t.text.secondary,
          paddingBlock: 8,
          paddingInline: 14,
          "&.Mui-selected": {
            backgroundColor: alpha(t.accent.main, isDark ? 0.16 : 0.14),
            color: t.accent.main,
            "&:hover": {
              backgroundColor: alpha(t.accent.main, isDark ? 0.22 : 0.2),
            },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        grouped: { borderRadius: 10, marginInline: 2, border: "none" },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: { boxShadow: "none" },
        grouped: { borderColor: t.borderSubtle },
      },
    },

    // ---- Inputs -----------------------------------------------------------
    MuiInputBase: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: fieldBg,
          transition: "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: t.borderSubtle },
          "&:hover": {
            backgroundColor: fieldBgHover,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(t.accent.main, 0.35),
            },
          },
          "&.Mui-focused": {
            backgroundColor: fieldBgHover,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: t.accent.main,
              borderWidth: 1,
            },
            boxShadow: `0 0 0 3px ${alpha(t.accent.main, 0.18)}`,
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "currentColor",
          },
        },
        input: { paddingBlock: 12 },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: fieldBg,
          "&:before, &:after": { display: "none" },
          "&:hover": { backgroundColor: fieldBgHover },
          "&.Mui-focused": {
            backgroundColor: fieldBgHover,
            boxShadow: `0 0 0 3px ${alpha(t.accent.main, 0.18)}`,
          },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
          "&:before": { borderBottomColor: t.borderSubtle },
          "&:hover:not(.Mui-disabled, .Mui-error):before": {
            borderBottomColor: alpha(t.accent.main, 0.4),
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: t.text.secondary,
          "&.Mui-focused": { color: t.accent.main },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginInline: 4, fontSize: "0.78rem" } },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "medium" },
    },
    MuiSelect: {
      styleOverrides: { icon: { color: t.text.secondary } },
    },
    MuiCheckbox: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          color: t.text.secondary,
          "&.Mui-checked": { color: t.accent.main },
        },
      },
    },
    MuiRadio: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          color: t.text.secondary,
          "&.Mui-checked": { color: t.accent.main },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        switchBase: {
          "&.Mui-checked": {
            color: t.accent.main,
            "& + .MuiSwitch-track": {
              backgroundColor: alpha(t.accent.main, 0.45),
              opacity: 1,
            },
          },
        },
        track: {
          borderRadius: 999,
          backgroundColor: alpha(t.text.primary, isDark ? 0.18 : 0.22),
          opacity: 1,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: t.accent.main, height: 4 },
        rail: {
          opacity: 1,
          backgroundColor: alpha(t.text.primary, isDark ? 0.14 : 0.16),
        },
        track: { border: "none" },
        thumb: {
          width: 16,
          height: 16,
          backgroundColor: t.accent.main,
          border: `2px solid ${isDark ? "#0b1020" : "#ffffff"}`,
          boxShadow: `0 2px 8px ${alpha(t.accent.main, 0.4)}`,
          "&:hover, &.Mui-focusVisible": {
            boxShadow: `0 0 0 8px ${alpha(t.accent.main, 0.16)}`,
          },
          "&.Mui-active": {
            boxShadow: `0 0 0 12px ${alpha(t.accent.main, 0.22)}`,
          },
        },
        valueLabel: {
          backgroundColor: t.paperElevated,
          color: t.text.primary,
          border: `1px solid ${t.borderSubtle}`,
          borderRadius: 6,
          fontSize: "0.72rem",
        },
        mark: { backgroundColor: alpha(t.text.primary, 0.3) },
        markActive: { backgroundColor: t.accent.main },
      },
    },

    // ---- Feedback ---------------------------------------------------------
    MuiAlert: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { borderRadius: 12, alignItems: "flex-start" },
        icon: { paddingBlock: 0, opacity: 1 },
        message: { padding: "2px 0" },
        action: { paddingTop: 0 },
      },
      variants: [
        {
          props: { variant: "outlined", severity: "success" },
          style: {
            backgroundColor: alpha(t.feedback.success, isDark ? 0.1 : 0.07),
            borderColor: alpha(t.feedback.success, isDark ? 0.45 : 0.4),
            color: isDark ? "#86efac" : "#166534",
            "& .MuiAlert-icon": { color: isDark ? "#4ade80" : "#16a34a" },
          },
        },
        {
          props: { variant: "outlined", severity: "info" },
          style: {
            backgroundColor: alpha(t.feedback.info, isDark ? 0.1 : 0.07),
            borderColor: alpha(t.feedback.info, isDark ? 0.45 : 0.4),
            color: isDark ? "#93c5fd" : "#1e40af",
            "& .MuiAlert-icon": { color: isDark ? "#60a5fa" : "#2563eb" },
          },
        },
        {
          props: { variant: "outlined", severity: "warning" },
          style: {
            backgroundColor: alpha(t.feedback.warning, isDark ? 0.12 : 0.08),
            borderColor: alpha(t.feedback.warning, isDark ? 0.5 : 0.45),
            color: isDark ? "#fde68a" : "#92400e",
            "& .MuiAlert-icon": { color: isDark ? "#fbbf24" : "#d97706" },
          },
        },
        {
          props: { variant: "outlined", severity: "error" },
          style: {
            backgroundColor: alpha(t.feedback.error, isDark ? 0.12 : 0.07),
            borderColor: alpha(t.feedback.error, isDark ? 0.5 : 0.45),
            color: isDark ? "#fca5a5" : "#991b1b",
            "& .MuiAlert-icon": { color: isDark ? "#f87171" : "#dc2626" },
          },
        },
        {
          props: { variant: "filled", severity: "success" },
          style: {
            backgroundColor: isDark ? "#166534" : "#15803d",
            color: "#dcfce7",
            borderLeft: `4px solid #4ade80`,
            "& .MuiAlert-icon": { color: "#4ade80" },
            "& .MuiAlertTitle-root": { color: "#f0fdf4" },
          },
        },
        {
          props: { variant: "filled", severity: "info" },
          style: {
            backgroundColor: isDark ? "#1e3a8a" : "#1d4ed8",
            color: "#dbeafe",
            borderLeft: `4px solid #60a5fa`,
            "& .MuiAlert-icon": { color: "#93c5fd" },
            "& .MuiAlertTitle-root": { color: "#eff6ff" },
          },
        },
        {
          props: { variant: "filled", severity: "warning" },
          style: {
            backgroundColor: isDark ? "#78350f" : "#b45309",
            color: "#fef3c7",
            borderLeft: `4px solid #fbbf24`,
            "& .MuiAlert-icon": { color: "#fde68a" },
            "& .MuiAlertTitle-root": { color: "#fffbeb" },
          },
        },
        {
          props: { variant: "filled", severity: "error" },
          style: {
            backgroundColor: isDark ? "#7f1d1d" : "#b91c1c",
            color: "#fee2e2",
            borderLeft: `4px solid #f87171`,
            "& .MuiAlert-icon": { color: "#fca5a5" },
            "& .MuiAlertTitle-root": { color: "#fff1f2" },
          },
        },
      ],
    },
    MuiAlertTitle: {
      styleOverrides: { root: { fontWeight: 650, marginBottom: 2 } },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 999,
          backgroundColor: alpha(t.text.primary, isDark ? 0.08 : 0.1),
        },
        bar: { borderRadius: 999, backgroundColor: t.accent.main },
      },
    },
    MuiCircularProgress: {
      styleOverrides: { root: { color: t.accent.main } },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(t.text.primary, isDark ? 0.08 : 0.08),
          borderRadius: 8,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(t.canvas, 0.65),
          backdropFilter: "blur(6px)",
        },
        invisible: { backgroundColor: "transparent", backdropFilter: "none" },
      },
    },

    // ---- Navigation -------------------------------------------------------
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: {
          height: 3,
          borderRadius: 3,
          backgroundColor: t.accent.main,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.01em",
          minHeight: 44,
          paddingInline: 14,
          color: t.text.secondary,
          "&.Mui-selected": { color: t.text.primary },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: { color: t.text.disabled },
        li: { color: t.text.secondary },
      },
    },
    MuiPagination: {
      styleOverrides: { ul: { gap: 4 } },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          "&.Mui-selected": {
            backgroundColor: alpha(t.accent.main, isDark ? 0.18 : 0.16),
            color: t.accent.main,
          },
        },
      },
    },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: {
        root: { color: t.accent.main, textUnderlineOffset: 3 },
      },
    },

    // ---- Data display -----------------------------------------------------
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backdropFilter: "blur(12px)",
          fontWeight: 500,
        },
        outlined: {
          borderColor: t.borderSubtle,
          backgroundColor: alpha(t.canvas, isDark ? 0.2 : 0.35),
        },
        filled: {
          // Only restyle the default (uncolored) filled chip — leave
          // `color="primary" | "secondary" | ...` chips on MUI's own
          // background/contrastText pairing so they stay readable.
          "&.MuiChip-colorDefault": {
            backgroundColor: alpha(t.text.primary, isDark ? 0.08 : 0.06),
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 600, borderRadius: 999 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(t.accent.main, isDark ? 0.18 : 0.14),
          color: t.accent.main,
          fontWeight: 600,
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: t.divider } },
    },
    MuiList: {
      styleOverrides: { root: { paddingBlock: 4 } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 4,
          "&.Mui-selected": {
            backgroundColor: alpha(t.accent.main, isDark ? 0.16 : 0.14),
            "&:hover": {
              backgroundColor: alpha(t.accent.main, isDark ? 0.22 : 0.2),
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { color: t.text.secondary, minWidth: 36 } },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: { fontWeight: 500 },
        secondary: { color: t.text.secondary },
      },
    },
    MuiTable: {
      styleOverrides: { root: { borderCollapse: "separate", borderSpacing: 0 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${t.divider}`,
          padding: "12px 16px",
        },
        head: {
          color: t.text.secondary,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontSize: "0.72rem",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: alpha(t.accent.main, isDark ? 0.04 : 0.05) },
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },

    // ---- Disclosure -------------------------------------------------------
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: t.paper,
          backdropFilter: "blur(18px) saturate(150%)",
          border: `1px solid ${t.borderSubtle}`,
          borderRadius: "14px !important",
          boxShadow: "none",
          overflow: "hidden",
          "&:before": { display: "none" },
          "&.Mui-expanded": {
            borderColor: alpha(t.accent.main, 0.28),
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { paddingInline: 20, minHeight: 56 },
        content: { marginBlock: 14 },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: { root: { paddingInline: 20, paddingBottom: 20 } },
    },
  };
}
