import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AppRouterProviders } from "@/components/providers/AppRouterProviders";
import { HtmlLang } from "@/components/i18n/HtmlLang";
import {
  COLOR_MODE_COOKIE,
  DEFAULT_COLOR_MODE,
  parseColorModeCookie,
} from "@/lib/theme/color-mode";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Mono is only used inside a few code-style surfaces, so skip aggressive
// preloading to avoid Chrome's "preloaded but not used" warning on routes
// (e.g. /studio) that never render mono text.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();
  setRequestLocale(locale);
  const messages = await getMessages();

  const cookieStore = await cookies();
  const initialColorMode =
    parseColorModeCookie(cookieStore.get(COLOR_MODE_COOKIE)?.value) ?? DEFAULT_COLOR_MODE;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body style={{ margin: 0 }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <HtmlLang locale={locale} />
          <AppRouterProviders initialColorMode={initialColorMode}>{children}</AppRouterProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
