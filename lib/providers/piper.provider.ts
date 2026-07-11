import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { getPiperBin, getPiperVoicesDir } from "@/lib/config/env";
import { getPiperVoiceModelStem, isPiperVoiceId, PiperVoiceId } from "@/lib/constants/piper-voices";
import { TtsFormat } from "@/lib/types/studio";
import { getFfmpeg } from "@/lib/ffmpeg/ffmpeg";
import { MP3_BITRATE } from "@/lib/constants/audio";

async function ensureFileExists(file: string, label: string): Promise<void> {
  try {
    await fs.access(file);
  } catch {
    throw new Error(
      `${label} not found at ${file}. Run \`npm run setup:models\` to install the local model stack.`,
    );
  }
}

/** Convert a WAV file to MP3 using the bundled ffmpeg binary. */
function wavToMp3(inputWav: string, outputMp3: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getFfmpeg()(inputWav)
      .audioCodec("libmp3lame")
      .audioBitrate(MP3_BITRATE)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outputMp3);
  });
}

/**
 * Synthesize speech locally with Piper. We invoke the CLI directly (text in
 * via stdin, WAV bytes to a temp file), then optionally transcode to MP3.
 *
 * Piper voices are downloaded by `scripts/setup-models.mjs` into
 * `models/piper/voices/<stem>.onnx` (+ `.onnx.json`).
 */
export async function synthesizeWithPiper(input: {
  text: string;
  voice: string;
  format: TtsFormat;
  workDir: string;
}): Promise<Buffer> {
  if (!isPiperVoiceId(input.voice)) {
    throw new Error(`Unknown Piper voice: ${input.voice}`);
  }
  const voiceId = input.voice as PiperVoiceId;
  const stem = getPiperVoiceModelStem(voiceId);
  const bin = getPiperBin();
  const voicesDir = getPiperVoicesDir();
  const modelPath = path.join(voicesDir, `${stem}.onnx`);

  await ensureFileExists(bin, "Piper binary");
  await ensureFileExists(modelPath, `Piper voice ${stem}`);

  const wavOut = path.join(input.workDir, `piper-${Date.now()}.wav`);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(bin, ["--model", modelPath, "--output_file", wavOut], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`piper exited with code ${code}: ${stderr.slice(-400)}`));
    });
    proc.stdin.write(input.text);
    proc.stdin.end();
  });

  if (input.format === TtsFormat.Wav) {
    return fs.readFile(wavOut);
  }
  const mp3Out = path.join(input.workDir, `piper-${Date.now()}.mp3`);
  await wavToMp3(wavOut, mp3Out);
  return fs.readFile(mp3Out);
}
