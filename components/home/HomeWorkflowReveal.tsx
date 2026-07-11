"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

export function HomeWorkflowReveal({
  children,
  reducedMotion,
}: {
  children: ReactNode;
  reducedMotion: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reducedMotion || !root.current) return;
      const steps = root.current.querySelectorAll("[data-work-step]");
      gsap.from(steps, {
        opacity: 0,
        y: 44,
        stagger: 0.12,
        duration: 0.72,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: root, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return <div ref={root}>{children}</div>;
}
