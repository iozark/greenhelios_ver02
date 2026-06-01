"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Settings, Mail, Bell, Globe, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { profileLanguageToLocale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ──────────────────────────────────────────────────────────
interface SettingsData {
  language: string;
  emailProductUpdates: boolean;
  emailSecurityAlerts: boolean;
  emailBillingReports: boolean;
  emailTaskReminders: boolean;
  pushDirectMessages: boolean;
  pushMentions: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────
const LANGUAGES = [
  "English (US)",
  "English (UK)",
  "Greek",
  "French",
  "German",
  "Spanish",
];

const DEFAULT_SETTINGS: SettingsData = {
  language: "English (US)",
  emailProductUpdates: true,
  emailSecurityAlerts: false,
  emailBillingReports: true,
  emailTaskReminders: false,
  pushDirectMessages: true,
  pushMentions: true,
};

// ─── Switch Row ─────────────────────────────────────────────────────
function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email section skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>

          <Skeleton className="h-px w-full" />

          {/* Push section skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>

          <Skeleton className="h-px w-full" />

          {/* Display section skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-48" />
          </div>

          <Skeleton className="h-10 w-28" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Settings Page ─────────────────────────────────────────────
export function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Fetch Settings ─────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error(t("loadFail"));
      const data: SettingsData = await res.json();
      setSettings(data);
    } catch {
      toast.error(t("loadFail"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Update helpers ─────────────────────────────────────────────
  const updateSwitch = (key: keyof SettingsData, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // ── Save Settings ──────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(t("saveFail"));
      toast.success(t("saveOk"));
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: profileLanguageToLocale(settings.language),
        }),
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFail"));
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-emerald-500" />
          <h2 className="text-xl font-bold tracking-tight">{t("pageTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("pageDesc")}</p>
      </div>

      {/* ── Settings Card ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ── Email Notifications ──────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-emerald-500" />
              <h3 className="text-sm font-semibold">{t("emailSection")}</h3>
            </div>
            <div className="space-y-4 pl-6">
              <SwitchRow
                id="email-product-updates"
                label={t("productUpdates")}
                description={t("productUpdatesDesc")}
                checked={settings.emailProductUpdates}
                onCheckedChange={(v) =>
                  updateSwitch("emailProductUpdates", v)
                }
              />
              <SwitchRow
                id="email-security-alerts"
                label={t("securityAlerts")}
                description={t("securityAlertsDesc")}
                checked={settings.emailSecurityAlerts}
                onCheckedChange={(v) =>
                  updateSwitch("emailSecurityAlerts", v)
                }
              />
              <SwitchRow
                id="email-billing-reports"
                label={t("billingReports")}
                description={t("billingReportsDesc")}
                checked={settings.emailBillingReports}
                onCheckedChange={(v) =>
                  updateSwitch("emailBillingReports", v)
                }
              />
              <SwitchRow
                id="email-task-reminders"
                label={t("taskReminders")}
                description={t("taskRemindersDesc")}
                checked={settings.emailTaskReminders}
                onCheckedChange={(v) =>
                  updateSwitch("emailTaskReminders", v)
                }
              />
            </div>
          </div>

          <Separator />

          {/* ── Push Notifications ────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-emerald-500" />
              <h3 className="text-sm font-semibold">{t("pushSection")}</h3>
            </div>
            <div className="space-y-4 pl-6">
              <SwitchRow
                id="push-direct-messages"
                label={t("directMessages")}
                description={t("directMessagesDesc")}
                checked={settings.pushDirectMessages}
                onCheckedChange={(v) =>
                  updateSwitch("pushDirectMessages", v)
                }
              />
              <SwitchRow
                id="push-mentions"
                label={t("mentions")}
                description={t("mentionsDesc")}
                checked={settings.pushMentions}
                onCheckedChange={(v) => updateSwitch("pushMentions", v)}
              />
            </div>
          </div>

          <Separator />

          {/* ── Display ───────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-emerald-500" />
              <h3 className="text-sm font-semibold">{t("displaySection")}</h3>
            </div>
            <div className="pl-6">
              <div className="space-y-2">
                <Label htmlFor="settings-language">{t("languageLabel")}</Label>
                <Select
                  value={settings.language}
                  onValueChange={(v) =>
                    setSettings((prev) => ({ ...prev, language: v }))
                  }
                >
                  <SelectTrigger
                    id="settings-language"
                    className="w-full max-w-xs rounded-lg"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Save Button ──────────────────────────────────────── */}
          <div className="flex justify-end">
            <Button
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="mr-1 size-4" />
                  {t("saveChanges")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
