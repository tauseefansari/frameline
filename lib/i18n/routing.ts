import { defineRouting } from "next-intl/routing";
import { PREFERENCE_COOKIE_MAX_AGE_SECONDS } from "@/lib/constants/cookies";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale-cookie";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "never",
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
    maxAge: PREFERENCE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    path: "/",
  },
  localeDetection: true,
});

/** Union of every supported locale code (e.g. `"en" | "es"`). */
export type LocaleCode = (typeof routing.locales)[number];

/** Type guard for arbitrary strings → known locale codes. */
export function isSupportedLocale(value: string | undefined | null): value is LocaleCode {
  return !!value && (routing.locales as readonly string[]).includes(value);
}
