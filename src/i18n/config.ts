export const locales = ["el", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "el";

export const localeCookieName = "GH_LOCALE";

/** Map saved profile/settings language label → app locale */
export function profileLanguageToLocale(lang: string): AppLocale {
  if (lang.trim().toLowerCase() === "greek") return "el";
  return "en";
}

export function localeToProfileLanguage(locale: AppLocale): string {
  return locale === "el" ? "Greek" : "English (US)";
}
