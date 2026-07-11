import "server-only";

import fs from "fs/promises";
import path from "path";

const LOCALES_ROOT = path.join(process.cwd(), "locales");

export type Messages = Record<string, Record<string, unknown>>;

export async function loadMessages(locale: string): Promise<Messages> {
  const dir = path.join(LOCALES_ROOT, locale);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const messages: Messages = {};

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const ns = path.basename(entry.name, ".json");
    const raw = await fs.readFile(path.join(dir, entry.name), "utf8");
    messages[ns] = JSON.parse(raw) as Record<string, unknown>;
  }

  return messages;
}
