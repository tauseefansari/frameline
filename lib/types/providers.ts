import type { TranscriptResult, TtsFormat, ScriptTone } from "@/lib/types/studio";

/**
 * Capability surface of a local voice/script provider. Implemented by
 * `createLocalVoiceProvider()` which delegates to Piper (TTS) and Ollama
 * (vision script generation).
 */
export interface VoiceProvider {
  synthesize(input: {
    text: string;
    voice: string;
    model?: string;
    format: TtsFormat;
  }): Promise<Buffer>;
  generateVideoScript(input: {
    frames: Array<{ base64Jpeg: string; atSec: number }>;
    durationSec: number;
    tone?: ScriptTone;
    /** Free-text tone override used when tone === ScriptTone.Custom. */
    customTone?: string;
    language?: string;
    /** Truncated README fetched from the user's GitHub repo for extra context. */
    repoContext?: string;
  }): Promise<TranscriptResult>;
}
