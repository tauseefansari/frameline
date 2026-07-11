import { FULL_RANGE_EPSILON_SEC } from "@/lib/constants/studio";
import type { ClipRange } from "@/lib/types/studio";

/**
 * Generates a stable client-side identifier for a newly added studio clip.
 * The optional `seed` is appended to disambiguate IDs created in the same
 * tick (e.g. a multi-file drop loop).
 */
export function createClipId(seed?: string | number): string {
  const tail = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return seed === undefined ? `clip_${tail}` : `clip_${tail}_${seed}`;
}

/**
 * Effective playback duration of a clip after an optional trim range is
 * applied. A null/empty/inverted range falls back to the full duration.
 */
export function getEffectiveDuration(
  range: ClipRange | null | undefined,
  fullDuration: number,
): number {
  if (!range || range.endSec <= range.startSec) return fullDuration;
  return range.endSec - range.startSec;
}

/**
 * True when `range` spans the entire clip (within epsilon). Used to decide
 * whether to send a trim payload to the server at all.
 */
export function isFullClipRange(startSec: number, endSec: number, fullDuration: number): boolean {
  return (
    Math.abs(startSec - 0) < FULL_RANGE_EPSILON_SEC &&
    Math.abs(endSec - fullDuration) < FULL_RANGE_EPSILON_SEC
  );
}
