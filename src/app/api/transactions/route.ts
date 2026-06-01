import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/transactions?propertyId=&type=&from=&to=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const type = url.searchParams.get("type");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: Record<string, unknown> = { property: { userId } };
  if (propertyId) where.propertyId = propertyId;
  if (from && to) {
    where.date = { gte: from, lte: to };
  }

  const incomes = type && type !== "EXPENSE"
    ? await db.income.findMany({
        where: { ...where, ...(type === "INCOME" ? {} : { OR: [] }) },
        where: { property: { userId }, ...(propertyId ? { propertyId } : {}), ...(from && to ? { date: { gte: from, lte: to } } : {}) },
        include: { property: { select: { title: true } } },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        take: 50,
      })
    : [];

  const expenses = type && type !== "INCOME"
    ? await db.expense.findMany({
        where: { property: { userId }, ...(propertyId ? { propertyId } : {}), ...(from && to ? { date: { gte: from, lte: to } } : {}) },
        include: { property: { select: { title: true } } },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        take: 50,
      })
    : [];

  return NextResponse.json({ incomes, expenses });
}

// POST /api/transactions - Create income or expense
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const body = await req.json();
  const { type, propertyId, category, amount, date, description } = body;

  if (!type || !propertyId || !amount || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify property ownership
  const property = await db.property.findFirst({ where: { id: propertyId, userId } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (type === "INCOME") {
    const income = await db.income.create({
      data: { amount: parseFloat(amount), date, description: description || "Income", propertyId },
    });
    await db.notification.create({
      data: {
        title: "Income Recorded",
        message: `€${parseFloat(amount).toFixed(2)} income recorded for ${property.title}.`,
        iconClass: "bg-green-500",
        iconSymbol: "💰",
        userId,
      },
    });
    return NextResponse.json(income, { status: 201 });
  } else {
    const expense = await db.expense.create({
      data: { category: category || "Other", amount: parseFloat(amount), date, description: description || "Expense", propertyId },
    });
    await db.notification.create({
      data: {
        title: "Expense Recorded",
        message: `€${parseFloat(amount).toFixed(2)} expense recorded for ${property.title}.`,
        iconClass: "bg-orange-500",
        iconSymbol: "💳",
        userId,
      },
    });
    return NextResponse.json(expense, { status: 201 });
  }
}
