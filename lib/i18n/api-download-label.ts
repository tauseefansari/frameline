import "server-only";

import { getTranslations } from "next-intl/server";

export enum ApiDownloadKey {
  Voice = "voice",
  Cut = "cut",
  Concat = "concat",
  Render = "render",
}

export async function getDownloadBasename(locale: string, key: ApiDownloadKey): Promise<string> {
  const t = await getTranslations({ locale, namespace: "api" });
  return t(`download.${key}`);
}
