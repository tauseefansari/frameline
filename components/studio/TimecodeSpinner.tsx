"use client";

import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowUpOutlined from "@mui/icons-material/KeyboardArrowUpOutlined";
import { alpha, IconButton, InputBase, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import { formatTimecode } from "@/lib/format";
import { TIMECODE_SPINNER_STEP_SEC } from "@/lib/constants/studio";
import { TABULAR_NUMBER_SX } from "@/lib/constants/ui";

/** Parse a timecode string "MM:SS" or "HH:MM:SS" to seconds. Returns NaN on failure. */
function parseTimecode(value: string): number {
  const parts = value.trim().split(":").map(Number);
  if (parts.some(isNaN)) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}

/**
 * Compact timecode editor: a small numeric input rendered in `MM:SS`/`HH:MM:SS`
 * with arrow-key + spinner buttons that step by `TIMECODE_SPINNER_STEP_SEC`.
 * Designed for in-grid transcript segment editing where space is at a premium.
 */
export function TimecodeSpinner({
  value,
  label,
  shortLabel,
  onChange,
  min = 0,
  max = Infinity,
}: {
  value: number;
  label: string;
  shortLabel: string;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const accent =
    theme.palette.mode === "dark" ? theme.palette.primary.light : theme.palette.primary.main;

  const clamp = (v: number) => Math.min(Math.max(min, v), max);

  const commit = (raw: string) => {
    const parsed = parseTimecode(raw);
    if (!isNaN(parsed)) onChange(clamp(parsed));
    setDraft(null);
  };

  const step = (delta: number) => onChange(clamp(value + delta));

  const arrowBtnSx = (top: boolean) => ({
    p: 0,
    width: 16,
    height: 13,
    minWidth: 0,
    borderRadius: top ? "3px 3px 0 0" : "0 0 3px 3px",
    color: alpha(accent, 0.55),
    "&:hover": { color: accent, bgcolor: alpha(accent, 0.12) },
  });

  return (
    <Stack sx={{ alignItems: "center", gap: 0.3 }}>
      <Typography
        component="span"
        sx={{
          fontSize: "0.58rem",
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: alpha(accent, 0.55),
          lineHeight: 1,
        }}
      >
        {shortLabel}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.25 }}>
        <Tooltip title={label} placement="top">
          <InputBase
            value={draft ?? formatTimecode(value)}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => {
              setDraft(formatTimecode(value));
              e.target.select();
            }}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).blur();
              } else if (e.key === "Escape") {
                setDraft(null);
                (e.target as HTMLInputElement).blur();
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                step(TIMECODE_SPINNER_STEP_SEC);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                step(-TIMECODE_SPINNER_STEP_SEC);
              }
            }}
            inputProps={{ "aria-label": label, spellCheck: false }}
            sx={{
              width: 52,
              fontSize: "0.78rem",
              fontWeight: 700,
              ...TABULAR_NUMBER_SX,
              color: accent,
              px: 0.5,
              py: 0.25,
              borderRadius: 1,
              border: `1px solid transparent`,
              transition: "border-color 0.15s",
              "&:hover": { border: `1px solid ${alpha(accent, 0.4)}` },
              "&.Mui-focused": {
                border: `1px solid ${accent}`,
                bgcolor: alpha(accent, 0.07),
              },
              "& input": { p: 0, textAlign: "center" },
            }}
          />
        </Tooltip>
        <Stack sx={{ gap: 0 }}>
          <IconButton
            size="small"
            onClick={() => step(TIMECODE_SPINNER_STEP_SEC)}
            aria-label={`${label} increase`}
            sx={arrowBtnSx(true)}
          >
            <KeyboardArrowUpOutlined sx={{ fontSize: 13 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => step(-TIMECODE_SPINNER_STEP_SEC)}
            aria-label={`${label} decrease`}
            sx={arrowBtnSx(false)}
          >
            <KeyboardArrowDownOutlined sx={{ fontSize: 13 }} />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
}
