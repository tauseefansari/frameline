"use client";

import { Activity } from "react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  PANEL_MOTION_DURATION_SEC,
  PANEL_MOTION_EASING,
  PANEL_MOTION_OFFSET_PX,
} from "@/lib/constants/studio";

const PANEL_MOTION = {
  initial: { opacity: 0, y: PANEL_MOTION_OFFSET_PX },
  animate: { opacity: 1, y: 0 },
  transition: { duration: PANEL_MOTION_DURATION_SEC, ease: PANEL_MOTION_EASING },
};

interface StudioTabPanelProps<T extends string> {
  /** The tab whose panel this is. */
  value: T;
  /** Currently active tab. */
  active: T;
  /** Stable name passed to React's `<Activity>` boundary. */
  name: string;
  /** Whether the user prefers reduced motion. */
  reduced: boolean;
  children: ReactNode;
}

/**
 * Wraps a studio tab body in React's `<Activity>` boundary plus the shared
 * motion entry animation. Removes the repeated `<Activity><motion.div>...`
 * scaffold from `StudioWorkspace`.
 */
export function StudioTabPanel<T extends string>({
  value,
  active,
  name,
  reduced,
  children,
}: StudioTabPanelProps<T>) {
  return (
    <Activity mode={value === active ? "visible" : "hidden"} name={name}>
      <motion.div {...(reduced ? {} : PANEL_MOTION)}>{children}</motion.div>
    </Activity>
  );
}
