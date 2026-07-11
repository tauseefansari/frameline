"use client";

import type { TypographyVariantsOptions } from "@mui/material/styles";

export const typographyOptions: TypographyVariantsOptions = {
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  h1: {
    fontWeight: 650,
    letterSpacing: "-0.045em",
    fontSize: "clamp(2.35rem, 5.2vw, 4.1rem)",
    lineHeight: 1.04,
  },
  h2: {
    fontWeight: 620,
    letterSpacing: "-0.035em",
    fontSize: "clamp(1.85rem, 3.2vw, 2.85rem)",
    lineHeight: 1.12,
  },
  h3: {
    fontWeight: 600,
    letterSpacing: "-0.025em",
    fontSize: "clamp(1.5rem, 2.4vw, 2.15rem)",
    lineHeight: 1.18,
  },
  h4: {
    fontWeight: 600,
    letterSpacing: "-0.018em",
    fontSize: "clamp(1.25rem, 1.8vw, 1.65rem)",
    lineHeight: 1.25,
  },
  h5: {
    fontWeight: 600,
    letterSpacing: "-0.01em",
    fontSize: "1.2rem",
    lineHeight: 1.3,
  },
  h6: {
    fontWeight: 650,
    letterSpacing: "0",
    fontSize: "1.0625rem",
    lineHeight: 1.35,
  },
  subtitle1: {
    fontWeight: 600,
    fontSize: "1.05rem",
    lineHeight: 1.55,
    letterSpacing: "-0.005em",
  },
  subtitle2: {
    fontWeight: 600,
    fontSize: "0.9rem",
    lineHeight: 1.5,
    letterSpacing: "0.01em",
  },
  body1: {
    fontSize: "1.0625rem",
    lineHeight: 1.72,
  },
  body2: {
    fontSize: "0.95rem",
    lineHeight: 1.62,
  },
  caption: {
    fontSize: "0.78rem",
    lineHeight: 1.5,
    letterSpacing: "0.015em",
  },
  overline: {
    letterSpacing: "0.38em",
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    fontSize: "0.7rem",
    fontWeight: 600,
    lineHeight: 1.6,
  },
  button: {
    textTransform: "none",
    fontWeight: 600,
    letterSpacing: "0.02em",
    fontSize: "0.95rem",
  },
};
