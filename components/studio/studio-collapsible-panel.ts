import type { SxProps, Theme } from "@mui/material";

/** Shared shell for optional, collapsible studio panels (accordions). */
export const studioCollapsiblePanelSx: SxProps<Theme> = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  "&:before": { display: "none" },
};
