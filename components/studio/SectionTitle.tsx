"use client";

import { Typography, type TypographyProps } from "@mui/material";

type Props = {
  children: React.ReactNode;
} & Pick<TypographyProps, "id" | "sx">;

/**
 * Standard heading used at the top of every studio tab/section. Centralizes
 * the `variant="h6"` + semi-bold weight pairing so the visual rhythm stays
 * consistent across Source, Transcript, Voice, Timeline, Export, Merge, and
 * the drop zone.
 */
export function SectionTitle({ children, sx, id }: Props) {
  return (
    <Typography id={id} variant="h6" sx={[{ fontWeight: 650 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {children}
    </Typography>
  );
}
