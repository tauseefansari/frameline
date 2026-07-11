import "server-only";
import { isProduction } from "@/lib/config/env";
import { PREFERENCE_COOKIE_MAX_AGE_SECONDS } from "@/lib/constants/cookies";

/**
 * Cookie attributes for first-party UI preferences (locale, color mode).
 *
 * Production mode hardens every cookie:
 *  - `secure` so it only travels over TLS
 *  - `httpOnly` so client-side JS can't read or rewrite the value out-of-band;
 *    mutations must go through a server action or the Edge proxy
 *
 * Development relaxes both so localhost (HTTP) keeps working and dev tooling
 * that inspects `document.cookie` keeps showing the value.
 */
export function getPreferenceCookieOptions(
  maxAgeSeconds: number = PREFERENCE_COOKIE_MAX_AGE_SECONDS,
): {
  path: "/";
  maxAge: number;
  sameSite: "lax";
  secure: boolean;
  httpOnly: boolean;
} {
  const hardened = isProduction();
  return {
    path: "/",
    maxAge: maxAgeSeconds,
    sameSite: "lax",
    secure: hardened,
    httpOnly: hardened,
  };
}
