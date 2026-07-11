/**
 * Piper voice presets bundled by `scripts/setup-models.mjs`. Each id maps to
 * a single `<modelName>.onnx` (+ `.onnx.json`) under `PIPER_VOICES_DIR`.
 *
 * Keep this list in sync with the `PIPER_VOICES` table in the setup script
 * and the `voices.*` keys in every `locales/<lang>/studio.json`.
 */

export enum PiperVoiceId {
  Amy = "amy",
  Ryan = "ryan",
  Alan = "alan",
  Jenny = "jenny",
  Lessac = "lessac",
  Kathleen = "kathleen",
  Joe = "joe",
  John = "john",
  Norman = "norman",
  Ljspeech = "ljspeech",
  Alba = "alba",
  Cori = "cori",
}

/** Map UI voice id → Piper `.onnx` filename stem (without extension). */
export const PIPER_VOICE_MODELS: Record<PiperVoiceId, string> = {
  [PiperVoiceId.Amy]: "en_US-amy-medium",
  [PiperVoiceId.Ryan]: "en_US-ryan-high",
  [PiperVoiceId.Alan]: "en_GB-alan-medium",
  [PiperVoiceId.Jenny]: "en_GB-jenny_dioco-medium",
  [PiperVoiceId.Lessac]: "en_US-lessac-medium",
  [PiperVoiceId.Kathleen]: "en_US-kathleen-low",
  [PiperVoiceId.Joe]: "en_US-joe-medium",
  [PiperVoiceId.John]: "en_US-john-medium",
  [PiperVoiceId.Norman]: "en_US-norman-medium",
  [PiperVoiceId.Ljspeech]: "en_US-ljspeech-high",
  [PiperVoiceId.Alba]: "en_GB-alba-medium",
  [PiperVoiceId.Cori]: "en_GB-cori-high",
};

export const PIPER_VOICE_IDS = Object.values(PiperVoiceId) as PiperVoiceId[];

export function isPiperVoiceId(id: string): id is PiperVoiceId {
  return (PIPER_VOICE_IDS as readonly string[]).includes(id);
}

export function getPiperVoiceModelStem(id: PiperVoiceId): string {
  return PIPER_VOICE_MODELS[id];
}
