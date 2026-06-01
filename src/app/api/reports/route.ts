import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/reports?days=30&period=month&month=7&propertyId=&range=last30&from=&to=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "30");
  const period = url.searchParams.get("period") || "month";
  const month = parseInt(url.searchParams.get("month") || new Date().getMonth() + 1);
  const propertyId = url.searchParams.get("propertyId");
  const range = url.searchParams.get("range") || "last30";
  const customFrom = url.searchParams.get("from");
  const customTo = url.searchParams.get("to");

  // Calculate date range
  let from: string;
  let to: string;
  const now = new Date();
  const year = now.getFullYear();

  if (customFrom && customTo) {
    from = customFrom;
    to = customTo;
  } else if (range === "last30") {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    from = thirtyDaysAgo.toISOString().split("T")[0];
    to = now.toISOString().split("T")[0];
  } else if (range === "q1") {
    from = `${year}-01-01`;
    to = `${year}-03-31`;
  } else if (range === "ytd") {
    from = `${year}-01-01`;
    to = now.toISOString().split("T")[0];
  } else if (range === "month") {
    from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    to = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  } else {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
    from = thirtyDaysAgo.toISOString().split("T")[0];
    to = now.toISOString().split("T")[0];
  }

  const propertyFilter: Record<string, unknown> = { userId };
  if (propertyId) propertyFilter.id = propertyId;

  const [incomes, expenses, properties] = await Promise.all([
    db.income.findMany({
      where: {
        property: propertyFilter,
        date: { gte: from, lte: to },
      },
      include: { property: { select: { title: true } } },
      orderBy: { date: "desc" },
    }),
    db.expense.findMany({
      where: {
        property: propertyFilter,
        date: { gte: from, lte: to },
      },
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
    amount: Math.round(amount * 100) / 100,
  }));

  // Daily financial data
  const dailyMap = new Map<string, { income: number; expense: number }>();
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, { income: 0, expense: 0 });
  }
  incomes.forEach((i) => {
    const key = i.date;
    if (dailyMap.has(key)) {
      const entry = dailyMap.get(key)!;
      entry.income += i.amount;
    }
  });
  expenses.forEach((e) => {
    const key = e.date;
    if (dailyMap.has(key)) {
      const entry = dailyMap.get(key)!;
      entry.expense += e.amount;
    }
  });
  const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    income: Math.round(data.income * 100) / 100,
    expense: Math.round(data.expense * 100) / 100,
    net: Math.round((data.income - data.expense) * 100) / 100,
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
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Occupancy rate
  const occupiedCount = properties.filter((p) => p.status === "Occupied").length;
  const occupancyRate = properties.length > 0 ? Math.round((occupiedCount / properties.length) * 1000) / 10 : 0;

  return NextResponse.json({
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
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
}
