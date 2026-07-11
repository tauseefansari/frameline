/**
 * Single source of truth for external-AI and Ollama vision transcript prompts.
 * Shared tone hints, word budget, visual/temporal sync rules, and builders.
 */
import { formatTimecode } from "@/lib/format";
import {
  maxSpeechDurationSec,
  maxWordsForVideoBudget,
  nominalWordsForVideo,
} from "@/lib/format/speech-budget";
import {
  EXTERNAL_PROMPT_OVERSHOOT_FACTOR,
  MAX_SEGMENT_SPEECH_SEC,
  MAX_SENTENCES_PER_SEGMENT,
  MAX_WORDS_PER_SEGMENT,
  SECONDS_PER_SEGMENT_TARGET,
  SPEECH_FILL_MARGIN,
  WORDS_PER_MINUTE,
} from "@/lib/constants/transcript";
import { ScriptTone } from "@/lib/types/studio";

export type TranscriptPromptInput = {
  durationSec: number;
  tone?: ScriptTone;
  customTone?: string;
  repoContext?: string;
  language?: string;
};

export type OllamaTranscriptPromptInput = TranscriptPromptInput & {
  frameCount: number;
};

export type TranscriptWordBudget = {
  minWords: number;
  wordTarget: number;
  maxWords: number;
  durationLabel: string | null;
};

/** External-AI prompt budget — lower target to offset LLM overshoot; sync still uses {@link resolveTranscriptWordBudget}. */
export type ExternalTranscriptWordBudget = TranscriptWordBudget & {
  nominalWords: number;
  syncMaxWords: number;
  blockCount: number;
  wordsPerBlock: number;
  plannedWords: number;
};

const TONE_HINTS: Record<ScriptTone, string> = {
  [ScriptTone.Cinematic]: "cinematic, evocative, present tense",
  [ScriptTone.Documentary]: "warm, authoritative documentary narration",
  [ScriptTone.Demo]: "polished product-demo — explain what the app does and why it matters",
  [ScriptTone.Energetic]: "high-energy, punchy, forward-moving",
  [ScriptTone.Calm]: "calm, measured, reassuring",
  [ScriptTone.Educational]: "clear, instructional, plainspoken",
  [ScriptTone.Promotional]: "polished, benefit-led, persuasive",
  [ScriptTone.Custom]: "",
};

const FORBIDDEN_PHRASES =
  'parentheses, brackets, stage directions, speaker labels, markdown, the phrases "as you can see", "the video shows", "we can see", "as heard", "the speaker says"';

/** Word budget for Ollama vision + sync/trim — includes a small fill margin. */
export function resolveTranscriptWordBudget(durationSec: number): TranscriptWordBudget {
  const maxWords = maxWordsForVideoBudget(durationSec);
  const wordTarget = maxWords;
  const minWords = Math.max(40, Math.floor(maxWords * 0.95));
  const durationLabel =
    Number.isFinite(durationSec) && durationSec > 0 ? formatTimecode(durationSec) : null;
  return { minWords, wordTarget, maxWords, durationLabel };
}

function resolveExternalBlockLayout(durationSec: number, wordTarget: number) {
  const byDuration = Math.max(2, Math.round(durationSec / MAX_SEGMENT_SPEECH_SEC));
  const byWords = Math.max(2, Math.ceil(wordTarget / MAX_WORDS_PER_SEGMENT));
  const blockCount = Math.max(byDuration, byWords);
  const wordsPerBlock = Math.min(
    MAX_WORDS_PER_SEGMENT,
    Math.max(6, Math.floor(wordTarget / blockCount)),
  );
  return { blockCount, wordsPerBlock, plannedWords: blockCount * wordsPerBlock };
}

/**
 * Tighter word budget for copy-ready external prompts. ChatGPT/Gemini often
 * ignore a single max-word line — we give a lower target, block math, and a
 * mandatory count step so pasted scripts need less sync trimming.
 */
export function resolveExternalTranscriptWordBudget(
  durationSec: number,
): ExternalTranscriptWordBudget {
  const syncMaxWords = maxWordsForVideoBudget(durationSec);
  const nominalWords = nominalWordsForVideo(durationSec);
  // Aim for the sync fill budget so Piper has enough text; cap external overshoot separately.
  const wordTarget = syncMaxWords;
  const maxWords = syncMaxWords;
  const minWords = Math.max(40, Math.floor(nominalWords * 0.97));
  const durationLabel =
    Number.isFinite(durationSec) && durationSec > 0 ? formatTimecode(durationSec) : null;
  const layout = resolveExternalBlockLayout(durationSec, wordTarget);
  return {
    minWords,
    wordTarget,
    maxWords,
    nominalWords,
    syncMaxWords,
    durationLabel,
    ...layout,
  };
}

function resolveToneHint(tone: ScriptTone | undefined, customTone: string | undefined): string {
  if (tone === ScriptTone.Custom && customTone?.trim()) {
    return customTone.trim();
  }
  if (tone && tone !== ScriptTone.Custom) {
    return TONE_HINTS[tone] ?? tone;
  }
  return "engaging and clear, suitable for any audience";
}

function visualOnlyRules(mode: "external" | "ollama"): string {
  const watchLine =
    mode === "external"
      ? "- Watch the full video from start to finish. Study what happens on screen over time: actions, UI changes, workflows, transitions, and outcomes."
      : "- Study what happens on screen over time: actions, UI changes, workflows, transitions, and outcomes.";
  const audioLine =
    mode === "external"
      ? "- Do NOT transcribe, paraphrase, or reference any spoken dialogue, voiceover, background music, or sound effects in the clip.\n- Do NOT assume what anyone said off-screen or in the original audio track. Ignore the audio entirely — pretend the clip is silent."
      : "- Do NOT transcribe, paraphrase, or reference any spoken dialogue, voiceover, background music, or sound effects — you receive images only, but never invent dialogue from off-screen audio.";

  return `⚠ VISUAL-ONLY — READ THIS FIRST:
${watchLine}
- Write a fresh narration script based ONLY on what you SEE in the frames.
${audioLine}
- Treat the ${mode === "external" ? "video" : "frames"} as a temporal sequence: describe how the scene or workflow evolves from beginning to end.`;
}

function externalWordCountRules(budget: ExternalTranscriptWordBudget, durationSec: number): string {
  const { minWords, wordTarget, maxWords, durationLabel, blockCount, wordsPerBlock, plannedWords } =
    budget;
  const runtime =
    durationLabel != null
      ? `${durationLabel} (${durationSec.toFixed(1)} seconds)`
      : `${durationSec.toFixed(1)} seconds`;

  return `⚠ WORD COUNT — NON-NEGOTIABLE (read before writing):
- Video length: ${runtime}
- TARGET: ${wordTarget} words total — plan the full script to fill the entire clip; too few words leaves silent dead air at the end
- MINIMUM: ${minWords} words — do not submit shorter scripts
- ABSOLUTE MAXIMUM: ${maxWords} words — never exceed; Frameline trims excess from the end on sync
- ChatGPT and Gemini often overshoot — count every word before replying; if over ${maxWords}, shorten until at or under
- At ~${WORDS_PER_MINUTE} wpm, ${wordTarget} words ≈ fills ${runtime}; stay between ${minWords} and ${maxWords}
- Structure: ~${blockCount} blocks × ~${wordsPerBlock} words each (max ${MAX_WORDS_PER_SEGMENT} words, ${MAX_SENTENCES_PER_SEGMENT} sentences per block) ≈ ${plannedWords} words planned`;
}

function runtimeFillRules(durationSec: number, budget: TranscriptWordBudget): string {
  const { minWords, wordTarget, maxWords, durationLabel } = budget;
  const runtime =
    durationLabel != null
      ? `${durationLabel} (${durationSec.toFixed(1)} seconds)`
      : `${durationSec.toFixed(1)} seconds`;

  const effectiveSpeechSec = maxSpeechDurationSec(durationSec);
  const headroomPct = Math.round((SPEECH_FILL_MARGIN - 1) * 100);

  return `⚠ RUNTIME FILL — audio must match video length:
- The full script is spoken aloud at ~${WORDS_PER_MINUTE} wpm and must cover the entire ${runtime} clip.
- Aim for ${wordTarget} words total; write at least ${minWords} words so the voiceover does not end early with silent video still playing.
- Never exceed ${maxWords} words — only scripts clearly above this are trimmed on sync.
- Up to ~${headroomPct}% speech headroom (~${effectiveSpeechSec.toFixed(1)} s on this clip) is allowed so closing lines are not clipped.
- Spread narration evenly from the opening frame to the final frame — do not front-load or back-load the script.`;
}

function temporalSyncRules(
  mode: "external" | "ollama",
  durationSec: number,
  frameCount?: number,
): string {
  const shared = `- Narrate in present tense as if the viewer is watching live: describe what is happening NOW on screen.
- When a loader, spinner, or progress bar is visible, say the system is loading in that same stretch — do NOT describe results until they appear.
- When a new screen or outcome appears, describe it in the next ${mode === "external" ? "block" : "segment"} — never announce it early.
- Match pacing to the visuals: brief lines for quick actions, longer lines for waits and transitions.`;

  if (mode === "external") {
    return `⚠ TEMPORAL SYNC — narration must track the video moment by moment:
- Write blocks in strict playback order — block 1 = opening, last block = ending.
${shared}
- Each block covers only what is visible during that part of the timeline so voice and picture stay aligned.`;
  }

  const fc = frameCount ?? 1;
  const frameSpan =
    fc === 1
      ? `the single frame from this ${durationSec.toFixed(1)}-second clip`
      : `frames 1 through ${fc} spanning ${durationSec.toFixed(1)} seconds (frame 1 ≈ 0 s, frame ${fc} ≈ ${durationSec.toFixed(1)} s)`;
  const exampleSec = ((Math.min(2, fc - 1) / Math.max(1, fc - 1)) * durationSec).toFixed(1);

  return `⚠ TEMPORAL SYNC — segment timestamps must match what is on screen:
- You receive ${frameSpan}. Infer WHEN each visual change happens from frame order.
- Each segment's "start" and "end" must match when those visuals are on screen (frame 3 of ${fc} ≈ ${exampleSec} s).
- Segment text must describe only what is visible in that time window.
${shared}
- Place segment boundaries at visible transitions (navigation, loader → content, dialog open/close).`;
}

function resolveOllamaSegmentLayout(durationSec: number, wordTarget: number) {
  const segmentCount = Math.max(2, Math.round(durationSec / SECONDS_PER_SEGMENT_TARGET));
  const wordsPerSegment = Math.max(8, Math.round(wordTarget / segmentCount));
  return { segmentCount, wordsPerSegment };
}

function wordBudgetSection(
  budget: TranscriptWordBudget,
  durationSec: number,
  mode: "external" | "ollama",
): string {
  const { minWords, wordTarget, maxWords, durationLabel } = budget;

  if (mode === "external" && !durationLabel) {
    const exampleNominal = Math.floor((180 / 60) * WORDS_PER_MINUTE);
    const examplePlanning = Math.floor(exampleNominal / EXTERNAL_PROMPT_OVERSHOOT_FACTOR);
    return `VIDEO RUNTIME: [fill in your clip length — e.g. 1:19 or 79 seconds]
WORD TARGET: (video seconds ÷ 60) × ${WORDS_PER_MINUTE} × ${SPEECH_FILL_MARGIN} — e.g. a 79-second clip needs ~${Math.floor((79 / 60) * WORDS_PER_MINUTE * SPEECH_FILL_MARGIN)} words
PLANNING HINT: external AIs overshoot — draft toward ~${examplePlanning} words, then expand to the target if under
HARD MAXIMUM: never exceed the word target — excess is trimmed from the end`;
  }

  if (mode === "external") {
    const ext = budget as ExternalTranscriptWordBudget;
    const runtimeLine = `VIDEO RUNTIME: ${durationLabel} (${durationSec.toFixed(1)} seconds)`;
    const planningTarget = Math.max(
      ext.minWords,
      Math.floor(ext.nominalWords / EXTERNAL_PROMPT_OVERSHOOT_FACTOR),
    );
    return `${runtimeLine}
WORD TARGET: ${ext.wordTarget} words (minimum ${ext.minWords}; never exceed ${ext.maxWords})
PLANNING HINT: draft toward ~${planningTarget} words first, then add detail until you reach ${ext.wordTarget} without going over
BLOCK PLAN: ~${ext.blockCount} blocks × ~${ext.wordsPerBlock} words (≤${MAX_WORDS_PER_SEGMENT} words per block)`;
  }

  const runtimeLine = durationLabel
    ? `VIDEO RUNTIME: ${durationLabel} (${durationSec.toFixed(1)} seconds)`
    : `VIDEO RUNTIME: ${durationSec.toFixed(1)} seconds`;

  let ollamaExtra = "";
  if (mode === "ollama") {
    const { segmentCount, wordsPerSegment } = resolveOllamaSegmentLayout(durationSec, wordTarget);
    ollamaExtra = `\n- Spread across ~${segmentCount} segments (~${wordsPerSegment} words each; max ${MAX_WORDS_PER_SEGMENT} words, ${MAX_SENTENCES_PER_SEGMENT} sentences per segment).
- Fewer than ${minWords} words FAILS and will be retried.`;
  }

  return `${runtimeLine}
WORD TARGET: ${wordTarget} words (minimum ${minWords}, maximum ${maxWords})${ollamaExtra}`;
}

function contentRulesSection(mode: "external" | "ollama"): string {
  const lead =
    mode === "external"
      ? "1. Follow temporal sync above — narration must track the video moment by moment, not as a generic summary"
      : "1. Follow temporal sync above — segment text and timestamps must track the frames moment by moment, not as a generic summary";

  const describeRule =
    mode === "external"
      ? "2. Describe what happens on screen over time — what the user, app, or scene does; keep each block to one visual beat"
      : "2. DESCRIBE what changes between frames — what the user/app/scene does over time, why it matters, what the viewer should take away. Synthesize and paraphrase; do NOT read on-screen text out loud";

  const contextRule =
    mode === "external"
      ? "5. Add context only when it clarifies the action — one short phrase, not a full explanation"
      : "5. Add brief context for why each step matters, not only what is clicked";

  const brevityRule =
    mode === "external"
      ? '8. BREVITY: shorter sentences beat extra adjectives; no recap paragraphs, no "In conclusion", no padding to sound polished'
      : "";

  const rules = [
    `CONTENT RULES:
${lead}
${describeRule}
3. Synthesize and explain; do NOT read UI labels, menu items, or button text verbatim
4. If the same screen appears multiple times, describe the workflow or progression instead of repeating yourself
${contextRule}
6. Every sentence must be unique — never repeat a thought
7. FORBIDDEN in the text: ${FORBIDDEN_PHRASES}`,
  ];

  if (brevityRule) {
    rules.push(brevityRule);
  }

  return rules.join("\n");
}

function formatProjectContext(
  repoContext: string | undefined,
  mode: "external" | "ollama",
): string {
  const trimmed = repoContext?.trim();
  if (!trimmed) return "";
  const prefix =
    mode === "external"
      ? "PROJECT CONTEXT (use for accurate names and terminology — narrate only what is visible in the video, never from audio):"
      : "PROJECT CONTEXT — use for accurate names and terminology. Narrate only what is visible in the frames, never from audio:";
  return `\n${prefix}\n${trimmed}\n`;
}

function ttsPreamble(): string {
  return `Every word you write will be spoken aloud by a text-to-speech engine at ~${WORDS_PER_MINUTE} words per minute. There is no on-screen text overlay — if you don't say it, the audience won't hear it.`;
}

/** Copy-ready prompt for external AI tools (Gemini, ChatGPT, Claude, …). */
export function buildExternalTranscriptPrompt(input: TranscriptPromptInput): string {
  const { durationSec, tone, customTone, repoContext, language } = input;
  const lang = language?.trim() || "English";
  const toneHint = resolveToneHint(tone, customTone);
  const budget = resolveExternalTranscriptWordBudget(durationSec);

  return `You are a professional voiceover narrator. I am giving you a video to analyze.

${externalWordCountRules(budget, durationSec)}

${visualOnlyRules("external")}

${temporalSyncRules("external", durationSec)}

${ttsPreamble()}

${wordBudgetSection(budget, durationSec, "external")}
NARRATION LANGUAGE: ${lang}
TONE: ${toneHint}

OUTPUT FORMAT (required for Frameline):
- Return PLAIN TEXT ONLY — no markdown, no JSON, no bullet lists, no headings, no code fences
- Split the script into short blocks separated by ONE blank line between blocks
- Use ~${budget.blockCount} blocks; each block: at most ${MAX_WORDS_PER_SEGMENT} words AND at most ${MAX_SENTENCES_PER_SEGMENT} full sentences (whichever limit you hit first)
- Each block should be speakable in ~${MAX_SEGMENT_SPEECH_SEC} seconds at natural pace (~${budget.wordsPerBlock} words typical)
- Write only what the narrator says — complete sentences, flowing from block to block
- FINAL STEP before replying: count every word; if over ${budget.maxWords}, shorten until at or under ${budget.maxWords}, then reply

${contentRulesSection("external")}${formatProjectContext(repoContext, "external")}`.trim();
}

/** Prompt for local Ollama vision script generation. */
export function buildOllamaTranscriptPrompt(input: OllamaTranscriptPromptInput): string {
  const { durationSec, frameCount, tone, customTone, repoContext, language } = input;
  const lang = language?.trim() || "English";
  const toneHint = resolveToneHint(tone, customTone);
  const budget = resolveTranscriptWordBudget(durationSec);
  const { wordTarget } = budget;
  const { wordsPerSegment } = resolveOllamaSegmentLayout(durationSec, wordTarget);

  const frameDesc =
    frameCount === 1
      ? `one representative frame from a ${durationSec.toFixed(1)}-second clip`
      : `${frameCount} chronologically ordered frames spanning ${durationSec.toFixed(1)} seconds (frame 1 is the start, frame ${frameCount} is the end)`;

  const contextSection = formatProjectContext(repoContext, "ollama");

  return `You are a professional voiceover narrator writing a continuous wall-to-wall script for a ${durationSec.toFixed(1)}-second video. ${ttsPreamble()}

You see ${frameDesc}.

${visualOnlyRules("ollama")}

${runtimeFillRules(durationSec, budget)}

${temporalSyncRules("ollama", durationSec, frameCount)}

${wordBudgetSection(budget, durationSec, "ollama")}

${contentRulesSection("ollama")}
8. Tone: ${toneHint}. Language: ${lang}.
9. Allocate words and timestamps proportionally to how long each visual state stays on screen.
10. Segments must cover [0, ${durationSec.toFixed(3)}] with no gaps. The last segment ends at exactly ${durationSec.toFixed(3)}.${contextSection}

Return STRICT JSON only — no markdown, no extra text:
{ "language": "<ISO-639-1>", "segments": [ { "start": <seconds>, "end": <seconds>, "text": "<2-4 sentences, ~${wordsPerSegment} words, max ${MAX_WORDS_PER_SEGMENT} words>" } ] }`;
}

/** Stats for the external prompt accordion summary. */
export function externalTranscriptPromptStats(durationSec: number): {
  wordTarget: number;
  maxWords: number;
  durationLabel: string;
} | null {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return null;
  const budget = resolveExternalTranscriptWordBudget(durationSec);
  return {
    wordTarget: budget.wordTarget,
    maxWords: budget.maxWords,
    durationLabel: budget.durationLabel ?? formatTimecode(durationSec),
  };
}

/** Ollama shortfall-recovery follow-up message. */
export function buildOllamaWordCountRetryPrompt(
  durationSec: number,
  haveWords: number,
  budget: Pick<TranscriptWordBudget, "minWords" | "maxWords">,
): string {
  const { minWords, maxWords } = budget;
  return `WORD COUNT FAILURE: your previous reply had only ${haveWords} words but this ${durationSec.toFixed(1)}-second video requires AT LEAST ${minWords} words (aim for ${maxWords}, never above ${maxWords}). The voiceover must fill the full clip — add words by lengthening each segment without changing timestamps. Stay within ${maxWords} words. Do NOT repeat phrases. Do NOT add parentheses, brackets, or stage directions. Return STRICT JSON only — no markdown.`;
}

export const OLLAMA_TRANSCRIPT_SYSTEM_PROMPT =
  "You are a professional video narrator. You analyze video frames visually (no audio) and write voiceover scripts whose timestamps and text stay locked to what is on screen at each moment. You always return strict JSON with no markdown.";
