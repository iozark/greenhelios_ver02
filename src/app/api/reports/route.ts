import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";
import type { Prisma } from "@prisma/client";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// GET /api/reports?days=30&period=month&month=7&propertyId=&range=last30&from=&to=
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1), 10);
  const propertyId = url.searchParams.get("propertyId");
  const range = url.searchParams.get("range") || "last30";
  const customFrom = url.searchParams.get("from");
  const customTo = url.searchParams.get("to");

  const now = new Date();
  const year = now.getFullYear();
  let from: string;
  let to: string;

  if (customFrom && customTo) {
    from = customFrom;
    to = customTo;
  } else if (range === "last30") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    from = d.toISOString().split("T")[0];
    to = now.toISOString().split("T")[0];
  } else if (range === "q1") {
    from = `${year}-01-01`;
    to = `${year}-03-31`;
  } else if (range === "ytd") {
    from = `${year}-01-01`;
    to = now.toISOString().split("T")[0];
  } else if (range === "month") {
    const mm = String(month).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();
    from = `${year}-${mm}-01`;
    to = `${year}-${mm}-${lastDay}`;
  } else {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    from = d.toISOString().split("T")[0];
    to = now.toISOString().split("T")[0];
  }

  const propertyFilter: Prisma.PropertyWhereInput = { userId };
  if (propertyId) propertyFilter.id = propertyId;

  try {
    const [incomes, expenses, properties] = await Promise.all([
      db.income.findMany({
        where: { property: propertyFilter, date: { gte: from, lte: to } },
        include: { property: { select: { title: true } } },
        orderBy: { date: "desc" },
      }),
      db.expense.findMany({
        where: { property: propertyFilter, date: { gte: from, lte: to } },
        include: { property: { select: { title: true } } },
        orderBy: { date: "desc" },
      }),
      db.property.findMany({
        where: { userId },
        select: { id: true, title: true, status: true },
      }),
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const transactionCount = incomes.length + expenses.length;

    // Expense breakdown by category
    const categoryMap = new Map<string, number>();
    expenses.forEach((e) => {
      const cat = e.category || "Other";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + e.amount);
    });
    const expenseBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount: round2(amount),
    }));

    // Daily financial data — iterate dates without mutating the loop variable
    const dailyMap = new Map<string, { income: number; expense: number }>();
    const startMs = new Date(from).getTime();
    const endMs = new Date(to).getTime();
    for (let ms = startMs; ms <= endMs; ms += 86_400_000) {
      const key = new Date(ms).toISOString().split("T")[0];
      dailyMap.set(key, { income: 0, expense: 0 });
    }
    incomes.forEach((i) => {
      const entry = dailyMap.get(i.date);
      if (entry) entry.income += i.amount;
    });
    expenses.forEach((e) => {
      const entry = dailyMap.get(e.date);
      if (entry) entry.expense += e.amount;
    });
    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      income: round2(data.income),
      expense: round2(data.expense),
      net: round2(data.income - data.expense),
    }));

    // Recent transactions (limit 5)
    const recentTransactions = [
      ...incomes.slice(0, 5).map((i) => ({
        date: i.date,
        description: i.description || "Income",
        propertyTitle: i.property.title,
        type: "INCOME" as const,
        amount: i.amount,
      })),
      ...expenses.slice(0, 5).map((e) => ({
        date: e.date,
        description: e.description || "Expense",
        propertyTitle: e.property.title,
        type: "EXPENSE" as const,
        amount: e.amount,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    // Occupancy rate
    const occupiedCount = properties.filter((p) => p.status === "Occupied").length;
    const occupancyRate =
      properties.length > 0 ? Math.round((occupiedCount / properties.length) * 1000) / 10 : 0;

    return NextResponse.json({
      totalIncome: round2(totalIncome),
      totalExpenses: round2(totalExpenses),
      netBalance: round2(netBalance),
      transactionCount,
      expenseBreakdown,
      dailyData,
      recentTransactions,
      allTransactions: { incomes, expenses },
      occupancyRate,
      properties,
      from,
      to,
      rangeLabel: `${from} — ${to}`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
