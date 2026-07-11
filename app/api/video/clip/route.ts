import path from "path";
import fs from "fs/promises";
import { writeBufferToFile } from "@/lib/api/temp-session";
import { cutVideoSegment } from "@/lib/ffmpeg/operations";
import { AppError, AppErrorCode } from "@/lib/errors/app-error";
import { cutBodySchema } from "@/lib/validation/api";
import { fileExt, handleRoute, readFileFromForm } from "@/lib/api/route-helpers";

/**
 * "Clip on the fly": trims a sub-range out of an uploaded video and streams
 * the result back inline as `video/mp4` for immediate playback in the
 * browser. Unlike `/api/video/cut`, the response is NOT marked as an
 * attachment, so the studio can hand the Blob straight to a `<video>` tag
 * (or stage it in the clip library) without a download dialog.
 *
 * Body (multipart):
 *   - video      (required) source clip
 *   - startSec   (required) trim start in seconds
 *   - endSec     (required) trim end in seconds (must be > startSec)
 */
export async function POST(req: Request) {
  return handleRoute(req, async ({ createDir }) => {
    const formData = await req.formData();
    const { file, buffer } = await readFileFromForm(formData, { requireVideoMime: true });

    const parsed = cutBodySchema.safeParse({
      startSec: formData.get("startSec"),
      endSec: formData.get("endSec"),
    });
    if (!parsed.success) {
      throw new AppError(400, AppErrorCode.ValidationError);
    }
    const { startSec, endSec } = parsed.data;
    if (endSec <= startSec) {
      throw new AppError(400, AppErrorCode.BadRange);
    }

    const dir = await createDir();
    const ext = fileExt(file);
    const inputPath = path.join(dir, `input${ext}`);
    const outputPath = path.join(dir, `clip${ext}`);
    await writeBufferToFile(inputPath, buffer);
    await cutVideoSegment(inputPath, outputPath, startSec, endSec);

    const bytes = await fs.readFile(outputPath);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "video/mp4",
        // Inline disposition so the browser keeps the blob in-memory rather
        // than offering it as a download — the studio wires the result into
        // its clip library and plays it directly.
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
      },
    });
  });
}
