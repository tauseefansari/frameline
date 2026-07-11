import path from "path";
import fs from "fs/promises";
import {
  burnSubtitles,
  cutVideoSegment,
  exportFinalCopy,
  muxVideoWithAudio,
} from "@/lib/ffmpeg/operations";
import type { ClipRange } from "@/lib/types/studio";

/**
 * A composable, ordered chain of ffmpeg operations that share a working
 * directory. Every step writes its output back into the same temp dir under
 * a deterministic stem so debugging is straightforward, and the previous
 * step's output is the next step's input.
 *
 * Usage:
 *   const out = await new FfmpegPipeline(inputPath, workDir)
 *     .trim({ startSec, endSec })
 *     .mux(audioPath)
 *     .burnCaptions(srtPath)
 *     .run();
 *
 * Empty pipelines (no steps added) just `exportFinalCopy()` the input so the
 * caller always gets a fresh file at a predictable path.
 */
export class FfmpegPipeline {
  private steps: Array<{ name: string; run: (input: string) => Promise<string> }> = [];

  constructor(
    private readonly inputPath: string,
    private readonly workDir: string,
    private readonly ext: string = ".mp4",
  ) {}

  /** Trim to `[startSec, endSec]`. No-op if the range covers the whole clip. */
  trim(range: ClipRange): this {
    const { startSec, endSec } = range;
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec) || endSec <= startSec) {
      return this;
    }
    this.steps.push({
      name: "trim",
      run: async (input) => {
        const out = this.stagePath("trim");
        await cutVideoSegment(input, out, startSec, endSec);
        return out;
      },
    });
    return this;
  }

  /** Replace the audio track with the file at `audioPath`. */
  mux(audioPath: string | null | undefined): this {
    if (!audioPath) return this;
    this.steps.push({
      name: "mux",
      run: async (input) => {
        const out = this.stagePath("mux");
        await muxVideoWithAudio(input, audioPath, out);
        return out;
      },
    });
    return this;
  }

  /** Hard-burn the SRT at `srtPath` into the video. */
  burnCaptions(srtPath: string | null | undefined): this {
    if (!srtPath) return this;
    this.steps.push({
      name: "captions",
      run: async (input) => {
        const out = this.stagePath("captions");
        await burnSubtitles(input, srtPath, out);
        return out;
      },
    });
    return this;
  }

  /** True when no transformation steps were registered. */
  get isEmpty(): boolean {
    return this.steps.length === 0;
  }

  /**
   * Run the registered steps in order. Returns the absolute path of the
   * final output. If no steps were registered, the original input is copied
   * to the work dir under a stable name and that path is returned.
   */
  async run(): Promise<string> {
    if (this.isEmpty) {
      const out = this.stagePath("copy");
      await exportFinalCopy(this.inputPath, out);
      return out;
    }
    let current = this.inputPath;
    const intermediates: string[] = [];
    for (const step of this.steps) {
      current = await step.run(current);
      intermediates.push(current);
    }
    // Best-effort cleanup of intermediates (keep only the final output). The
    // shared temp-job dir cleanup will sweep everything anyway, so failures
    // here are non-fatal.
    const finalOut = intermediates[intermediates.length - 1];
    await Promise.all(
      intermediates.slice(0, -1).map((p) =>
        fs.unlink(p).catch(() => {
          /* ignore */
        }),
      ),
    );
    return finalOut;
  }

  private stagePath(stage: string): string {
    return path.join(this.workDir, `stage_${this.steps.length}_${stage}${this.ext}`);
  }
}
