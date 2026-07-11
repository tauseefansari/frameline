import path from "path";
import { writeBufferToFile } from "@/lib/api/temp-session";
import { cutVideoSegment } from "@/lib/ffmpeg/operations";
import { AppError, AppErrorCode } from "@/lib/errors/app-error";
import { ApiDownloadKey, getDownloadBasename } from "@/lib/i18n/api-download-label";
import { cutBodySchema } from "@/lib/validation/api";
import {
  fileExt,
  handleRoute,
  readAsDownloadResponse,
  readFileFromForm,
} from "@/lib/api/route-helpers";

export async function POST(req: Request) {
  return handleRoute(req, async ({ locale, createDir }) => {
    const formData = await req.formData();
    const { file, buffer } = await readFileFromForm(formData);

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
    const outputPath = path.join(dir, `cut${ext}`);
    await writeBufferToFile(inputPath, buffer);
    await cutVideoSegment(inputPath, outputPath, startSec, endSec);

    const stem = await getDownloadBasename(locale, ApiDownloadKey.Cut);
    return readAsDownloadResponse(outputPath, `${stem}${ext}`);
  });
}
