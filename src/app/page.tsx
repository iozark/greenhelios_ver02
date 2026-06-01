"use client";

import React, { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { LoginPage } from "@/components/layout/login-page";

/**
 * Main entry point — single-page app.
 *
 * • Unauthenticated users → LoginPage
 * • Authenticated users   → AppShell (sidebar + topbar + content area)
 *
 * On first mount we POST /api/seed once so demo data always exists.
 */

export default function Home() {
  const { status } = useSession();
  const seeded = useRef(false);
  const t = useTranslations("common");

  // Ensure demo data exists (runs exactly once)
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    fetch("/api/seed", { method: "POST" }).catch(() => {
      // Silently fail — the seed endpoint already handles "already exists"
    });
  }, []);

  // Show nothing while the session is being resolved to avoid flash
  if (status === "loading") {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LoginPage />;
  }

  // status === "authenticated"
  return <AppShell />;
}
