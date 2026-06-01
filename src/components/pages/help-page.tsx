"use client";

import React, { useState, useMemo } from "react";
import {
  User,
  CreditCard,
  Shield,
  BarChart3,
  Building2,
  Rocket,
  Search,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TOPIC_META: {
  id:
    | "account-profile"
    | "billing-payments"
    | "security-privacy"
    | "reports-analytics"
    | "properties"
    | "getting-started";
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  tags: string[];
}[] = [
  {
    id: "account-profile",
    icon: User,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    tags: ["λογαριασμός", "προφίλ", "ρυθμίσεις"],
  },
  {
    id: "billing-payments",
    icon: CreditCard,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    tags: ["χρεώσεις", "πληρωμές", "έσοδα", "έξοδα"],
  },
  {
    id: "security-privacy",
    icon: Shield,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    tags: ["ασφάλεια", "απόρρητο", "κωδικός"],
  },
  {
    id: "reports-analytics",
    icon: BarChart3,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-500",
    tags: ["αναφορές", "γραφήματα", "ανάλυση"],
  },
  {
    id: "properties",
    icon: Building2,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    tags: ["ακίνητα", "διαχείριση"],
  },
  {
    id: "getting-started",
    icon: Rocket,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
    tags: ["έναρξη", "οδηγός"],
  },
];

interface HelpTopicView {
  id: string;
  title: string;
  description: string;
  content: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  tags: string[];
}

function HelpTopicCard({ topic }: { topic: HelpTopicView }) {
  const tc = useTranslations("common");
  const Icon = topic.icon;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              topic.iconBg
            )}
          >
            <Icon className={cn("size-5", topic.iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-tight">
              {topic.title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs leading-snug">
              {topic.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details" className="border-b-0">
            <AccordionTrigger className="py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:no-underline">
              {tc("learnMore")}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {topic.content}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function NoResultsState({ query }: { query: string }) {
  const t = useTranslations("help");
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Search className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t("noResultsTitle")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("noResultsDesc", { query })}
        </p>
      </CardContent>
    </Card>
  );
}

export function HelpPage() {
  const t = useTranslations("help");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");

  const topics: HelpTopicView[] = useMemo(
    () =>
      TOPIC_META.map((meta) => ({
        ...meta,
        title: t(`topics.${meta.id}.title`),
        description: t(`topics.${meta.id}.description`),
        content: t(`topics.${meta.id}.content`),
      })),
    [t]
  );

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return topics;
    const q = search.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(q) ||
        topic.description.toLowerCase().includes(q) ||
        topic.tags.some((tag) => tag.includes(q))
    );
  }, [topics, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight">{t("title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Badge
          variant="secondary"
          className="w-fit rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent"
        >
          <BookOpen className="mr-1 size-3" />
          {tc("articlesCount", { count: topics.length })}
        </Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-lg"
        />
      </div>

      {filteredTopics.length === 0 && <NoResultsState query={search} />}

      {filteredTopics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredTopics.map((topic) => (
            <HelpTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HelpPage;
