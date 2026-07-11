export const motionChipParent = (reduced: boolean) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: reduced ? 0 : 0.09 },
  },
});

export const motionChipChild = (reduced: boolean) => ({
  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
});

export const statsParent = (reduced: boolean) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: reduced ? 0 : 0.11 },
  },
});

export const statsChild = (reduced: boolean) => ({
  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
});

export const EASE_OUT_QUART = [0.22, 1, 0.36, 1] as const;
