"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function postLocale(locale: AppLocale) {
  await fetch("/api/locale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale }),
  });
}

export function LocaleSwitcher({
  variant = "default",
}: {
  /** Ghost fits compact bars (e.g. login). Default shows outline pill in shell. */
  variant?: "default" | "ghost";
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("shell");
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const onChange = async (next: AppLocale) => {
    if (next === locale || pending) return;
    setPending(true);
    try {
      await postLocale(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant === "ghost" ? "ghost" : "outline"}
          size="sm"
          className={
            variant === "ghost"
              ? "gap-2 rounded-lg text-muted-foreground"
              : "gap-2 rounded-lg"
          }
          disabled={pending}
          aria-label={t("localeMenu")}
        >
          <Languages className="size-4 shrink-0" />
          <span className="hidden sm:inline">{t("localeMenu")}</span>
          <span className="font-mono text-xs uppercase tabular-nums sm:hidden">
            {locale}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(v) => onChange(v as AppLocale)}
        >
          {locales.map((code) => (
            <DropdownMenuRadioItem key={code} value={code}>
              {code === "el" ? t("localeEl") : t("localeEn")}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
