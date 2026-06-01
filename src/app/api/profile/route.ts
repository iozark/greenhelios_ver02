import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      currency: true,
      language: true,
      timezone: true,
      dateFormat: true,
      emailProductUpdates: true,
      emailSecurityAlerts: true,
      emailBillingReports: true,
      emailTaskReminders: true,
      pushDirectMessages: true,
      pushMentions: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT /api/profile
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const body = await req.json();
  const { firstName, lastName, currency, language, timezone, dateFormat } = body;

  const user = await db.user.update({
    where: { id: userId },
    data: { firstName, lastName, currency, language, timezone, dateFormat },
  });

  await db.notification.create({
    data: {
      title: "Profile Updated",
      message: "Your personal information has been updated successfully.",
      iconClass: "bg-blue-500",
      iconSymbol: "👤",
      userId,
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    currency: user.currency,
    language: user.language,
    timezone: user.timezone,
    dateFormat: user.dateFormat,
  });
}
