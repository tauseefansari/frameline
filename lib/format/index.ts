import { countSpokenWords } from "@/lib/format/speech-budget";

/** Format `seconds` as `HH:MM:SS` (or `MM:SS` if < 1h). NaN/negative -> "00:00". */
export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Format bytes -> "1.4" (megabytes, 1 decimal). */
export function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

/** Trigger a download for a given Blob. Browser-only. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export {
  rebalanceTranscriptToVideo,
  transcriptExceedsVideoBudget,
} from "@/lib/format/speech-budget";

/** Naive word count for transcript editor. */
export function countWords(text: string): number {
  return countSpokenWords(text);
}
