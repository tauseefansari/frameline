import { Agent, fetch as undiciFetch } from "undici";
import { getServerEnv } from "@/lib/config/env";
import { type TranscriptResult, type TranscriptSegment, ScriptTone } from "@/lib/types/studio";
import {
  DEDUPE_LOOKBACK_SENTENCES,
  DEDUPE_NGRAM_WORDS,
  OLLAMA_CONNECT_TIMEOUT_MS,
  OLLAMA_KEEP_ALIVE,
  OLLAMA_LARGE_CTX_THRESHOLD_CHARS,
  OLLAMA_NUM_CTX_DEFAULT,
  OLLAMA_NUM_CTX_LARGE,
  OLLAMA_NUM_PREDICT,
  OLLAMA_REPEAT_LAST_N,
  OLLAMA_REPEAT_PENALTY,
  OLLAMA_TEMPERATURE,
} from "@/lib/constants/vision";
import { MIN_SEGMENT_DURATION_SEC } from "@/lib/constants/transcript";
import { countSpokenWords, rebalanceTranscriptToVideo } from "@/lib/format/speech-budget";
import {
  buildOllamaTranscriptPrompt,
  buildOllamaWordCountRetryPrompt,
  OLLAMA_TRANSCRIPT_SYSTEM_PROMPT,
  resolveTranscriptWordBudget,
} from "@/lib/studio/transcript-prompt";

/** Subset of Ollama's chat API surface that we actually use. */
type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  /** Base64-encoded JPEG/PNG frames; consumed only on `user` messages. */
  images?: string[];
};
type OllamaChatResponse = {
  message?: { role?: string; content?: string };
};

/**
 * Local Ollama inference can take several minutes on CPU-only hosts (vision
 * weights are multi-GB and the first request triggers a cold load). undici's
 * default 5-minute headers timeout aborts those long calls mid-flight, so we
 * keep a single long-timeout dispatcher and reuse it for every request.
 */
let ollamaDispatcher: Agent | null = null;
function getOllamaDispatcher(): Agent {
  if (ollamaDispatcher) return ollamaDispatcher;
  ollamaDispatcher = new Agent({
    headersTimeout: 0, // wait indefinitely for the first byte
    bodyTimeout: 0, // wait indefinitely for the response body
    connectTimeout: OLLAMA_CONNECT_TIMEOUT_MS,
  });
  return ollamaDispatcher;
}

type ScriptJsonShape = {
  language?: string;
  segments?: Array<{ start?: number; end?: number; text?: string }>;
};

function safeParseScriptJson(raw: string): ScriptJsonShape {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  // Some models wrap their JSON inside prose; try to pull the first {...} block.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as ScriptJsonShape;
    } catch {
      /* fall through */
    }
  }
  try {
    return JSON.parse(cleaned) as ScriptJsonShape;
  } catch {
    return {};
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Strip parenthetical / bracketed stage directions and markdown markers
 * (`**bold**`, `__bold__`, `*em*`) that the vision model keeps emitting
 * ("(Visual: ...)", "**Welcome**", etc.) despite the prompt. These would
 * otherwise be spoken verbatim by Piper, padding the runtime with awkward
 * filler and inflating the word count.
 *
 * Also handles UNCLOSED stage directions — the model frequently truncates
 * mid-segment and emits `(Visuals shift focus on …` with no closing `)`,
 * which the balanced-pair regex would otherwise miss and Piper would read
 * out loud as "open paren visuals shift focus".
 */
function stripStageDirections(text: string): string {
  return text
    .replace(/\([^()]*\)/g, " ") // balanced (Visual: ...)
    .replace(/\[[^\]]*\]/g, " ") // balanced [scene ...]
    .replace(/\([^()]*$/g, " ") // unclosed "(foo bar..." at end
    .replace(/^[^()]*\)/g, " ") // dangling "...foo)" at start
    .replace(/\[[^\]]*$/g, " ")
    .replace(/^[^\[\]]*\]/g, " ")
    .replace(/\*\*+|__+/g, "") // **bold** / __bold__
    .replace(/(^|\s)\*(?=\S)|(?<=\S)\*(\s|$)/g, "$1$2") // stray *italics*
    .replace(/\s+/g, " ")
    .trim();
}

/** Total spoken-word count across a transcript, used to detect shortfalls. */
function countSegmentWords(segments: TranscriptSegment[]): number {
  return countSpokenWords(segments.map((s) => s.text).join(" "));
}

/**
 * Drop sentences that repeat a previously-used clause. We compare both whole
 * sentences (case-insensitive) AND any {@link DEDUPE_NGRAM_WORDS}-word
 * shingle within the last {@link DEDUPE_LOOKBACK_SENTENCES} sentences — this
 * catches near-duplicates the model loves to emit (e.g. "the user clicks the
 * button" vs "the button is clicked by the user").
 */
function dedupeRepeatedPhrases(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const seenSentences: string[] = [];
  const seenNgrams = new Set<string>();
  const result: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    const norm = trimmed.toLowerCase();
    if (seenSentences.includes(norm)) continue;

    const tokens = tokenize(trimmed);
    const localNgrams: string[] = [];
    let duplicateNgramCount = 0;
    for (let i = 0; i + DEDUPE_NGRAM_WORDS <= tokens.length; i += 1) {
      const ngram = tokens.slice(i, i + DEDUPE_NGRAM_WORDS).join(" ");
      localNgrams.push(ngram);
      if (seenNgrams.has(ngram)) duplicateNgramCount += 1;
    }
    // If more than a third of the sentence's n-grams already appeared
    // verbatim, skip it as a near-duplicate. The vision model loves to
    // restate the same UI text across consecutive frames, so we keep this
    // threshold tight.
    if (localNgrams.length > 0 && duplicateNgramCount / localNgrams.length > 0.34) {
      continue;
    }

    result.push(trimmed);
    for (const ngram of localNgrams) seenNgrams.add(ngram);
    seenSentences.push(norm);
    if (seenSentences.length > DEDUPE_LOOKBACK_SENTENCES) seenSentences.shift();
  }
  return result.join(" ").trim();
}

function normalizeSegments(
  raw: ScriptJsonShape["segments"],
  durationSec: number,
): TranscriptSegment[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const cleaned = raw
    .map((s) => ({
      start: Number(s.start ?? 0),
      end: Number(s.end ?? 0),
      text: dedupeRepeatedPhrases(stripStageDirections(String(s.text ?? "").trim())),
    }))
    .filter((s) => s.text.length > 0)
    .sort((a, b) => a.start - b.start);

  // Force strict contiguity: every segment must connect seamlessly to the
  // next with no gap or overlap. The first starts at 0, the last ends at
  // durationSec, and each interior boundary is shared by both neighbors.
  const result: TranscriptSegment[] = [];
  for (let i = 0; i < cleaned.length; i += 1) {
    const isFirst = i === 0;
    const isLast = i === cleaned.length - 1;
    const start = isFirst ? 0 : result[i - 1].end;
    const rawEnd = isLast ? durationSec : Math.min(cleaned[i + 1].start, durationSec);
    const end = Math.max(start + MIN_SEGMENT_DURATION_SEC, rawEnd);
    result.push({ id: i, start, end, text: cleaned[i].text });
  }
  // Ensure the final segment reaches exactly durationSec.
  if (result.length > 0) {
    result[result.length - 1] = { ...result[result.length - 1], end: durationSec };
  }
  return result;
}

/**
 * Redistribute segment boundaries proportionally to word count so that TTS
 * audio fills each segment without leaving silence at the end. The model
 * often assigns equal-width time slots regardless of how much text it writes;
 * this corrects that by giving each segment exactly as much time as its text
 * needs at ~140 words per minute.
 */
function redistributeByWordCount(
  segments: TranscriptSegment[],
  durationSec: number,
): TranscriptSegment[] {
  if (segments.length === 0) return segments;
  const wordCounts = segments.map((s) => s.text.split(/\s+/).filter(Boolean).length);
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  if (totalWords === 0) return segments;
  const result: TranscriptSegment[] = [];
  let cursor = 0;
  for (let i = 0; i < segments.length; i++) {
    const share = wordCounts[i] / totalWords;
    const end =
      i === segments.length - 1
        ? durationSec
        : Math.round(Math.min(cursor + durationSec * share, durationSec) * 1000) / 1000;
    result.push({ ...segments[i], start: cursor, end });
    cursor = end;
  }
  // Enforce minimum segment duration to keep ffmpeg/Piper happy.
  for (let i = 0; i < result.length; i++) {
    if (result[i].end - result[i].start < MIN_SEGMENT_DURATION_SEC) {
      result[i] = { ...result[i], end: result[i].start + MIN_SEGMENT_DURATION_SEC };
    }
  }
  return result;
}

/**
 * Generate a narration script from sampled frames using an Ollama-hosted
 * vision model which is built for
 * multi-image / video understanding). Falls through to {} on a network
 * failure so the caller can surface a 502 with the localized error code.
 */
export async function generateVideoScriptViaOllama(input: {
  frames: Array<{ base64Jpeg: string; atSec: number }>;
  durationSec: number;
  tone?: ScriptTone;
  /** Free-text tone override used when tone === ScriptTone.Custom. */
  customTone?: string;
  language?: string;
  /** Truncated README fetched from the user's GitHub repo for extra context. */
  repoContext?: string;
}): Promise<TranscriptResult> {
  const env = getServerEnv();
  const prompt = buildOllamaTranscriptPrompt({
    durationSec: input.durationSec,
    frameCount: input.frames.length,
    tone: input.tone,
    language: input.language,
    customTone: input.customTone,
    repoContext: input.repoContext,
  });

  // Bump the context window when extra text (repoContext) is supplied so the
  // model doesn't truncate mid-JSON.
  const numCtx =
    env.OLLAMA_NUM_CTX ??
    ((input.repoContext?.length ?? 0) > OLLAMA_LARGE_CTX_THRESHOLD_CHARS
      ? OLLAMA_NUM_CTX_LARGE
      : OLLAMA_NUM_CTX_DEFAULT);

  // Scale the prediction budget to the actual narration length the video
  // needs, otherwise the model truncates long scripts at the fixed cap and
  // the resulting MP3 leaves seconds of dead silence at the tail. ~1.4
  // tokens per English word + ~25 % overhead for the JSON wrapper, floored
  // at the static default for short clips and capped well below the model's
  // context to leave room for the prompt + image patches.
  const { minWords, maxWords } = resolveTranscriptWordBudget(input.durationSec);
  const dynamicNumPredict = Math.min(
    Math.max(OLLAMA_NUM_PREDICT, Math.ceil(maxWords * 1.4 * 1.25)),
    Math.max(2048, Math.floor(numCtx * 0.6)),
  );

  const messages: OllamaChatMessage[] = [
    {
      role: "system",
      content: OLLAMA_TRANSCRIPT_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: prompt,
      images: input.frames.map((f) => f.base64Jpeg),
    },
  ];

  const chatOptions = {
    baseUrl: env.OLLAMA_BASE_URL,
    model: env.OLLAMA_VISION_MODEL,
    keepAlive: env.OLLAMA_KEEP_ALIVE ?? OLLAMA_KEEP_ALIVE,
    temperature: env.OLLAMA_TEMPERATURE ?? OLLAMA_TEMPERATURE,
    numPredict: env.OLLAMA_NUM_PREDICT ?? dynamicNumPredict,
    numCtx,
  };

  const raw = await callOllamaChat(messages, chatOptions);
  const parsed = safeParseScriptJson(raw);
  let segments = redistributeByWordCount(
    normalizeSegments(parsed.segments, input.durationSec),
    input.durationSec,
  );
  let language = parsed.language;

  // Shortfall recovery: vision models (esp. minicpm-v) frequently emit only
  // a handful of short sentences for long clips, leaving most of the runtime
  // as dead silence. If we received fewer than the minimum word count, do one
  // expansion round that re-feeds the assistant's reply and asks it to
  // lengthen each segment without changing the timing grid. We keep the
  // result only if it produced strictly more spoken words.
  const haveWords = countSegmentWords(segments);
  if (haveWords < minWords) {
    const expansionMessages: OllamaChatMessage[] = [
      ...messages,
      { role: "assistant", content: raw },
      {
        role: "user",
        content: buildOllamaWordCountRetryPrompt(input.durationSec, haveWords, {
          minWords,
          maxWords,
        }),
      },
    ];
    try {
      const retryRaw = await callOllamaChat(expansionMessages, chatOptions);
      const retryParsed = safeParseScriptJson(retryRaw);
      const retrySegments = redistributeByWordCount(
        normalizeSegments(retryParsed.segments, input.durationSec),
        input.durationSec,
      );
      if (countSegmentWords(retrySegments) > haveWords) {
        segments = retrySegments;
        language = retryParsed.language ?? language;
      }
    } catch (err) {
      // Retry is best-effort — keep the original output if expansion fails.
      console.warn("Ollama script expansion retry failed:", err);
    }
  }

  const draftText = segments.map((s) => s.text).join(" ");
  segments = rebalanceTranscriptToVideo(draftText, input.durationSec);
  const text = segments.map((s) => s.text).join(" ");
  return {
    text,
    segments,
    durationSec: input.durationSec,
    language,
  };
}

/**
 * Single Ollama `/api/chat` round-trip. Centralised so the main script
 * generator and the shortfall-recovery retry share identical request shape,
 * dispatcher, timeouts, and sampler options. Use undici's own `fetch` (not
 * Node's built-in) so the Agent dispatcher comes from the same undici
 * instance — mixing Node's bundled undici with a separate npm copy throws
 * `invalid onRequestStart method`.
 */
async function callOllamaChat(
  messages: OllamaChatMessage[],
  opts: {
    baseUrl: string;
    model: string;
    keepAlive: string;
    temperature: number;
    numPredict: number;
    numCtx: number;
  },
): Promise<string> {
  const res = await undiciFetch(`${opts.baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      messages,
      stream: false,
      format: "json",
      keep_alive: opts.keepAlive,
      options: {
        temperature: opts.temperature,
        num_predict: opts.numPredict,
        num_ctx: opts.numCtx,
        repeat_penalty: OLLAMA_REPEAT_PENALTY,
        repeat_last_n: OLLAMA_REPEAT_LAST_N,
      },
    }),
    dispatcher: getOllamaDispatcher(),
  });

  if (!res.ok) {
    throw new Error(`Ollama vision request failed (${res.status}): ${await res.text()}`);
  }

  const payload = (await res.json()) as OllamaChatResponse;
  return payload.message?.content ?? "";
}
