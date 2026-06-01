import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  localeCookieName,
  locales,
  type AppLocale,
} from "@/i18n/config";

export function middleware(req: NextRequest) {
  const current = req.cookies.get(localeCookieName)?.value;
  if (current && locales.includes(current as AppLocale)) {
    return NextResponse.next();
  }

  const accept = req.headers.get("accept-language") ?? "";
  const prefersGreek =
    /\bel\b/i.test(accept) ||
    accept.toLowerCase().includes("el-gr") ||
    accept.toLowerCase().includes("greece");

  const locale: AppLocale = prefersGreek ? "el" : "en";

  const res = NextResponse.next();
  res.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
