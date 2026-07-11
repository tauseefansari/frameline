#!/usr/bin/env node
/**
 * Frameline local model installer.
 *
 * Downloads/configures everything the local AI stack needs:
 *   1. Ollama vision model     (delegated to the `ollama` CLI)
 *   2. Piper TTS binary        + a default voice pack from Rhasspy on Hugging Face
 *
 * All assets land under <repo>/models/ unless FRAMELINE_MODELS_DIR is set.
 * Re-running is idempotent — anything already on disk is skipped.
 */

import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const REPO_ROOT = path.resolve(PROJECT_ROOT, "..");
const MODELS_DIR = path.resolve(process.env.FRAMELINE_MODELS_DIR ?? path.join(REPO_ROOT, "models"));

const PLATFORM = process.platform; // "win32" | "darwin" | "linux"
const ARCH = process.arch; // "x64" | "arm64" | ...

/** Default Ollama vision tag — override with --vision <tag>.
 * MiniCPM-V 2.6 is purpose-built for multi-image / video understanding
 * and notably faster than qwen2.5vl on CPU / integrated-GPU hosts. */
const DEFAULT_VISION_MODEL = "minicpm-v:8b";

/**
 * Piper voices to fetch by default. Each entry is the file stem; the
 * downloader fetches `<stem>.onnx` and `<stem>.onnx.json` from the Rhasspy
 * Hugging Face repo. Keep this list in sync with
 * `lib/constants/piper-voices.ts`.
 */
const PIPER_VOICES = [
  { id: "amy", stem: "en_US-amy-medium", lang: "en/en_US/amy/medium" },
  { id: "ryan", stem: "en_US-ryan-high", lang: "en/en_US/ryan/high" },
  { id: "alan", stem: "en_GB-alan-medium", lang: "en/en_GB/alan/medium" },
  { id: "jenny", stem: "en_GB-jenny_dioco-medium", lang: "en/en_GB/jenny_dioco/medium" },
  { id: "lessac", stem: "en_US-lessac-medium", lang: "en/en_US/lessac/medium" },
  { id: "kathleen", stem: "en_US-kathleen-low", lang: "en/en_US/kathleen/low" },
  { id: "joe", stem: "en_US-joe-medium", lang: "en/en_US/joe/medium" },
  { id: "john", stem: "en_US-john-medium", lang: "en/en_US/john/medium" },
  { id: "norman", stem: "en_US-norman-medium", lang: "en/en_US/norman/medium" },
  { id: "ljspeech", stem: "en_US-ljspeech-high", lang: "en/en_US/ljspeech/high" },
  { id: "alba", stem: "en_GB-alba-medium", lang: "en/en_GB/alba/medium" },
  { id: "cori", stem: "en_GB-cori-high", lang: "en/en_GB/cori/high" },
];

const PIPER_VOICE_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main";

// ── tiny console helpers ────────────────────────────────────────────────────
const c = {
  bold: (s) => `\x1b[1m${s}\x1b[22m`,
  dim: (s) => `\x1b[2m${s}\x1b[22m`,
  green: (s) => `\x1b[32m${s}\x1b[39m`,
  yellow: (s) => `\x1b[33m${s}\x1b[39m`,
  red: (s) => `\x1b[31m${s}\x1b[39m`,
  cyan: (s) => `\x1b[36m${s}\x1b[39m`,
};

const step = (msg) => console.log(`\n${c.bold(c.cyan("›"))} ${c.bold(msg)}`);
const ok = (msg) => console.log(`  ${c.green("✓")} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow("!")} ${msg}`);
const info = (msg) => console.log(`  ${c.dim(msg)}`);
const fail = (msg) => console.log(`  ${c.red("✗")} ${msg}`);

// ── filesystem + network primitives ─────────────────────────────────────────
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Follow HTTP redirects and stream the body to disk. */
async function downloadFile(url, dest) {
  const tmp = `${dest}.part`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  await pipeline(res.body, createWriteStream(tmp));
  await fs.rename(tmp, dest);
}

async function commandExists(cmd) {
  return new Promise((resolve) => {
    const which = PLATFORM === "win32" ? "where" : "which";
    const proc = spawn(which, [cmd], { stdio: "ignore" });
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", ...opts });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

// ── 1. Ollama ───────────────────────────────────────────────────────────────
async function setupOllama(visionModel) {
  step(`Ollama vision model (${visionModel})`);
  const hasOllama = await commandExists("ollama");
  if (!hasOllama) {
    warn("`ollama` not found on PATH.");
    info("Install Ollama from https://ollama.com/download then re-run this script.");
    info("After install, start the daemon (it's a system service / tray app).");
    return false;
  }
  ok("ollama binary detected");
  try {
    await run("ollama", ["pull", visionModel]);
    ok(`pulled ${visionModel}`);
    return true;
  } catch (err) {
    fail(`ollama pull failed: ${err.message}`);
    info("Make sure the Ollama daemon is running, then try again.");
    return false;
  }
}

// ── 2. Piper ────────────────────────────────────────────────────────────────
function piperReleaseAssetName() {
  // Asset names from https://github.com/rhasspy/piper/releases
  // Keep this conservative; users on uncommon arches install Piper manually.
  switch (`${PLATFORM}-${ARCH}`) {
    case "linux-x64":
      return "piper_linux_x86_64.tar.gz";
    case "linux-arm64":
      return "piper_linux_aarch64.tar.gz";
    case "darwin-x64":
      return "piper_macos_x64.tar.gz";
    case "darwin-arm64":
      return "piper_macos_aarch64.tar.gz";
    case "win32-x64":
      return "piper_windows_amd64.zip";
    default:
      return null;
  }
}

async function installPiperBinary(piperDir) {
  const asset = piperReleaseAssetName();
  if (!asset) {
    warn(`No prebuilt Piper binary known for ${PLATFORM}/${ARCH}.`);
    info("Build from source: https://github.com/rhasspy/piper#building");
    return false;
  }
  const url = `https://github.com/rhasspy/piper/releases/latest/download/${asset}`;
  const archivePath = path.join(piperDir, asset);
  info(`fetching ${asset}`);
  try {
    await downloadFile(url, archivePath);
  } catch (err) {
    fail(`download failed: ${err.message}`);
    return false;
  }

  // Extract — rely on host tools so we don't pull a tar/zip npm dep.
  try {
    if (asset.endsWith(".zip")) {
      // PowerShell ships on every supported Windows version.
      await run("powershell", [
        "-NoProfile",
        "-Command",
        `Expand-Archive -Path '${archivePath}' -DestinationPath '${piperDir}' -Force`,
      ]);
    } else {
      await run("tar", ["-xzf", archivePath, "-C", piperDir]);
    }
    await fs.unlink(archivePath).catch(() => {});
    ok(`extracted ${asset}`);

    // The Windows zip lays files out under a nested `piper/` directory; the
    // tarballs do the same on macOS/Linux. Hoist everything up one level so
    // `getDefaultPiperBin()` finds `piper(.exe)` directly under `models/piper/`.
    const binName = PLATFORM === "win32" ? "piper.exe" : "piper";
    if (!(await exists(path.join(piperDir, binName)))) {
      const nested = path.join(piperDir, "piper");
      if (await exists(nested)) {
        for (const entry of await fs.readdir(nested)) {
          if (entry === "voices") continue; // never clobber downloaded voices
          await fs.rename(path.join(nested, entry), path.join(piperDir, entry)).catch(() => {});
        }
        await fs.rmdir(nested).catch(() => {});
      }
    }
    return true;
  } catch (err) {
    fail(`extraction failed: ${err.message}`);
    info(`Archive left at ${archivePath} — extract manually and re-run.`);
    return false;
  }
}

async function setupPiper() {
  step("Piper TTS (binary + voices)");
  const piperRoot = path.join(MODELS_DIR, "piper");
  const voicesDir = path.join(piperRoot, "voices");
  await ensureDir(piperRoot);
  await ensureDir(voicesDir);

  const binName = PLATFORM === "win32" ? "piper.exe" : "piper";
  const binPath = path.join(piperRoot, binName);
  const nestedBinPath = path.join(piperRoot, "piper", binName);

  if (await exists(binPath)) {
    ok("piper binary already present");
  } else if (await exists(nestedBinPath)) {
    // Older runs may have left a nested layout — hoist it now.
    const nested = path.join(piperRoot, "piper");
    for (const entry of await fs.readdir(nested)) {
      if (entry === "voices") continue;
      await fs.rename(path.join(nested, entry), path.join(piperRoot, entry)).catch(() => {});
    }
    await fs.rmdir(nested).catch(() => {});
    ok("piper binary hoisted from nested folder");
  } else {
    const installed = await installPiperBinary(piperRoot);
    if (!installed) return false;
  }

  let voiceCount = 0;
  for (const voice of PIPER_VOICES) {
    const onnx = path.join(voicesDir, `${voice.stem}.onnx`);
    const json = path.join(voicesDir, `${voice.stem}.onnx.json`);
    const baseUrl = `${PIPER_VOICE_BASE}/${voice.lang}`;
    try {
      if (!(await exists(onnx))) {
        info(`downloading ${voice.stem}.onnx`);
        await downloadFile(`${baseUrl}/${voice.stem}.onnx`, onnx);
      }
      if (!(await exists(json))) {
        info(`downloading ${voice.stem}.onnx.json`);
        await downloadFile(`${baseUrl}/${voice.stem}.onnx.json`, json);
      }
      ok(`voice ready: ${voice.id} (${voice.stem})`);
      voiceCount += 1;
    } catch (err) {
      fail(`could not fetch voice ${voice.id}: ${err.message}`);
    }
  }
  return voiceCount > 0;
}

// ── main ────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { vision: DEFAULT_VISION_MODEL, skip: new Set() };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--vision") out.vision = argv[++i];
    else if (a === "--skip-ollama") out.skip.add("ollama");
    else if (a === "--skip-piper") out.skip.add("piper");
    else if (a === "--help" || a === "-h") {
      console.log(`Usage: node scripts/setup-models.mjs [options]

Options:
  --vision <tag>     Ollama vision model tag (default: ${DEFAULT_VISION_MODEL})
  --skip-ollama      Don't pull the Ollama vision model
  --skip-piper       Don't install Piper or its voices
  -h, --help         Show this help

Models install to: ${MODELS_DIR}
Override with FRAMELINE_MODELS_DIR.
`);
      process.exit(0);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(c.bold("Frameline · local model setup"));
  console.log(c.dim(`platform: ${PLATFORM}/${ARCH}`));
  console.log(c.dim(`models dir: ${MODELS_DIR}`));
  await ensureDir(MODELS_DIR);

  const results = {};
  if (!args.skip.has("ollama")) results.ollama = await setupOllama(args.vision);
  if (!args.skip.has("piper")) results.piper = await setupPiper();

  console.log();
  console.log(c.bold("Summary"));
  for (const [name, success] of Object.entries(results)) {
    console.log(`  ${success ? c.green("✓") : c.yellow("!")} ${name}`);
  }
  const allOk = Object.values(results).every(Boolean);
  console.log();
  if (allOk) {
    console.log(c.green("All set. `npm run dev` to launch the studio."));
  } else {
    console.log(
      c.yellow(
        "Some steps need manual follow-up — see warnings above. Frameline will run, but AI features depending on the missing pieces will fail at request time.",
      ),
    );
  }
}

main().catch((err) => {
  console.error(c.red(`\nSetup failed: ${err?.stack ?? err}`));
  process.exit(1);
});
