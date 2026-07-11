import fs from "fs/promises";
import path from "path";
import { getFfmpeg } from "@/lib/ffmpeg/ffmpeg";
import { FRAME_JPEG_QUALITY, FRAME_LONG_EDGE_PX } from "@/lib/constants/vision";
import {
  MP3_BITRATE,
  SPEECH_COMPOSE_EPSILON_SEC,
  VOICEOVER_CHANNEL_COUNT,
} from "@/lib/constants/audio";
import {
  MIN_SEGMENT_DURATION_SEC,
  INTRO_BLACK_LUMA_MAX,
  INTRO_PROBE_SEC,
} from "@/lib/constants/transcript";
import { maxSpeechDurationSec, speechStretchTempo } from "@/lib/format/speech-budget";

export async function cutVideoSegment(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
): Promise<void> {
  const duration = Math.max(0.1, endSec - startSec);

  const tryCopy = () =>
    new Promise<void>((resolve, reject) => {
      getFfmpeg()(inputPath)
        .setStartTime(startSec)
        .setDuration(duration)
        .outputOptions("-c", "copy")
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });

  const tryReencode = () =>
    new Promise<void>((resolve, reject) => {
      getFfmpeg()(inputPath)
        .setStartTime(startSec)
        .setDuration(duration)
        .videoCodec("libx264")
        .audioCodec("aac")
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });

  try {
    await tryCopy();
  } catch {
    await tryReencode();
  }
}

export async function muxVideoWithAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string,
): Promise<void> {
  const [videoDur, audioDur] = await Promise.all([
    getMediaDurationSec(videoPath),
    getMediaDurationSec(audioPath),
  ]);
  const maxSpeechSec = maxSpeechDurationSec(videoDur);
  const needsVideoPad =
    audioDur > videoDur + SPEECH_COMPOSE_EPSILON_SEC &&
    audioDur <= maxSpeechSec + SPEECH_COMPOSE_EPSILON_SEC;

  if (needsVideoPad) {
    const padDurSec = audioDur - videoDur;
    await muxVideoWithAudioPaddedVideo(videoPath, audioPath, outputPath, padDurSec);
    return;
  }

  const tryFast = () =>
    new Promise<void>((resolve, reject) => {
      getFfmpeg()()
        .input(videoPath)
        .input(audioPath)
        .outputOptions("-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-shortest")
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });

  const trySafe = () =>
    new Promise<void>((resolve, reject) => {
      getFfmpeg()()
        .input(videoPath)
        .input(audioPath)
        .outputOptions(
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          "-shortest",
        )
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });

  try {
    await tryFast();
  } catch {
    await trySafe();
  }
}

/** Hold the final video frame so voiceover within the fill margin plays through. */
function muxVideoWithAudioPaddedVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  padDurSec: number,
): Promise<void> {
  const pad = Math.max(0.05, padDurSec).toFixed(3);
  return new Promise((resolve, reject) => {
    getFfmpeg()()
      .input(videoPath)
      .input(audioPath)
      .complexFilter(`[0:v]tpad=stop_mode=clone:stop_duration=${pad}[vpadded]`)
      .outputOptions(
        "-map",
        "[vpadded]",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-c:a",
        "aac",
        "-shortest",
      )
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });
}

export function exportFinalCopy(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getFfmpeg()(inputPath)
      .outputOptions("-c", "copy")
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });
}

/**
 * Burn the supplied SRT subtitle file into the video as hard-coded captions.
 * Re-encodes video (subtitles filter requires a full pipeline); audio is
 * stream-copied. The subtitle path must be ASCII-safe — callers should keep
 * it inside the temp working directory.
 */
export function burnSubtitles(
  videoPath: string,
  srtPath: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // ffmpeg filter graph needs colons, backslashes and single quotes escaped.
    const escaped = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");

    // ASS files carry all style information internally — use the `ass` filter
    // directly. For legacy SRT files fall back to subtitles + force_style.
    const isAss = srtPath.toLowerCase().endsWith(".ass");
    let videoFilter: string;
    if (isAss) {
      videoFilter = `ass='${escaped}'`;
    } else {
      const style = [
        "FontName=Arial",
        "FontSize=16",
        "PrimaryColour=&H00FFFFFF",
        "BackColour=&H00000000",
        "BorderStyle=3",
        "Outline=0",
        "Shadow=0",
        "Bold=1",
        "Alignment=2",
        "MarginV=28",
        "WrapStyle=2",
      ].join(",");
      videoFilter = `subtitles='${escaped}':force_style='${style}'`;
    }

    getFfmpeg()(videoPath)
      .videoFilter(videoFilter)
      .outputOptions(
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
      )
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });
}

/** Returns the duration in seconds of a media file using ffprobe. */
export function getMediaDurationSec(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    getFfmpeg().ffprobe(inputPath, (err, data) => {
      if (err) return reject(err);
      const dur = data?.format?.duration !== undefined ? Number(data.format.duration) : 0;
      resolve(Number.isFinite(dur) ? dur : 0);
    });
  });
}

/**
 * Extracts `count` JPEG frames evenly spaced across the video's duration.
 * Returns the absolute paths of the extracted frames in chronological order.
 * Optional `startSec` skips a leading silent / black intro so the model only
 * sees frames with real content.
 */
export async function extractEvenlySpacedFrames(
  inputPath: string,
  outputDir: string,
  count: number,
  options?: { startSec?: number },
): Promise<{ paths: string[]; timestamps: number[]; durationSec: number }> {
  const durationSec = await getMediaDurationSec(inputPath);
  const safeCount = Math.max(1, Math.floor(count));
  const startSec = Math.max(0, options?.startSec ?? 0);
  const sampleStart = Math.min(startSec, Math.max(0, durationSec - 0.5));
  const sampleSpan = Math.max(0.5, durationSec - sampleStart);
  // Sample at the midpoint of each evenly-divided segment to avoid the
  // very-first / very-last frames which are often blank or fade frames.
  const timestamps = Array.from({ length: safeCount }, (_, i) => {
    const t = sampleStart + ((i + 0.5) / safeCount) * sampleSpan;
    return Math.min(Math.max(0, t), Math.max(0, durationSec - 0.05));
  });

  const paths: string[] = await Promise.all(
    timestamps.map(
      (ts, i) =>
        new Promise<string>((resolve, reject) => {
          const out = path.join(outputDir, `frame_${String(i).padStart(3, "0")}.jpg`);
          getFfmpeg()(inputPath)
            .seekInput(ts)
            .outputOptions(
              "-frames:v",
              "1",
              "-vf",
              // Scale + pad to a fixed square canvas so every frame in the
              // batch has identical dimensions, with sides that are a multiple
              // of the vision model's patch size. Padding (not cropping)
              // preserves the full source content.
              `scale=${FRAME_LONG_EDGE_PX}:${FRAME_LONG_EDGE_PX}:force_original_aspect_ratio=decrease,pad=${FRAME_LONG_EDGE_PX}:${FRAME_LONG_EDGE_PX}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`,
              "-q:v",
              String(FRAME_JPEG_QUALITY),
            )
            .on("end", () => resolve(out))
            .on("error", (err: Error) => reject(err))
            .save(out);
        }),
    ),
  );
  return { paths, timestamps, durationSec };
}

/**
 * Quick probe of the first {@link INTRO_PROBE_SEC} seconds: returns the
 * timestamp where actual content begins. Looks for the first non-black
 * frame using the `blackdetect` filter; falls back to 0 on any failure so
 * callers always get a usable value.
 */
export function detectContentStartSec(
  inputPath: string,
  probeSec: number = INTRO_PROBE_SEC,
): Promise<number> {
  return new Promise((resolve) => {
    let stderrLog = "";
    const cmd = getFfmpeg()(inputPath)
      .outputOptions(
        "-t",
        String(probeSec),
        "-vf",
        `blackdetect=d=0.05:pix_th=${INTRO_BLACK_LUMA_MAX.toFixed(2)}`,
        "-an",
        "-f",
        "null",
      )
      .on("stderr", (line: string) => {
        stderrLog += `${line}\n`;
      })
      .on("end", () => {
        // Look for `black_end:<float>` markers; the largest one within the
        // probe window is when content actually starts.
        const matches = [...stderrLog.matchAll(/black_end:([0-9.]+)/g)];
        if (matches.length === 0) {
          resolve(0);
          return;
        }
        const lastEnd = Number(matches[matches.length - 1][1]);
        if (!Number.isFinite(lastEnd) || lastEnd <= 0) {
          resolve(0);
          return;
        }
        resolve(Math.min(lastEnd, probeSec));
      })
      .on("error", () => resolve(0));
    // ffmpeg-static needs an output target even for `-f null`.
    cmd.save(process.platform === "win32" ? "NUL" : "/dev/null");
  });
}

export type SequentialVoiceoverClip = {
  clipPath: string;
  playDurationSec: number;
};

/** Build an ffmpeg `atempo` chain — each stage must stay within 0.5..2.0. */
function buildAtempoChain(inputLabel: string, outputLabel: string, tempo: number): string {
  const stages: number[] = [];
  let remaining = tempo;
  while (remaining < 0.5 - SPEECH_COMPOSE_EPSILON_SEC) {
    stages.push(0.5);
    remaining /= 0.5;
  }
  stages.push(remaining);

  if (stages.length === 1) {
    return `[${inputLabel}]atempo=${stages[0].toFixed(4)}[${outputLabel}]`;
  }

  const parts: string[] = [];
  let current = inputLabel;
  for (let i = 0; i < stages.length; i += 1) {
    const next = i === stages.length - 1 ? outputLabel : `t${i}`;
    parts.push(`[${current}]atempo=${stages[i].toFixed(4)}[${next}]`);
    current = next;
  }
  return parts.join(";");
}

/**
 * Concatenate speech clips back-to-back with no silence gaps between segments.
 * When `padToSec` is set, stretch slightly short speech to the video length or
 * pad trailing silence when the script is far too short.
 */
export function composeSequentialVoiceover(
  clips: SequentialVoiceoverClip[],
  outputPath: string,
  padToSec?: number,
): Promise<void> {
  if (clips.length === 0) {
    return Promise.reject(new Error("No voiceover clips to compose."));
  }

  return new Promise((resolve, reject) => {
    const cmd = getFfmpeg()();
    const filterParts: string[] = [];
    const concatLabels: string[] = [];
    let inputIdx = 0;

    for (const clip of clips) {
      const playDurationSec = Math.max(MIN_SEGMENT_DURATION_SEC, clip.playDurationSec);
      cmd.input(clip.clipPath);
      filterParts.push(
        `[${inputIdx}]atrim=end=${playDurationSec.toFixed(3)},asetpts=PTS-STARTPTS[c${inputIdx}]`,
      );
      concatLabels.push(`[c${inputIdx}]`);
      inputIdx += 1;
    }

    const filter =
      `${filterParts.join(";")};${concatLabels.join("")}` +
      `concat=n=${concatLabels.length}:v=0:a=1[out]`;

    const shouldFit =
      padToSec != null && Number.isFinite(padToSec) && padToSec > MIN_SEGMENT_DURATION_SEC;
    const totalSpeechSec = clips.reduce(
      (sum, clip) => sum + Math.max(MIN_SEGMENT_DURATION_SEC, clip.playDurationSec),
      0,
    );

    let finalFilter = filter;
    let outputLabel = "out";

    if (shouldFit && padToSec != null) {
      const maxSpeechSec = maxSpeechDurationSec(padToSec);
      if (totalSpeechSec > maxSpeechSec + SPEECH_COMPOSE_EPSILON_SEC) {
        finalFilter = `${filter};[out]atrim=end=${maxSpeechSec.toFixed(3)}[fitted]`;
        outputLabel = "fitted";
      } else {
        const stretchTempo = speechStretchTempo(totalSpeechSec, padToSec);
        if (stretchTempo != null) {
          finalFilter = `${filter};${buildAtempoChain("out", "fitted", stretchTempo)}`;
          outputLabel = "fitted";
        } else if (totalSpeechSec < padToSec - SPEECH_COMPOSE_EPSILON_SEC) {
          finalFilter = `${filter};[out]apad=whole_dur=${padToSec.toFixed(3)}[fitted]`;
          outputLabel = "fitted";
        }
      }
    }

    cmd
      .complexFilter(finalFilter, outputLabel)
      .audioCodec("libmp3lame")
      .audioBitrate(MP3_BITRATE)
      .outputOptions("-ac", String(VOICEOVER_CHANNEL_COUNT))
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });
}

/** Trim an audio file to `[startSec, endSec]`, re-encoding to MP3. */
export function trimAudio(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
): Promise<void> {
  const duration = Math.max(0.05, endSec - startSec);
  return new Promise((resolve, reject) => {
    getFfmpeg()(inputPath)
      .setStartTime(startSec)
      .setDuration(duration)
      .audioCodec("libmp3lame")
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });
}

/**
 * Concatenates the given inputs in the provided order. Re-encodes through the
 * concat filter so mixed codecs/resolutions still merge cleanly. Falls back to
 * a video-only concat if any input lacks an audio track.
 */
export async function concatVideos(inputPaths: string[], outputPath: string): Promise<void> {
  if (inputPaths.length === 0) {
    throw new Error("No inputs to concatenate.");
  }
  if (inputPaths.length === 1) {
    await fs.copyFile(inputPaths[0], outputPath);
    return;
  }

  const buildFilter = (withAudio: boolean) => {
    const parts = inputPaths
      .map((_, i) => (withAudio ? `[${i}:v:0][${i}:a:0]` : `[${i}:v:0]`))
      .join("");
    const map = withAudio ? "[v][a]" : "[v]";
    const concat = `${parts}concat=n=${inputPaths.length}:v=1:a=${withAudio ? 1 : 0}${map}`;
    return concat;
  };

  const tryConcat = (withAudio: boolean) =>
    new Promise<void>((resolve, reject) => {
      const cmd = getFfmpeg()();
      inputPaths.forEach((p) => cmd.input(p));
      cmd
        .complexFilter([buildFilter(withAudio)])
        .outputOptions(
          "-map",
          "[v]",
          ...(withAudio ? ["-map", "[a]"] : []),
          "-c:v",
          "libx264",
          ...(withAudio ? ["-c:a", "aac"] : []),
          "-movflags",
          "+faststart",
        )
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });

  try {
    await tryConcat(true);
  } catch {
    await tryConcat(false);
  }
}
