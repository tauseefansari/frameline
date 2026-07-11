import path from "path";
import { z } from "zod";
import { writeBufferToFile } from "@/lib/api/temp-session";
import { concatVideos, cutVideoSegment } from "@/lib/ffmpeg/operations";
import { AppError, AppErrorCode } from "@/lib/errors/app-error";
import { ApiDownloadKey, getDownloadBasename } from "@/lib/i18n/api-download-label";
import { MAX_CONCAT_FILES, MAX_UPLOAD_BYTES } from "@/lib/constants/api";
import { handleRoute, isVideoMime, readAsDownloadResponse } from "@/lib/api/route-helpers";

const rangesSchema = z
  .array(
    z
      .object({
        startSec: z.coerce.number().min(0),
        endSec: z.coerce.number().min(0),
      })
      .nullable(),
  )
  .optional();

export async function POST(req: Request) {
  return handleRoute(req, async ({ locale, createDir }) => {
    const formData = await req.formData();
    const files = formData.getAll("videos").filter((v): v is File => v instanceof File);

    if (files.length < 2) {
      throw new AppError(400, AppErrorCode.MissingVideo);
    }
    if (files.length > MAX_CONCAT_FILES) {
      throw new AppError(413, AppErrorCode.TooManyFiles);
    }

    let totalBytes = 0;
    for (const f of files) {
      if (!isVideoMime(f.type)) {
        throw new AppError(400, AppErrorCode.BadMime);
      }
      totalBytes += f.size;
    }
    if (totalBytes > MAX_UPLOAD_BYTES) {
      throw new AppError(413, AppErrorCode.PayloadTooLarge);
    }

    // Optional per-clip trim ranges as JSON, indexed parallel to `files`.
    const rangesRaw = formData.get("ranges");
    let parsedRanges: z.infer<typeof rangesSchema> = undefined;
    if (typeof rangesRaw === "string" && rangesRaw.length > 0) {
      const json = JSON.parse(rangesRaw);
      const result = rangesSchema.safeParse(json);
      if (!result.success) {
        throw new AppError(400, AppErrorCode.ValidationError);
      }
      parsedRanges = result.data;
    }

    const dir = await createDir();
    const inputPaths: string[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      const ext = path.extname(f.name) || ".mp4";
      const idx = String(i).padStart(2, "0");
      const raw = path.join(dir, `input_${idx}${ext}`);
      const buf = Buffer.from(await f.arrayBuffer());
      await writeBufferToFile(raw, buf);

      const range = parsedRanges?.[i];
      if (range && range.endSec > range.startSec) {
        const trimmed = path.join(dir, `trim_${idx}${ext}`);
        await cutVideoSegment(raw, trimmed, range.startSec, range.endSec);
        inputPaths.push(trimmed);
      } else {
        inputPaths.push(raw);
      }
    }

    const outputPath = path.join(dir, "merged.mp4");
    await concatVideos(inputPaths, outputPath);

    const stem = await getDownloadBasename(locale, ApiDownloadKey.Concat);
    return readAsDownloadResponse(outputPath, `${stem}.mp4`);
  });
}
