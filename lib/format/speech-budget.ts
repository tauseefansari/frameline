import {
  MAX_SEGMENT_SPEECH_SEC,
  MAX_SENTENCES_PER_SEGMENT,
  MAX_WORDS_PER_SEGMENT,
  MIN_SEGMENT_DURATION_SEC,
  SPEECH_FILL_MARGIN,
  SPEECH_STRETCH_MIN_RATIO,
  WORDS_PER_MINUTE,
} from "@/lib/constants/transcript";
import { SPEECH_COMPOSE_EPSILON_SEC } from "@/lib/constants/audio";
import type { TranscriptSegment } from "@/lib/types/studio";

/** Exact word count at {@link WORDS_PER_MINUTE} with no fill margin. */
export function nominalWordsForVideo(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return Math.max(1, Math.floor((durationSec / 60) * WORDS_PER_MINUTE));
}

/**
 * Word budget for the full script at Piper's natural speaking rate.
 * Slightly above exact fit so the model has enough text to fill the runtime.
 * Scripts at or below this count are kept intact on sync.
 */
export function maxWordsForVideoBudget(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return Math.max(1, Math.floor((durationSec / 60) * WORDS_PER_MINUTE * SPEECH_FILL_MARGIN));
}

/** Max Piper speech duration before audio is trimmed (nominal runtime × fill margin). */
export function maxSpeechDurationSec(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return durationSec * SPEECH_FILL_MARGIN;
}

/**
 * When synthesized speech is shorter than the video but not drastically so,
 * return the ffmpeg `atempo` factor to stretch audio to `targetSec`.
 * Returns null when speech already fits, is far too short, or should be padded.
 */
export function speechStretchTempo(totalSpeechSec: number, targetSec: number): number | null {
  if (!Number.isFinite(totalSpeechSec) || !Number.isFinite(targetSec) || targetSec <= 0) {
    return null;
  }
  if (totalSpeechSec >= targetSec - SPEECH_COMPOSE_EPSILON_SEC) return null;
  const ratio = totalSpeechSec / targetSec;
  if (ratio < SPEECH_STRETCH_MIN_RATIO) return null;
  return ratio;
}

/** Scale factor for segment timings after a uniform tempo-stretch to fill the clip. */
export function voiceoverTimingScale(totalSpeechSec: number, targetSec: number): number {
  const tempo = speechStretchTempo(totalSpeechSec, targetSec);
  if (tempo == null) return 1;
  return targetSec / totalSpeechSec;
}

/** Estimate how long Piper takes to speak `text` at {@link WORDS_PER_MINUTE}. */
export function estimateSpeechDurationSec(text: string): number {
  const words = countSpokenWords(text);
  if (words === 0) return 0;
  return Math.max(MIN_SEGMENT_DURATION_SEC, (words / WORDS_PER_MINUTE) * 60);
}

export function countSpokenWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Trim `text` to at most `maxWords`, breaking on sentence boundaries when
 * possible. Returns any leftover words as `overflow` for the next segment.
 */
function trimTextToWordBudget(text: string, maxWords: number): { text: string; overflow: string } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || maxWords <= 0) {
    return { text: "", overflow: words.join(" ") };
  }
  if (words.length <= maxWords) {
    return { text: words.join(" "), overflow: "" };
  }

  let cutAt = maxWords;
  const minCut = Math.max(1, Math.floor(maxWords * 0.5));
  for (let i = maxWords - 1; i >= minCut; i -= 1) {
    if (/[.!?]$/.test(words[i])) {
      cutAt = i + 1;
      break;
    }
  }

  return {
    text: words.slice(0, cutAt).join(" "),
    overflow: words.slice(cutAt).join(" "),
  };
}

function splitIntoSentences(text: string): string[] {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Split script text into speakable blocks. Preserves blank-line paragraphs from
 * pasted / external-AI scripts so trim drops whole blocks, not merged sentences.
 */
function splitIntoScriptBlocks(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (/\n\s*\n/.test(trimmed)) {
    return trimmed
      .split(/\n\s*\n+/)
      .map((block) => block.trim().replace(/\s+/g, " "))
      .filter(Boolean);
  }

  return splitIntoSentences(trimmed);
}

/**
 * Break long sentences into speakable units that each fit {@link MAX_WORDS_PER_SEGMENT}.
 */
function splitToSpeakableUnits(sentences: string[]): string[] {
  const units: string[] = [];

  for (const sentence of sentences) {
    if (countSpokenWords(sentence) <= MAX_WORDS_PER_SEGMENT) {
      units.push(sentence);
      continue;
    }

    let remaining = sentence.trim();
    while (remaining) {
      const { text, overflow } = trimTextToWordBudget(remaining, MAX_WORDS_PER_SEGMENT);
      if (text) units.push(text);
      remaining = overflow;
      if (!overflow) break;
    }
  }

  return units;
}

/**
 * Group speakable units into short chunks (~two UI lines, at most two sentences).
 */
function packSentencesIntoShortChunks(sentences: string[]): string[] {
  const units = splitToSpeakableUnits(sentences);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const unit of units) {
    const unitWords = countSpokenWords(unit);
    const combined = [...current, unit].join(" ");
    const wouldExceedWords = currentWords + unitWords > MAX_WORDS_PER_SEGMENT;
    const wouldExceedSentences = current.length >= MAX_SENTENCES_PER_SEGMENT;
    const wouldExceedTime = estimateSpeechDurationSec(combined) > MAX_SEGMENT_SPEECH_SEC;

    if (current.length > 0 && (wouldExceedWords || wouldExceedSentences || wouldExceedTime)) {
      chunks.push(current.join(" "));
      current = [unit];
      currentWords = unitWords;
    } else {
      current.push(unit);
      currentWords += unitWords;
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

/**
 * When the script exceeds the video word budget, drop whole sentences from
 * the end so we never chop mid-sentence.
 */
function trimScriptToVideoBudget(text: string, durationSec: number): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const totalWords = countSpokenWords(trimmed);
  const wordBudget = maxWordsForVideoBudget(durationSec);

  // Word-count fit is authoritative — duration estimates are too coarse and
  // would drop closing lines on clips that are only ~1 s shorter than nominal.
  if (totalWords <= wordBudget) {
    return trimmed;
  }

  const blocks = splitIntoScriptBlocks(trimmed);
  if (blocks.length <= 1) {
    return trimTextToWordBudget(trimmed, wordBudget).text;
  }

  const kept: string[] = [];
  for (const block of blocks) {
    const candidate = [...kept, block].join(" ");
    if (countSpokenWords(candidate) > wordBudget && kept.length > 0) break;
    kept.push(block);
  }

  let result = kept.join(" ").trim();
  if (countSpokenWords(result) > wordBudget) {
    result = trimTextToWordBudget(result, wordBudget).text;
  }
  return result;
}

function buildSegmentsFromChunks(chunks: string[], durationSec: number): TranscriptSegment[] {
  if (chunks.length === 0 || durationSec <= 0) return [];

  const wordCounts = chunks.map((chunk) => Math.max(1, countSpokenWords(chunk)));
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  let cursor = 0;

  const segments: TranscriptSegment[] = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const isLast = i === chunks.length - 1;
    const start = Number(cursor.toFixed(3));
    const end = isLast
      ? durationSec
      : Number((cursor + (wordCounts[i] / totalWords) * durationSec).toFixed(3));

    segments.push({
      id: i,
      start,
      end,
      text: chunks[i],
    });
    cursor = end;
  }

  return segments.filter((seg) => seg.text.trim().length > 0);
}

/**
 * Rebuild a gap-free segment grid from free-form script text. Each segment
 * carries at most ~two UI lines and abuts the next with no timeline holes.
 */
export function rebalanceTranscriptToVideo(text: string, durationSec: number): TranscriptSegment[] {
  const trimmed = text.trim();
  if (!trimmed || durationSec <= 0 || countSpokenWords(trimmed) < 3) return [];

  const budgetedText = trimScriptToVideoBudget(trimmed, durationSec);
  if (!budgetedText.trim()) return [];

  const sentences = splitIntoScriptBlocks(budgetedText);
  if (sentences.length === 0) return [];

  const chunks = packSentencesIntoShortChunks(sentences);
  return buildSegmentsFromChunks(chunks, durationSec);
}

/** True when `text` would take longer than the video to speak at natural rate. */
export function transcriptExceedsVideoBudget(text: string, durationSec: number): boolean {
  const trimmed = text.trim();
  if (!trimmed || durationSec <= 0) return false;
  return countSpokenWords(trimmed) > maxWordsForVideoBudget(durationSec);
}

/**
 * Trim segment text only when the full script would overrun the video at
 * natural Piper speed. Otherwise preserve the synced segment grid as-is.
 */
export function trimSegmentsIfOverVideoBudget(
  segments: TranscriptSegment[],
  totalDurationSec: number,
): TranscriptSegment[] {
  const sorted = segments
    .filter((seg) => seg.text.trim())
    .sort((a, b) => a.start - b.start || a.id - b.id);
  if (sorted.length === 0 || totalDurationSec <= 0) return [];

  const script = sorted.map((seg) => seg.text.trim()).join(" ");
  if (!transcriptExceedsVideoBudget(script, totalDurationSec)) {
    return sorted;
  }
  return rebalanceTranscriptToVideo(script, totalDurationSec);
}
