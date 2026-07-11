import fs from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

export async function createTempJobDir(): Promise<{
  dir: string;
  cleanup: () => Promise<void>;
}> {
  const dir = path.join(os.tmpdir(), `frameline-${randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });

  const cleanup = async () => {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  };

  return { dir, cleanup };
}

export async function writeBufferToFile(filePath: string, data: Buffer): Promise<void> {
  await fs.writeFile(filePath, data);
}
