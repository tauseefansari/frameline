import type { TranscriptSegment } from "@/lib/types/studio";
import {
  ASS_FONT_SIZE,
  ASS_MARGIN_H,
  ASS_MARGIN_V,
  ASS_OUTLINE,
  ASS_PLAY_RES_X,
  ASS_PLAY_RES_Y,
  CAPTION_LINE_CHAR_LIMIT,
  CAPTION_MAX_LINES,
  CAPTION_MIN_DURATION_SEC,
} from "@/lib/constants/captions";

/** Format a number of seconds as `HH:MM:SS,mmm` (SRT timestamp format). */
function formatSrtTimestamp(sec: number): string {
  const safe = Math.max(0, sec);
  const ms = Math.floor((safe - Math.floor(safe)) * 1000);
  const totalSec = Math.floor(safe);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Wrap text to at most `maxLines` lines where each line is at most
 * `charsPerLine` characters, breaking on word boundaries.
 */
function wrapToLines(
  text: string,
  charsPerLine = CAPTION_LINE_CHAR_LIMIT,
  maxLines = CAPTION_MAX_LINES,
): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi];
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= charsPerLine) {
      current += " " + word;
    } else {
      lines.push(current);
      if (lines.length >= maxLines) {
        // Already at max lines — append remaining words onto the last line.
        lines[lines.length - 1] += " " + words.slice(wi).join(" ");
        current = "";
        break;
      }
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines).join("\n");
}

/**
 * Convert transcript segments to a SubRip (.srt) string. Empty / zero-length
 * entries are skipped so ffmpeg doesn't choke on them.
 */
export function segmentsToSrt(segments: TranscriptSegment[]): string {
  const lines: string[] = [];
  let index = 1;
  for (const seg of segments) {
    const text = wrapToLines((seg.text ?? "").trim());
    if (!text) continue;
    const start = Number.isFinite(seg.start) ? seg.start : 0;
    const end = Number.isFinite(seg.end) ? seg.end : start + CAPTION_MIN_DURATION_SEC;
    if (end <= start) continue;
    lines.push(String(index));
    lines.push(`${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}`);
    lines.push(text);
    lines.push("");
    index += 1;
  }
  return lines.join("\n");
}

/** Format a number of seconds as `H:MM:SS.cc` (ASS timestamp, centiseconds). */
function formatAssTimestamp(sec: number): string {
  const safe = Math.max(0, sec);
  const cs = Math.floor((safe % 1) * 100);
  const totalSec = Math.floor(safe);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad2 = (n: number) => n.toString().padStart(2, "0");
  return `${h}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
}

/**
 * Convert transcript segments to an ASS (Advanced SubStation Alpha) subtitle
 * file with YouTube-style caption styling. PlayResX/PlayResY are fixed at
 * 1920×1080 so libass scales the font proportionally at any video resolution.
 */
export function segmentsToAss(segments: TranscriptSegment[]): string {
  // BorderStyle=3 → opaque box background. PrimaryColour &H00FFFFFF = white,
  // BackColour &H00000000 = opaque black. Sizes scale via PlayRes so libass
  // produces the same box at any output resolution.
  const styleLine = `Style: Default,Arial,${ASS_FONT_SIZE},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,3,${ASS_OUTLINE},0,2,${ASS_MARGIN_H},${ASS_MARGIN_H},${ASS_MARGIN_V},1`;
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${ASS_PLAY_RES_X}`,
    `PlayResY: ${ASS_PLAY_RES_Y}`,
    "WrapStyle: 0",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    styleLine,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ].join("\n");

  const dialogues: string[] = [];
  for (const seg of segments) {
    const text = (seg.text ?? "").trim();
    if (!text) continue;
    const start = Number.isFinite(seg.start) ? seg.start : 0;
    const end = Number.isFinite(seg.end) ? seg.end : start + CAPTION_MIN_DURATION_SEC;
    if (end <= start) continue;
    dialogues.push(
      `Dialogue: 0,${formatAssTimestamp(start)},${formatAssTimestamp(end)},Default,,0,0,0,,${text}`,
    );
  }

  return [header, ...dialogues, ""].join("\n");
}
