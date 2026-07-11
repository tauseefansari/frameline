"use server";

import { cookies } from "next/headers";
import { getPreferenceCookieOptions } from "@/lib/config/cookies";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale-cookie";
import { isSupportedLocale } from "@/lib/i18n/routing";
import { COLOR_MODE_COOKIE, ColorMode } from "@/lib/theme/color-mode";

/**
 * Persists the user's chosen UI locale. Validated against the known locale
 * list — unknown values are silently ignored so a poisoned client request
 * can't pin the cookie to an arbitrary value.
 */
export async function setLocaleCookie(locale: string): Promise<void> {
  if (!isSupportedLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE_NAME, locale, getPreferenceCookieOptions());
}

/**
 * Persists the user's chosen color mode (light/dark). Replaces the previous
 * `document.cookie` write so the cookie can be httpOnly in production.
 */
export async function setColorModeCookie(mode: ColorMode): Promise<void> {
  if (mode !== ColorMode.Light && mode !== ColorMode.Dark) return;
  const store = await cookies();
  store.set(COLOR_MODE_COOKIE, mode, getPreferenceCookieOptions());
}
