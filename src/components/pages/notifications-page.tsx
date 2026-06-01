"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Bell, Search, BellOff, CheckCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { getIntlTag } from "@/lib/intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface Notification {
  id: string;
  iconClass: string;
  iconSymbol: string;
  title: string;
  message: string;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  count: number;
}

function NotificationCard({
  notification,
  formatRelative,
}: {
  notification: Notification;
  formatRelative: (dateStr: string) => string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 py-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-lg",
            notification.iconClass
          )}
        >
          {notification.iconSymbol}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">
            {notification.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground leading-snug">
            {notification.message}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formatRelative(notification.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-6 w-8 rounded-full" />
        <Skeleton className="ml-auto h-9 w-32" />
      </div>

      <Skeleton className="h-10 w-full sm:max-w-xs" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-start gap-4 py-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("notifications");
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <BellOff className="size-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold">{t("emptyTitle")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("emptyDesc")}
        </p>
      </CardContent>
    </Card>
  );
}

function NoResultsState({ query }: { query: string }) {
  const t = useTranslations("notifications");
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Search className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t("noMatchTitle")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("noMatchDesc", { query })}
        </p>
      </CardContent>
    </Card>
  );
}

export function NotificationsPage() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const intlTag = getIntlTag(locale);
  const tc = useTranslations("common");
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const formatRelative = useCallback(
    (dateStr: string) => {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);
      const diffWeek = Math.floor(diffDay / 7);

      if (diffSec < 60) return t("relativeJustNow");
      if (diffMin < 60) {
        return diffMin === 1
          ? t("relativeMinute")
          : t("relativeMinutes", { count: diffMin });
      }
      if (diffHr < 24) {
        return diffHr === 1
          ? t("relativeHour")
          : t("relativeHours", { count: diffHr });
      }
      if (diffDay < 2) return t("relativeYesterday");
      if (diffWeek < 1) return t("relativeDays", { count: diffDay });
      if (diffWeek < 2) return t("relativeLastWeek");
      return date.toLocaleDateString(intlTag, { month: "short", day: "numeric" });
    },
    [t, intlTag]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("fail");
      const json: NotificationsResponse = await res.json();
      setData(json);
    } catch {
      setData({ notifications: [], count: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredNotifications = useMemo(() => {
    if (!data?.notifications.length) return [];
    if (!search.trim()) return data.notifications;
    const q = search.toLowerCase();
    return data.notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-emerald-500" />
          <h2 className="text-xl font-bold tracking-tight">{t("title")}</h2>
          {data && data.count > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent"
            >
              {data.count}
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto rounded-lg"
          onClick={() => {}}
        >
          <CheckCheck className="size-4" />
          {tc("markAllRead")}
        </Button>
      </div>

      {!loading && data && data.notifications.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
      )}

      {loading && <NotificationsSkeleton />}

      {!loading && data && data.notifications.length === 0 && <EmptyState />}

      {!loading &&
        data &&
        data.notifications.length > 0 &&
        filteredNotifications.length === 0 && (
          <NoResultsState query={search} />
        )}

      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              formatRelative={formatRelative}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
