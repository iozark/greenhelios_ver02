import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";

// GET /api/transactions?propertyId=&type=&from=&to=
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const type = url.searchParams.get("type");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const baseWhere = {
    property: { userId },
    ...(propertyId ? { propertyId } : {}),
    ...(from && to ? { date: { gte: from, lte: to } } : {}),
  };

  try {
    const [incomes, expenses] = await Promise.all([
      type !== "EXPENSE"
        ? db.income.findMany({
            where: baseWhere,
            include: { property: { select: { title: true } } },
            orderBy: [{ date: "desc" }, { id: "desc" }],
            take: 50,
          })
        : Promise.resolve([]),
      type !== "INCOME"
        ? db.expense.findMany({
            where: baseWhere,
            include: { property: { select: { title: true } } },
            orderBy: [{ date: "desc" }, { id: "desc" }],
            take: 50,
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ incomes, expenses });
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

// POST /api/transactions - Create income or expense
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
    const body = await req.json();
    const { type, propertyId, category, amount, date, description } = body;

    if (!type || !propertyId || !amount || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const property = await db.property.findFirst({ where: { id: propertyId, userId } });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const parsedAmount = parseFloat(amount);

    if (type === "INCOME") {
      const income = await db.income.create({
        data: { amount: parsedAmount, date, description: description || "Income", propertyId },
      });
      await db.notification.create({
        data: {
          title: "Income Recorded",
          message: `€${parsedAmount.toFixed(2)} income recorded for ${property.title}.`,
          iconClass: "bg-green-500",
          iconSymbol: "💰",
          userId,
        },
      });
      return NextResponse.json(income, { status: 201 });
    } else {
      const expense = await db.expense.create({
        data: {
          category: category || "Other",
          amount: parsedAmount,
          date,
          description: description || "Expense",
          propertyId,
        },
      });
      await db.notification.create({
        data: {
          title: "Expense Recorded",
          message: `€${parsedAmount.toFixed(2)} expense recorded for ${property.title}.`,
          iconClass: "bg-orange-500",
          iconSymbol: "💳",
          userId,
        },
      });
      return NextResponse.json(expense, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
