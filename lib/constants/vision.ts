/**
 * Ollama vision model tunables. Defaults tuned for `minicpm-v:8b`
 * (MiniCPM-V 2.6) — purpose-built for single-image, multi-image, and video
 * understanding, ~5.5 GB on disk, and notably faster than qwen2.5vl on
 * CPU / integrated-GPU hosts. It also avoids the qwen2.5vl GGML_ASSERT
 * regression upstream Ollama hit in 0.21.x (see ollama#15828).
 */

/** Default Ollama HTTP endpoint. Overridden by `OLLAMA_BASE_URL`. */
export const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";

/** Default Ollama vision model tag. Overridden by `OLLAMA_VISION_MODEL`. */
export const OLLAMA_DEFAULT_VISION_MODEL = "minicpm-v:8b";

/** Slightly low temperature → less filler / repetition while still varied. */
export const OLLAMA_TEMPERATURE = 0.3;

/** Roughly 700 words of output — enough for a 5 minute clip. Acts as a
 *  floor; the provider scales `num_predict` up further based on the actual
 *  video duration so long clips don't truncate. */
export const OLLAMA_NUM_PREDICT = 1024;

/** Default context window for prompts that fit a few images + JSON.
 *  MiniCPM-V image patches eat hundreds of tokens per frame, so we keep
 *  this generous even for the "small" path. */
export const OLLAMA_NUM_CTX_DEFAULT = 8192;

/** Larger window for prompts with extra text (repoContext, many frames). */
export const OLLAMA_NUM_CTX_LARGE = 12288;

/** Threshold (in chars) above which we bump to the larger context window. */
export const OLLAMA_LARGE_CTX_THRESHOLD_CHARS = 1500;

/** Strong repeat penalty + wide window kill back-to-back duplicate clauses. */
export const OLLAMA_REPEAT_PENALTY = 1.18;
export const OLLAMA_REPEAT_LAST_N = 128;

/** Keep the model warm between requests. */
export const OLLAMA_KEEP_ALIVE = "5m";

/** Connection setup timeout — the request body itself can take minutes. */
export const OLLAMA_CONNECT_TIMEOUT_MS = 30_000;

/** Frame extractor output. Frames are scaled+padded to a fixed square canvas
 * whose side is a multiple of {@link FRAME_PATCH_SIZE_PX} so every image in
 * a batched chat call shares identical dimensions and aligns with the vision
 * model's patch size — required by qwen2.5vl, harmless for minicpm-v.
 * JPEG quality is FFmpeg's `-q:v` (lower = better, 2-5 is the sweet spot
 * for vision-LLM input). */
export const FRAME_LONG_EDGE_PX = 672;
export const FRAME_PATCH_SIZE_PX = 28;
export const FRAME_JPEG_QUALITY = 4;

/** N-gram width used to filter near-duplicate clauses out of the model's reply. */
export const DEDUPE_NGRAM_WORDS = 4;
export const DEDUPE_LOOKBACK_SENTENCES = 5;
