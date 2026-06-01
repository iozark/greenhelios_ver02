"use client";

import React, { useEffect, useState, useCallback } from "react";
import { User, Mail, Globe, Calendar, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { profileLanguageToLocale } from "@/i18n/config";
import { getIntlTag } from "@/lib/intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  language: string;
  timezone: string;
  dateFormat: string;
  createdAt?: string;
}

// ─── Constants ──────────────────────────────────────────────────────
const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "AUD", "CAD"];

const LANGUAGES = [
  "English (US)",
  "English (UK)",
  "Greek",
  "French",
  "German",
  "Spanish",
];

const TIMEZONES = [
  "UTC",
  "Europe/Athens",
  "Europe/London",
  "America/New_York",
  "Asia/Tokyo",
];

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

// ─── Loading Skeleton ──────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile header skeleton */}
      <Card>
        <CardContent className="flex items-center gap-6 py-6">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Form skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-28" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Profile Page ─────────────────────────────────────────────
export function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [language, setLanguage] = useState("English (US)");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // ── Fetch Profile ──────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error(t("loadFail"));
      const data: ProfileData = await res.json();
      setProfile(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
      setCurrency(data.currency);
      setLanguage(data.language);
      setTimezone(data.timezone);
      setDateFormat(data.dateFormat);
    } catch {
      toast.error(t("loadFail"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Save Profile ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          currency,
          language,
          timezone,
          dateFormat,
        }),
      });
      if (!res.ok) throw new Error(t("saveFail"));
      toast.success(t("saveOk"));
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: profileLanguageToLocale(language),
        }),
      });
      router.refresh();
      fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFail"));
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────
  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : "??";

  const memberSinceFormatted = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(getIntlTag(locale), {
        month: "long",
        year: "numeric",
      })
    : null;

  // ── Render ─────────────────────────────────────────────────────
  if (loading) return <ProfileSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Profile Header ──────────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row">
          {/* Avatar */}
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-2xl font-bold text-white shadow-lg shadow-emerald-500/25">
            {initials}
          </div>

          {/* User info */}
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight">
              {firstName} {lastName}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {email}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {memberSinceFormatted
                ? tc("memberSince", { date: memberSinceFormatted })
                : tc("na")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Edit Form ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-emerald-500" />
            {t("editTitle")}
          </CardTitle>
          <CardDescription>{t("editDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            {/* Name fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">
                  {t("firstName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first-name"
                  placeholder={t("firstNamePh")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">
                  {t("lastName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last-name"
                  placeholder={t("lastNamePh")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" />
                {t("email")}
              </Label>
              <Input
                id="email"
                value={email}
                disabled
                className="rounded-lg bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                {t("emailReadonly")}
              </p>
            </div>

            <Separator />

            {/* Preferences heading */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="size-4 text-emerald-500" />
                {t("preferences")}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("preferencesHint")}
              </p>
            </div>

            {/* Currency & Language */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("currency")}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("language")}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full rounded-lg">
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

            {/* Timezone & Date Format */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("timezone")}</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("dateFormat")}</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((df) => (
                      <SelectItem key={df} value={df}>
                        {df}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Save button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
