import { SEGMENT_BOUNDARY_EPSILON_SEC } from "@/lib/constants/audio";
import { MIN_SEGMENT_DURATION_SEC } from "@/lib/constants/transcript";
import type { TranscriptSegment } from "@/lib/types/studio";

function prepareSegmentsForSpeechSync(segments: TranscriptSegment[]): TranscriptSegment[] {
  return segments
    .filter((seg) => seg.text.trim().length > 0)
    .sort((a, b) => a.start - b.start || a.id - b.id);
}

/**
 * Shrink segment boundaries when speech runs past the video end. Never
 * stretches a short timeline to fill the video — trailing silence lives in
 * the audio track only, not in an oversized last caption slot.
 */
function scaleSegmentsToDuration(
  segments: TranscriptSegment[],
  totalDurationSec: number,
): TranscriptSegment[] {
  const sorted = prepareSegmentsForSpeechSync(segments);
  if (sorted.length === 0 || totalDurationSec <= 0) return sorted;

  const lastEnd = sorted[sorted.length - 1].end;
  if (!Number.isFinite(lastEnd) || lastEnd <= 0) return sorted;
  if (lastEnd <= totalDurationSec + SEGMENT_BOUNDARY_EPSILON_SEC) {
    return sorted;
  }

  const scale = totalDurationSec / lastEnd;
  return sorted.map((seg) => ({
    ...seg,
    start: Number((seg.start * scale).toFixed(3)),
    end: Number((seg.end * scale).toFixed(3)),
  }));
}

/**
 * Snap segments into a contiguous, non-overlapping grid with sequential ids
 * matching playback order.
 */
export function enforceSequentialSegmentGrid(
  segments: TranscriptSegment[],
  totalDurationSec: number,
): TranscriptSegment[] {
  const sorted = prepareSegmentsForSpeechSync(segments);
  if (sorted.length === 0 || totalDurationSec <= 0) return [];

  const fixed: TranscriptSegment[] = [];
  let prevEnd = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    const start =
      i === 0
        ? Number(Math.max(0, Math.min(sorted[i].start, totalDurationSec)).toFixed(3))
        : prevEnd;
    const minEnd = start + MIN_SEGMENT_DURATION_SEC;
    const end = Number(Math.min(totalDurationSec, Math.max(minEnd, sorted[i].end)).toFixed(3));

    fixed.push({
      id: i,
      start,
      end,
      text: sorted[i].text,
    });
    prevEnd = end;
  }

  return fixed;
}

/**
 * Align segment boundaries to the live track length and return a sorted,
 * contiguous, speakable list ready for `/api/tts/sync`.
 */
export function normalizeSegmentsForTrack(
  segments: TranscriptSegment[],
  totalDurationSec: number,
): TranscriptSegment[] {
  return enforceSequentialSegmentGrid(
    scaleSegmentsToDuration(segments, totalDurationSec),
    totalDurationSec,
  );
}

/**
 * Resolve the voiceover track length. Prefer the live player duration, then
 * the last segment end, then the transcription metadata fallback.
 */
export function resolveTrackDurationSec(
  playerDurationSec: number,
  segments: TranscriptSegment[],
  fallbackDurationSec: number,
): number {
  if (Number.isFinite(playerDurationSec) && playerDurationSec > 0) {
    return playerDurationSec;
  }
  const lastEnd = segments.length > 0 ? segments[segments.length - 1].end : 0;
  if (Number.isFinite(lastEnd) && lastEnd > 0) {
    return lastEnd;
  }
  if (Number.isFinite(fallbackDurationSec) && fallbackDurationSec > 0) {
    return fallbackDurationSec;
  }
  return 0;
}
