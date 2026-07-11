"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

const EASE_OUT_QUART = [0.22, 1, 0.36, 1] as const;

interface RevealOnScrollProps {
  children: ReactNode;
  /** Whether the user prefers reduced motion. Required so callers stay declarative. */
  reduced: boolean;
  /** Initial Y offset in px. */
  y?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Optional stagger delay in seconds. */
  delay?: number;
  /** Override the viewport `once` flag (defaults to true). */
  once?: boolean;
  /** Override viewport margin (defaults to "-30px"). */
  margin?: HTMLMotionProps<"div">["viewport"] extends infer V
    ? V extends { margin?: infer M }
      ? M
      : never
    : never;
}

/**
 * Thin wrapper around `motion.div` for the common "fade-up on enter" pattern.
 * Replaces dozens of inline `initial={reduced ? false : { opacity: 0, y }}` blocks.
 */
export function RevealOnScroll({
  children,
  reduced,
  y = 20,
  duration = 0.55,
  delay = 0,
  once = true,
  margin = "-30px",
}: RevealOnScrollProps) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin }}
      transition={{ duration, delay: reduced ? 0 : delay, ease: EASE_OUT_QUART }}
    >
      {children}
    </motion.div>
  );
}
