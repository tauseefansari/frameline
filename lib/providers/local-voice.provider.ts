import { createTempJobDir } from "@/lib/api/temp-session";
import { generateVideoScriptViaOllama } from "@/lib/providers/ollama.provider";
import { synthesizeWithPiper } from "@/lib/providers/piper.provider";
import type { VoiceProvider } from "@/lib/types/providers";

/**
 * Concrete voice provider backed entirely by local models:
 * - Ollama (vision LLM) for script generation
 * - Piper for text-to-speech
 *
 * Each capability uses a short-lived temp dir for its own intermediates so
 * the route handlers don't need to micromanage scratch paths per provider.
 */
export function createLocalVoiceProvider(): VoiceProvider {
  return {
    synthesize: async ({ text, voice, format }) => {
      const { dir, cleanup } = await createTempJobDir();
      try {
        return await synthesizeWithPiper({ text, voice, format, workDir: dir });
      } finally {
        await cleanup();
      }
    },

    generateVideoScript: ({ frames, durationSec, tone, customTone, language, repoContext }) =>
      generateVideoScriptViaOllama({
        frames,
        durationSec,
        tone,
        customTone,
        language,
        repoContext,
      }),
  };
}
