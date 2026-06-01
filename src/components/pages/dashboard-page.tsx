"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { translateExpenseCategory } from "@/lib/translate-category";
import { getDateFnsLocale, getIntlTag } from "@/lib/intl";

// ─── Types ──────────────────────────────────────────────────────────
interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  expenseBreakdown: { category: string; amount: number }[];
  dailyData: { date: string; income: number; expense: number; net: number }[];
  recentTransactions: {
    date: string;
    description: string;
    propertyTitle: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
  }[];
  occupancyRate: number;
  properties: { id: string; title: string; status: string }[];
  from: string;
  to: string;
  rangeLabel: string;
}

type PeriodType = "this-month" | "last-quarter" | "this-year";

// ─── Constants ──────────────────────────────────────────────────────
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

function buildQueryParams(period: PeriodType, selectedMonth: number): string {
  const now = new Date();
  const year = now.getFullYear();

  switch (period) {
    case "this-month":
      return `period=month&month=${selectedMonth}&range=month`;
    case "last-quarter": {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter;
      const quarterYear = currentQuarter === 0 ? year - 1 : year;
      const startMonth = (lastQuarter - 1) * 3 + 1;
      const endMonth = lastQuarter * 3;
      const lastDay = new Date(quarterYear, endMonth, 0).getDate();
      const from = `${quarterYear}-${String(startMonth).padStart(2, "0")}-01`;
      const to = `${quarterYear}-${String(endMonth).padStart(2, "0")}-${lastDay}`;
      return `from=${from}&to=${to}`;
    }
    case "this-year":
      return `range=ytd`;
    default:
      return `period=month&month=${selectedMonth}&range=month`;
  }
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

// ─── Loading Skeletons ──────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Period selector skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="ml-2 h-9 w-36" />
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

      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
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

      {/* Transactions skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="ml-auto h-4 w-20" />
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
  const t = useTranslations("dashboard");
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Wallet className="size-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{t("noDataTitle")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("noDataDesc")}
        </p>
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

// ─── Main Dashboard Page ────────────────────────────────────────────
export function DashboardPage() {
  const now = new Date();
  const t = useTranslations("dashboard");
  const tprop = useTranslations("properties");
  const tc = useTranslations("dashboard.categories");
  const tCharts = useTranslations("dashboard.charts");
  const tTx = useTranslations("dashboard.txTypes");
  const tcCommon = useTranslations("common");
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

  const barChartConfig: ChartConfig = React.useMemo(
    () => ({
      income: {
        label: tCharts("income"),
        color: "var(--color-emerald-500)",
      },
      expense: {
        label: tCharts("expenses"),
        color: "var(--color-orange-500)",
      },
    }),
    [tCharts]
  );

  const pieChartConfig: ChartConfig = React.useMemo(
    () => ({
      maintenance: {
        label: tc("maintenance"),
        color: "var(--color-emerald-500)",
      },
      utilities: { label: tc("utilities"), color: "var(--color-teal-500)" },
      insurance: { label: tc("insurance"), color: "var(--color-amber-500)" },
      management: {
        label: tc("management"),
        color: "var(--color-orange-500)",
      },
      cleaning: { label: tc("cleaning"), color: "var(--color-rose-500)" },
      repairs: { label: tc("repairs"), color: "var(--color-purple-500)" },
      taxes: { label: tc("taxes"), color: "var(--color-cyan-500)" },
      other: { label: tc("other"), color: "var(--color-lime-500)" },
    }),
    [tc]
  );

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>("this-month");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQueryParams(period, selectedMonth);
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error(t("fetchFailed"));
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : tcCommon("unexpectedError")
      );
    } finally {
      setLoading(false);
    }
  }, [period, selectedMonth, t, tcCommon]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pie chart data with percentages
  const pieData = useMemo(() => {
    if (!data?.expenseBreakdown.length) return [];
    const total = data.expenseBreakdown.reduce((s, e) => s + e.amount, 0);
    return data.expenseBreakdown.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }));
  }, [data]);

  const pieDataForChart = useMemo(
    () =>
      pieData.map((item) => ({
        ...item,
        categoryDisplay: translateExpenseCategory(item.category, (k) => tc(k)),
      })),
    [pieData, tc]
  );

  const periodLabels: Record<PeriodType, string> = {
    "this-month": t("periodThisMonth"),
    "last-quarter": t("periodLastQuarter"),
    "this-year": t("periodThisYear"),
  };

  function propertyStatusLabel(status: string) {
    if (status === "Occupied") return tprop("statusLabels.Occupied");
    if (status === "Vacant") return tprop("statusLabels.Vacant");
    if (status === "Maintenance") return tprop("statusLabels.Maintenance");
    return status;
  }

  const handlePeriodChange = (p: PeriodType) => {
    setPeriod(p);
  };

  return (
    <div className="space-y-6">
      {/* ── Period Selector ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(periodLabels) as PeriodType[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange(p)}
            className="rounded-lg"
          >
            <CalendarDays className="size-3.5" />
            {periodLabels[p]}
          </Button>
        ))}

        {period === "this-month" && (
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger size="sm" className="w-[150px] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {format(new Date(2024, i, 1), "LLLL", {
                    locale: dateFnsLocale,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {data?.rangeLabel && !loading && (
          <span className="ml-2 text-xs text-muted-foreground">
            {data.rangeLabel}
          </span>
        )}
      </div>

      {/* ── Error State ────────────────────────────────────────── */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="size-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-destructive">
                {t("failedLoad")}
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto rounded-lg"
              onClick={fetchData}
            >
              {tcCommon("retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Loading State ──────────────────────────────────────── */}
      {loading && <DashboardSkeleton />}

      {/* ── Empty State ────────────────────────────────────────── */}
      {!loading && !error && data && data.transactionCount === 0 && (
        <EmptyState />
      )}

      {/* ── Main Content ───────────────────────────────────────── */}
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
              subtext={t("recentCount", {
                count: data.recentTransactions.length,
              })}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Daily Financial Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("dailyOverviewTitle")}
                </CardTitle>
                <CardDescription>{t("dailyOverviewDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
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
                      tickFormatter={(v: number) => `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
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
                <CardDescription>{t("expenseBreakdownDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                    {t("noExpenseData")}
                  </div>
                ) : (
                  <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={pieDataForChart}
                        dataKey="amount"
                        nameKey="categoryDisplay"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        strokeWidth={2}
                      >
                        {pieDataForChart.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            className="stroke-background"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieChartCustomTooltip />} />
                      <ChartLegend
                        content={<ChartLegendContent nameKey="categoryDisplay" />}
                      />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("recentTxTitle")}</CardTitle>
              <CardDescription>{t("recentTxDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">{tcCommon("date")}</TableHead>
                    <TableHead>{t("colDescription")}</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {tcCommon("property")}
                    </TableHead>
                    <TableHead className="w-[100px]">{t("colType")}</TableHead>
                    <TableHead className="w-[120px] text-right">
                      {tcCommon("amount")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTransactions.map((tx, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">
                        {formatDateFull(tx.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.description}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3.5" />
                          {tx.propertyTitle}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "gap-1 rounded-md text-xs font-medium",
                            tx.type === "INCOME" &&
                              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
                            tx.type === "EXPENSE" &&
                              "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent"
                          )}
                        >
                          {tx.type === "INCOME" ? (
                            <ArrowUpRight className="size-3" />
                          ) : (
                            <ArrowDownRight className="size-3" />
                          )}
                          {tTx(tx.type)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono font-medium tabular-nums",
                          tx.type === "INCOME" && "text-emerald-600 dark:text-emerald-400",
                          tx.type === "EXPENSE" && "text-red-600 dark:text-red-400"
                        )}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Occupancy Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("occupancyTitle")}</CardTitle>
              <CardDescription>{t("occupancyDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold tabular-nums">
                      {data.occupancyRate.toFixed(1)}%
                    </span>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t("occupiedFraction", {
                        total: data.properties.length,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {data.properties.filter((p) => p.status === "Occupied").length} /{" "}
                      {data.properties.length}
                    </span>
                  </div>
                </div>
                <Progress value={data.occupancyRate} className="h-3" />
                <div className="flex flex-wrap gap-2">
                  {data.properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
                    >
                      <span
                        className={cn(
                          "inline-block size-2 rounded-full",
                          prop.status === "Occupied"
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/30"
                        )}
                      />
                      <span className="font-medium">{prop.title}</span>
                      <span
                        className={cn(
                          "text-muted-foreground",
                          prop.status === "Occupied"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : ""
                        )}
                      >
                        {propertyStatusLabel(prop.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
