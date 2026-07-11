import { createLocalVoiceProvider } from "@/lib/providers/local-voice.provider";
import { AppError, AppErrorCode } from "@/lib/errors/app-error";
import { ApiDownloadKey, getDownloadBasename } from "@/lib/i18n/api-download-label";
import { isPiperVoiceId } from "@/lib/constants/piper-voices";
import { TtsFormat } from "@/lib/types/studio";
import { ttsBodySchema } from "@/lib/validation/api";
import { handleRoute } from "@/lib/api/route-helpers";

export async function POST(req: Request) {
  return handleRoute(req, async ({ locale }) => {
    const json: unknown = await req.json();
    const parsed = ttsBodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(400, AppErrorCode.ValidationError);
    }
    const { text, voice, format } = parsed.data;
    if (!isPiperVoiceId(voice)) {
      throw new AppError(400, AppErrorCode.BadVoice);
    }

    const provider = createLocalVoiceProvider();
    const audio = await provider.synthesize({ text, voice, format });

    const stem = await getDownloadBasename(locale, ApiDownloadKey.Voice);
    const contentType = format === TtsFormat.Wav ? "audio/wav" : "audio/mpeg";

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${stem}.${format}"`,
      },
    });
  });
}
