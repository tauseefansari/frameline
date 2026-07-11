"use client";

import { Box, useMediaQuery } from "@mui/material";
import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { HomeClosing } from "@/components/home/HomeClosing";
import { HomeFaq } from "@/components/home/HomeFaq";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeSpecs } from "@/components/home/HomeSpecs";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeWorkflow } from "@/components/home/HomeWorkflow";

export function HomePage({ studioHref }: { studioHref: string }) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const reduced = prefersReducedMotion;

  const rootRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);

  const { scrollYProgress: pageProgress } = useScroll();
  const scrollBarSpring = useSpring(pageProgress, {
    stiffness: reduced ? 500 : 130,
    damping: reduced ? 48 : 26,
    mass: 0.28,
  });

  return (
    <Box component="article" id="top" ref={rootRef} sx={{ position: "relative" }}>
      {!reduced ? (
        <Box
          component={motion.div}
          style={{
            scaleX: scrollBarSpring,
            transformOrigin: "0% 50%",
          }}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 1301,
            bgcolor: "primary.main",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <HomeHero studioHref={studioHref} reduced={reduced} featuresRef={featuresRef} />
      <HomeFeatures ref={featuresRef} reduced={reduced} />
      <HomeWorkflow reduced={reduced} />
      <HomeStats reduced={reduced} />
      <HomeSpecs reduced={reduced} />
      <HomeFaq reduced={reduced} />
      <HomeClosing studioHref={studioHref} reduced={reduced} rootRef={rootRef} />
    </Box>
  );
}
