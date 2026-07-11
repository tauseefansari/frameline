/** API-level limits enforced by Zod schemas + route helpers. */

/** Per-file upload size cap (bytes). 200 MB. */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

/** Per-batch cap for the concat endpoint. */
export const MAX_CONCAT_FILES = 8;

/** Max characters accepted by `/api/tts` in a single request. */
export const MAX_TTS_TEXT_LENGTH = 4096;

/** Max number of transcript segments accepted by `/api/tts/sync`. */
export const MAX_SYNC_SEGMENTS = 200;

/** Min/max language code length used by `/api/script`. */
export const LANGUAGE_CODE_MIN = 2;
export const LANGUAGE_CODE_MAX = 8;
