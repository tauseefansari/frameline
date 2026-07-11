import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPreferenceCookieOptions } from "@/lib/config/cookies";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale-cookie";
import { resolveLocaleFromNextRequest } from "@/lib/i18n/resolve-request-locale";

/** Same value next-intl uses internally (`HEADER_LOCALE_NAME`). */
const NEXT_INTL_LOCALE_HEADER = "X-NEXT-INTL-LOCALE";

/**
 * Cookie-based locale **without** rewriting `/` → `/[locale]/…`.
 * `createIntlMiddleware` always rewrites to a `[locale]` segment; flat `app/page.tsx` requires this thin proxy instead.
 */
export function proxy(request: NextRequest) {
  const locale = resolveLocaleFromNextRequest(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NEXT_INTL_LOCALE_HEADER, locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const existing = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (existing !== locale) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, getPreferenceCookieOptions());
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
