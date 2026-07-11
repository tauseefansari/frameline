"use client";

import { Box, Skeleton, Stack } from "@mui/material";
import { WAVEFORM_HEIGHT_PX } from "@/lib/constants/audio";

/**
 * 16:9 placeholder used wherever a rendered/processed video preview is about
 * to appear (Export render, Merge result, Timeline cut). Matches `VideoStage`'s
 * outer shape so swapping the skeleton for the real player feels seamless.
 */
export function VideoStageSkeleton() {
  return (
    <Box sx={{ width: "100%", aspectRatio: "16 / 9" }}>
      <Skeleton
        variant="rounded"
        animation="wave"
        width="100%"
        height="100%"
        sx={{ borderRadius: 3 }}
      />
    </Box>
  );
}

/**
 * Full-bleed placeholder used inside a parent that already enforces the
 * desired shape (clip thumbnail tile). Pins to all four corners.
 */
export function ThumbnailSkeleton() {
  return (
    <Skeleton
      variant="rounded"
      animation="wave"
      sx={{ position: "absolute", inset: 0, height: "100%", borderRadius: 0 }}
    />
  );
}

/**
 * Placeholder rectangle that matches the wavesurfer canvas height so the
 * audio player doesn't reflow once decoding finishes.
 */
export function WaveformSkeleton() {
  return (
    <Skeleton
      variant="rounded"
      animation="wave"
      sx={{
        position: "absolute",
        inset: 0,
        height: WAVEFORM_HEIGHT_PX,
        borderRadius: 1,
      }}
    />
  );
}

/**
 * Five-line placeholder for the editable transcript panel — a heading bar,
 * a paragraph block, and three decreasing segment rows.
 */
export function TranscriptSkeleton() {
  return (
    <Stack spacing={1.25}>
      <Skeleton variant="rounded" height={28} width="40%" animation="wave" />
      <Skeleton variant="rounded" height={140} animation="wave" />
      <Skeleton variant="rounded" height={56} animation="wave" />
      <Skeleton variant="rounded" height={56} width="92%" animation="wave" />
      <Skeleton variant="rounded" height={56} width="86%" animation="wave" />
    </Stack>
  );
}

/**
 * Two-row placeholder for the voice synthesis output — waveform + download
 * button. Shown while Piper is rendering.
 */
export function VoiceSynthSkeleton() {
  return (
    <Stack spacing={1.25}>
      <Skeleton variant="rounded" height={88} animation="wave" />
      <Skeleton variant="rounded" height={36} width={180} animation="wave" />
    </Stack>
  );
}
