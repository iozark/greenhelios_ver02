import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import {
  defaultLocale,
  localeCookieName,
  locales,
  type AppLocale,
} from "./config";

export default getRequestConfig(async () => {
  const jar = await cookies();
  const raw = jar.get(localeCookieName)?.value;
  const locale: AppLocale =
    raw && locales.includes(raw as AppLocale) ? (raw as AppLocale) : defaultLocale;

  const messages =
    locale === "el"
      ? (await import("../messages/el.json")).default
      : (await import("../messages/en.json")).default;

  return { locale, messages };
});
