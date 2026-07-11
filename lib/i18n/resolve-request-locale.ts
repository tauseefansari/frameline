import type { NextRequest } from "next/server";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale-cookie";
import { isSupportedLocale, routing } from "@/lib/i18n/routing";

function localeFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const prefix = `${LOCALE_COOKIE_NAME}=`;
  for (const part of parts) {
    if (!part.startsWith(prefix)) continue;
    const raw = decodeURIComponent(part.slice(prefix.length));
    if (isSupportedLocale(raw)) return raw;
  }
  return null;
}

function localeFromAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  const primary = header.split(",")[0]?.trim().split("-")[0]?.toLowerCase();
  return isSupportedLocale(primary) ? primary : null;
}

/** Locale from `cookies` API (Edge proxy). */
export function resolveLocaleFromNextRequest(request: NextRequest): string {
  const fromCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (isSupportedLocale(fromCookie)) return fromCookie;

  const fromHeader = localeFromAcceptLanguage(request.headers.get("accept-language"));
  return fromHeader ?? routing.defaultLocale;
}

/** Resolves locale from the next-intl locale cookie, then `Accept-Language`, then default (Fetch `Request`). */
export function resolveRequestLocale(req: Request): string {
  const fromCookie = localeFromCookieHeader(req.headers.get("cookie"));
  if (fromCookie) return fromCookie;

  const fromHeader = localeFromAcceptLanguage(req.headers.get("accept-language"));
  return fromHeader ?? routing.defaultLocale;
}
