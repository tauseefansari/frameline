import { getRequestConfig } from "next-intl/server";
import { isSupportedLocale, routing } from "@/lib/i18n/routing";
import { loadMessages } from "@/lib/i18n/load-messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isSupportedLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
