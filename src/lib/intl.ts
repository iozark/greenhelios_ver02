import { el as elFns } from "date-fns/locale";
import { enUS as enFns } from "date-fns/locale";

export function getDateFnsLocale(locale: string) {
  return locale === "el" ? elFns : enFns;
}

/** BCP 47 tag for `Intl` / `toLocaleString` */
export function getIntlTag(locale: string): string {
  return locale === "el" ? "el-GR" : "en-US";
}
