"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  CalendarDays,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileBarChart,
  BarChart3,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { translateExpenseCategory } from "@/lib/translate-category";
import { getDateFnsLocale, getIntlTag } from "@/lib/intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

// ─── Types ──────────────────────────────────────────────────────────
interface PropertyOption {
  id: string;
  title: string;
  status: string;
}

interface IncomeRecord {
  id: string;
  amount: number;
  date: string;
  description: string;
  property: { title: string };
  createdAt: string;
}

interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  property: { title: string };
  createdAt: string;
}

interface DailyRecord {
  date: string;
  income: number;
  expense: number;
  net: number;
}

interface ExpenseBreakdownItem {
  category: string;
  amount: number;
}

interface ReportsData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  expenseBreakdown: ExpenseBreakdownItem[];
  dailyData: DailyRecord[];
  recentTransactions: {
    date: string;
    description: string;
    propertyTitle: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
  }[];
  allTransactions: {
    incomes: IncomeRecord[];
    expenses: ExpenseRecord[];
  };
  occupancyRate: number;
  properties: PropertyOption[];
  from: string;
  to: string;
  rangeLabel: string;
}

type RangeType = "last30" | "q1" | "ytd" | "month" | "custom";

// ─── Constants ──────────────────────────────────────────────────────
const RANGE_OPTION_DEFS: { value: RangeType; labelKey: string }[] = [
  { value: "last30", labelKey: "rangeLast30" },
  { value: "q1", labelKey: "rangeQ1" },
  { value: "ytd", labelKey: "rangeYtd" },
  { value: "month", labelKey: "rangeMonth" },
  { value: "custom", labelKey: "rangeCustom" },
];

const EXPENSE_CATEGORIES = [
  "Cleaning",
  "Maintenance",
  "Utilities",
  "Insurance",
  "Other",
];

const PIE_COLORS = [
  "var(--color-emerald-500)",
  "var(--color-teal-500)",
  "var(--color-amber-500)",
  "var(--color-orange-500)",
  "var(--color-rose-500)",
  "var(--color-purple-500)",
  "var(--color-cyan-500)",
  "var(--color-lime-500)",
  "var(--color-fuchsia-500)",
  "var(--color-sky-500)",
];

// ─── Helpers ────────────────────────────────────────────────────────

function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function thirtyDaysAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return format(d, "yyyy-MM-dd");
}

// ─── Summary Card ───────────────────────────────────────────────────
interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subtext?: string;
  loading?: boolean;
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtext,
  loading,
}: SummaryCardProps) {
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 pt-0">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          <Icon className={cn("size-5", iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-8 w-28" />
          ) : (
            <>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
              {subtext && (
                <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────
function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
        <Skeleton className="ml-2 h-9 w-40" />
        <Skeleton className="ml-auto h-9 w-36" />
      </div>

      {/* Custom range skeleton */}
      <div className="flex flex-wrap items-end gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-start gap-4 pt-0">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-9 w-72" />

      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="ml-auto h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────
function EmptyState() {
  const t = useTranslations("reports");
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <FileBarChart className="size-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold">{t("emptyTitle")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("emptyDesc")}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Error State ────────────────────────────────────────────────────
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
          <TrendingDown className="size-4 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium text-destructive">
            {t("failedLoadTitle")}
          </p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto rounded-lg"
          onClick={onRetry}
        >
          {tc("retry")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip for Bar Chart ───────────────────────────────────
function BarChartCustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  const format = useFormatter();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block size-2 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>
          <span className="font-mono font-medium tabular-nums">
            {format.number(item.value, {
              style: "currency",
              currency: "EUR",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Tooltip for Pie Chart ───────────────────────────────────
function PieChartCustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { category: string; amount: number; percentage: number; fill?: string };
  }>;
}) {
  const tc = useTranslations("common");
  const format = useFormatter();
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = item.payload.percentage;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-1.5 font-medium">
        <span
          className="inline-block size-2 rounded-[2px]"
          style={{ backgroundColor: item.payload.fill || PIE_COLORS[0] }}
        />
        {item.name}
      </div>
      <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
        <span>{tc("amt")}</span>
        <span className="font-mono font-medium tabular-nums text-foreground">
          {format.number(item.value, {
            style: "currency",
            currency: "EUR",
          })}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-4 text-muted-foreground">
        <span>{tc("share")}</span>
        <span className="font-mono font-medium tabular-nums text-foreground">
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ─── Add Transaction Dialog ─────────────────────────────────────────
interface TransactionFormData {
  type: "INCOME" | "EXPENSE";
  propertyId: string;
  category: string;
  amount: string;
  date: string;
  description: string;
}

const EMPTY_TX_FORM: TransactionFormData = {
  type: "INCOME",
  propertyId: "",
  category: "Other",
  amount: "",
  date: todayStr(),
  description: "",
};

function AddTransactionDialog({
  open,
  onOpenChange,
  properties,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: PropertyOption[];
  onSubmitted: () => void;
}) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const [form, setForm] = useState<TransactionFormData>(EMPTY_TX_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_TX_FORM, date: todayStr() });
    }
  }, [open]);

  const updateField = <K extends keyof TransactionFormData>(
    key: K,
    value: TransactionFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyId) {
      toast.error(t("toastSelectProperty"));
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error(t("toastAmount"));
      return;
    }
    if (!form.date) {
      toast.error(t("toastDate"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          propertyId: form.propertyId,
          category: form.type === "EXPENSE" ? form.category : undefined,
          amount: Number(form.amount),
          date: form.date,
          description: form.description || undefined,
        }),
      });
      if (!res.ok) throw new Error(t("toastTxFail"));
      toast.success(
        form.type === "INCOME" ? t("toastIncomeOk") : t("toastExpenseOk")
      );
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("toastTxFail")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="space-y-2">
            <Label>{tc("type")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={form.type === "INCOME" ? "default" : "outline"}
                className={cn(
                  "rounded-lg",
                  form.type === "INCOME" &&
                    "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                onClick={() => updateField("type", "INCOME")}
              >
                <ArrowUpRight className="size-4" />
                {tc("income")}
              </Button>
              <Button
                type="button"
                variant={form.type === "EXPENSE" ? "default" : "outline"}
                className={cn(
                  "rounded-lg",
                  form.type === "EXPENSE" &&
                    "bg-red-600 hover:bg-red-700 text-white"
                )}
                onClick={() => updateField("type", "EXPENSE")}
              >
                <ArrowDownRight className="size-4" />
                {tc("expense")}
              </Button>
            </div>
          </div>

          {/* Property */}
          <div className="space-y-2">
            <Label htmlFor="tx-property">
              {tc("property")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.propertyId}
              onValueChange={(v) => updateField("propertyId", v)}
            >
              <SelectTrigger id="tx-property" className="w-full rounded-lg">
                <SelectValue placeholder={tc("selectProperty")} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category (expenses only) */}
          {form.type === "EXPENSE" && (
            <div className="space-y-2">
              <Label>{tc("category")}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField("category", v)}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`expenseCategoriesUi.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="tx-amount">
              {tc("amountEuro")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tx-amount"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              className="rounded-lg"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="tx-date">
              {tc("date")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tx-date"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="rounded-lg"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="tx-desc">{tc("description")}</Label>
            <Input
              id="tx-desc"
              type="text"
              placeholder={t("placeholderDesc")}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="rounded-lg"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? tc("saving") : tc("addTransaction")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Reports Page ─────────────────────────────────────────────
export function ReportsPage() {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const locale = useLocale();
  const intlTag = getIntlTag(locale);
  const dateFnsLocale = getDateFnsLocale(locale);

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(intlTag, {
        style: "currency",
        currency: "EUR",
      }),
    [intlTag]
  );

  const formatDateLabel = useCallback(
    (dateStr: string) => {
      try {
        return format(parseISO(dateStr), "d MMM", { locale: dateFnsLocale });
      } catch {
        return dateStr;
      }
    },
    [dateFnsLocale]
  );

  const formatDateFull = useCallback(
    (dateStr: string) => {
      try {
        return format(parseISO(dateStr), "d MMM yyyy", {
          locale: dateFnsLocale,
        });
      } catch {
        return dateStr;
      }
    },
    [dateFnsLocale]
  );

  const barChartConfig: ChartConfig = useMemo(
    () => ({
      income: {
        label: t("charts.income"),
        color: "var(--color-emerald-500)",
      },
      expense: {
        label: t("charts.expenses"),
        color: "var(--color-orange-500)",
      },
    }),
    [t]
  );

  const pieChartConfig: ChartConfig = useMemo(
    () => ({
      maintenance: {
        label: t("categories.maintenance"),
        color: "var(--color-emerald-500)",
      },
      utilities: {
        label: t("categories.utilities"),
        color: "var(--color-teal-500)",
      },
      insurance: {
        label: t("categories.insurance"),
        color: "var(--color-amber-500)",
      },
      management: {
        label: t("categories.management"),
        color: "var(--color-orange-500)",
      },
      cleaning: {
        label: t("categories.cleaning"),
        color: "var(--color-rose-500)",
      },
      repairs: {
        label: t("categories.repairs"),
        color: "var(--color-purple-500)",
      },
      taxes: {
        label: t("categories.taxes"),
        color: "var(--color-cyan-500)",
      },
      other: {
        label: t("categories.other"),
        color: "var(--color-lime-500)",
      },
    }),
    [t]
  );

  const incomeChartConfig: ChartConfig = useMemo(
    () => ({
      income: {
        label: t("charts.income"),
        color: "var(--color-emerald-500)",
      },
    }),
    [t]
  );

  // Data state
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [rangeType, setRangeType] = useState<RangeType>("last30");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState(thirtyDaysAgoStr());
  const [customTo, setCustomTo] = useState(todayStr());
  const [customApplied, setCustomApplied] = useState(false);

  // Dialog state
  const [txDialogOpen, setTxDialogOpen] = useState(false);

  // Available properties for the dialog dropdown
  const [dialogProperties, setDialogProperties] = useState<PropertyOption[]>(
    []
  );

  // ── Fetch Properties for Dialog ──────────────────────────────────
  const fetchPropertiesForDialog = useCallback(async () => {
    try {
      const res = await fetch("/api/properties?size=100");
      if (!res.ok) return;
      const json = await res.json();
      setDialogProperties(
        (json.properties || []).map((p: { id: string; title: string; status: string }) => ({
          id: p.id,
          title: p.title,
          status: p.status,
        }))
      );
    } catch {
      // Silently fail — dialog properties will be empty
    }
  }, []);

  useEffect(() => {
    fetchPropertiesForDialog();
  }, [fetchPropertiesForDialog]);

  // ── Data Fetching ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (rangeType === "custom" && customApplied) {
        params.set("from", customFrom);
        params.set("to", customTo);
      } else {
        params.set("range", rangeType);
      }

      if (selectedPropertyId !== "all") {
        params.set("propertyId", selectedPropertyId);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error(t("fetchFailed"));
      const json: ReportsData = await res.json();
      setData(json);

      // Also refresh dialog properties when data loads
      setDialogProperties(
        json.properties.map((p) => ({ id: p.id, title: p.title, status: p.status }))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : tc("unexpectedError")
      );
    } finally {
      setLoading(false);
    }
  }, [
    rangeType,
    selectedPropertyId,
    customFrom,
    customTo,
    customApplied,
    t,
    tc,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Custom Range Handlers ────────────────────────────────────────
  const handleApplyCustomRange = useCallback(() => {
    if (!customFrom || !customTo) {
      toast.error(t("toastBothDates"));
      return;
    }
    if (customFrom > customTo) {
      toast.error(t("toastDateOrder"));
      return;
    }
    setCustomApplied(true);
  }, [customFrom, customTo, t]);

  // Reset custom applied flag when switching away from custom
  useEffect(() => {
    if (rangeType !== "custom") {
      setCustomApplied(false);
    }
  }, [rangeType]);

  // ── Derived Data ─────────────────────────────────────────────────
  const pieData = useMemo(() => {
    if (!data?.expenseBreakdown.length) return [];
    const total = data.expenseBreakdown.reduce((s, e) => s + e.amount, 0);
    return data.expenseBreakdown.map((item) => ({
      category: translateExpenseCategory(item.category || "Other", (k) =>
        t(`categories.${k}`)
      ),
      amount: item.amount,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }));
  }, [data, t]);

  const incomes = data?.allTransactions.incomes || [];
  const expenses = data?.allTransactions.expenses || [];

  const expenseCategorySubtotals = useMemo(() => {
    if (!expenses.length) return [];
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const cat = e.category || "Other";
      map.set(cat, (map.get(cat) || 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // ── Property options from data ───────────────────────────────────
  const propertiesForFilter = data?.properties || [];

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Top Section: Date Range Filters ──────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Quick Range Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTION_DEFS.map((opt) => (
            <Button
              key={opt.value}
              variant={rangeType === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRangeType(opt.value)}
              className={cn(
                "rounded-lg",
                rangeType === opt.value &&
                  "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              <CalendarDays className="size-3.5" />
              {t(opt.labelKey)}
            </Button>
          ))}
        </div>

        {/* Property Dropdown */}
        <Select
          value={selectedPropertyId}
          onValueChange={(v) => setSelectedPropertyId(v)}
        >
          <SelectTrigger size="sm" className="w-[180px] rounded-lg">
            <Filter className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder={tc("allProperties")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("allProperties")}</SelectItem>
            {propertiesForFilter.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add Transaction Button */}
        <Button
          size="sm"
          className="ml-auto rounded-lg bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setTxDialogOpen(true)}
        >
          <Plus className="size-4" />
          {tc("addTransaction")}
        </Button>
      </div>

      {/* ── Custom Range Inputs ──────────────────────────────────── */}
      {rangeType === "custom" && (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{tc("from")}</Label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 w-40 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{tc("to")}</Label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 w-40 rounded-lg"
            />
          </div>
          <Button
            size="sm"
            onClick={handleApplyCustomRange}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
          >
            {tc("apply")}
          </Button>
          {data?.rangeLabel && (
            <span className="mb-0.5 ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {data.rangeLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Range Label (non-custom) ─────────────────────────────── */}
      {rangeType !== "custom" && data?.rangeLabel && !loading && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {data.rangeLabel}
        </div>
      )}

      {/* ── Error State ──────────────────────────────────────────── */}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* ── Loading State ────────────────────────────────────────── */}
      {loading && <ReportsSkeleton />}

      {/* ── Empty State ──────────────────────────────────────────── */}
      {!loading && !error && data && data.transactionCount === 0 && (
        <EmptyState />
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      {!loading && !error && data && data.transactionCount > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title={t("totalIncome")}
              value={formatCurrency(data.totalIncome)}
              icon={TrendingUp}
              iconBg="bg-emerald-500/10"
              iconColor="text-emerald-500"
              subtext={t("daysWithIncome", {
                count: data.dailyData.filter((d) => d.income > 0).length,
              })}
            />
            <SummaryCard
              title={t("totalExpenses")}
              value={formatCurrency(data.totalExpenses)}
              icon={TrendingDown}
              iconBg="bg-red-500/10"
              iconColor="text-red-500"
              subtext={t("categoriesCount", {
                count: data.expenseBreakdown.length,
              })}
            />
            <SummaryCard
              title={t("netBalance")}
              value={`${
                data.netBalance >= 0 ? "+" : "-"
              }${formatCurrency(Math.abs(data.netBalance))}`}
              icon={Wallet}
              iconBg="bg-teal-500/10"
              iconColor="text-teal-500"
              subtext={
                data.netBalance >= 0
                  ? t("profitablePeriod")
                  : t("deficitPeriod")
              }
            />
            <SummaryCard
              title={t("transactions")}
              value={String(data.transactionCount)}
              icon={Receipt}
              iconBg="bg-purple-500/10"
              iconColor="text-purple-500"
              subtext={t("txBreakdown", {
                incomes: incomes.length,
                expenses: expenses.length,
              })}
            />
          </div>

          {/* ── Tabs Section ──────────────────────────────────────── */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview" className="rounded-lg">
                <BarChart3 className="size-3.5" />
                {t("tabOverview")}
              </TabsTrigger>
              <TabsTrigger value="revenue" className="rounded-lg">
                <TrendingUp className="size-3.5" />
                {t("tabRevenue")}
              </TabsTrigger>
              <TabsTrigger value="expenses" className="rounded-lg">
                <TrendingDown className="size-3.5" />
                {t("tabExpenses")}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Overview ─────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-4">
              {/* Summary stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="py-3">
                  <CardContent className="flex flex-col items-center justify-center pt-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {tc("avgDailyIncome")}
                    </span>
                    <span className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        data.dailyData.length > 0
                          ? data.totalIncome / data.dailyData.length
                          : 0
                      )}
                    </span>
                  </CardContent>
                </Card>
                <Card className="py-3">
                  <CardContent className="flex flex-col items-center justify-center pt-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {tc("avgDailyExpense")}
                    </span>
                    <span className="mt-1 text-xl font-bold tabular-nums text-red-600 dark:text-red-400">
                      {formatCurrency(
                        data.dailyData.length > 0
                          ? data.totalExpenses / data.dailyData.length
                          : 0
                      )}
                    </span>
                  </CardContent>
                </Card>
                <Card className="py-3">
                  <CardContent className="flex flex-col items-center justify-center pt-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {tc("occupancyRate")}
                    </span>
                    <span className="mt-1 text-xl font-bold tabular-nums">
                      {data.occupancyRate.toFixed(1)}%
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Charts row */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Daily Financial Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("dailyOverviewTitle")}
                    </CardTitle>
                    <CardDescription>
                      {t("dailyOverviewDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={barChartConfig}
                      className="h-[300px] w-full"
                    >
                      <BarChart
                        data={data.dailyData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDateLabel}
                          tickLine={false}
                          axisLine={false}
                          className="text-xs"
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={(v: number) =>
                            `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                          }
                          tickLine={false}
                          axisLine={false}
                          className="text-xs"
                          width={52}
                        />
                        <Tooltip
                          content={<BarChartCustomTooltip />}
                          cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                          dataKey="income"
                          fill="var(--color-emerald-500)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={24}
                        />
                        <Bar
                          dataKey="expense"
                          fill="var(--color-orange-500)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={24}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Expense Breakdown Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("expenseBreakdownTitle")}
                    </CardTitle>
                    <CardDescription>
                      {t("expenseBreakdownDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pieData.length === 0 ? (
                      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                        {t("noExpenseData")}
                      </div>
                    ) : (
                      <ChartContainer
                        config={pieChartConfig}
                        className="h-[300px] w-full"
                      >
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="amount"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            strokeWidth={2}
                          >
                            {pieData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                className="stroke-background"
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<PieChartCustomTooltip />} />
                          <ChartLegend
                            content={<ChartLegendContent nameKey="category" />}
                          />
                        </PieChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Tab: Revenue ──────────────────────────────────── */}
            <TabsContent value="revenue" className="space-y-4">
              {/* Total Income Banner */}
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <TrendingUp className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("totalIncome")}
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(data.totalIncome)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent"
                  >
                    {incomes.length}{" "}
                    {incomes.length === 1
                      ? tc("transactionsSingular")
                      : tc("transactionsPlural")}
                  </Badge>
                </CardContent>
              </Card>

              {/* Income Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("incomeOverTimeTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("incomeOverTimeDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.dailyData.every((d) => d.income === 0) ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                      {t("noIncomeData")}
                    </div>
                  ) : (
                    <ChartContainer
                      config={incomeChartConfig}
                      className="h-[250px] w-full"
                    >
                      <LineChart
                        data={data.dailyData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDateLabel}
                          tickLine={false}
                          axisLine={false}
                          className="text-xs"
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={(v: number) =>
                            `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                          }
                          tickLine={false}
                          axisLine={false}
                          className="text-xs"
                          width={52}
                        />
                        <Tooltip content={<BarChartCustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="income"
                          stroke="var(--color-emerald-500)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: "var(--color-emerald-500)",
                          }}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Income Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("incomeTxTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("incomeTxDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {incomes.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                      {t("noIncomeTx")}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">{tc("date")}</TableHead>
                          <TableHead>{tc("description")}</TableHead>
                          <TableHead className="hidden sm:table-cell">
                            {tc("property")}
                          </TableHead>
                          <TableHead className="w-[120px] text-right">
                            {tc("amount")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomes.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-muted-foreground">
                              {formatDateFull(tx.date)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {tx.description}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Building2 className="size-3.5" />
                                {tx.property?.title}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(tx.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Expenses ─────────────────────────────────── */}
            <TabsContent value="expenses" className="space-y-4">
              {/* Total Expenses Banner */}
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                    <TrendingDown className="size-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("totalExpenses")}
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
                      {formatCurrency(data.totalExpenses)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-red-500/10 text-red-600 dark:text-red-400 border-transparent"
                  >
                    {expenses.length}{" "}
                    {expenses.length === 1
                      ? tc("transactionsSingular")
                      : tc("transactionsPlural")}
                  </Badge>
                </CardContent>
              </Card>

              {/* Larger Expense Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("expenseBreakdownTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("expenseBreakdownLargeDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                      {t("noExpenseData")}
                    </div>
                  ) : (
                    <ChartContainer
                      config={pieChartConfig}
                      className="mx-auto h-[350px] w-full max-w-md"
                    >
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={130}
                          paddingAngle={2}
                          strokeWidth={2}
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={`expense-cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                              className="stroke-background"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieChartCustomTooltip />} />
                        <ChartLegend
                          content={<ChartLegendContent nameKey="category" />}
                        />
                      </PieChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Category Subtotals */}
              {expenseCategorySubtotals.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {expenseCategorySubtotals.map((cat, i) => (
                    <Card key={cat.category} className="py-3">
                      <CardContent className="flex items-center gap-3 pt-0">
                        <div
                          className="size-3 rounded-full"
                          style={{
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {translateExpenseCategory(cat.category, (k) =>
                              t(`categories.${k}`)
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {data.totalExpenses > 0
                              ? (
                                  (cat.amount / data.totalExpenses) *
                                  100
                                ).toFixed(1)
                              : 0}
                            {tc("percentOfTotal")}
                          </p>
                        </div>
                        <span className="text-sm font-mono font-semibold tabular-nums text-red-600 dark:text-red-400">
                          {formatCurrency(cat.amount)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Expense Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("expenseTxTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("expenseTxDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {expenses.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                      {t("noExpenseTx")}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">{tc("date")}</TableHead>
                          <TableHead>{tc("category")}</TableHead>
                          <TableHead className="hidden md:table-cell">
                            {tc("description")}
                          </TableHead>
                          <TableHead className="hidden sm:table-cell">
                            {tc("property")}
                          </TableHead>
                          <TableHead className="w-[120px] text-right">
                            {tc("amount")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-muted-foreground">
                              {formatDateFull(tx.date)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="rounded-md text-xs font-medium"
                              >
                                {translateExpenseCategory(tx.category || "Other", (k) =>
                                  t(`categories.${k}`)
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-medium">
                              {tx.description}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Building2 className="size-3.5" />
                                {tx.property?.title}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium tabular-nums text-red-600 dark:text-red-400">
                              -{formatCurrency(tx.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* ── Add Transaction Dialog ──────────────────────────────── */}
      <AddTransactionDialog
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        properties={dialogProperties}
        onSubmitted={fetchData}
      />
    </div>
  );
}

export default ReportsPage;
