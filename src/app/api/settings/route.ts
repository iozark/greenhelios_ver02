import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      language: true,
      emailProductUpdates: true,
      emailSecurityAlerts: true,
      emailBillingReports: true,
      emailTaskReminders: true,
      pushDirectMessages: true,
      pushMentions: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const body = await req.json();

  const user = await db.user.update({
    where: { id: userId },
    data: {
      language: body.language,
      emailProductUpdates: body.emailProductUpdates,
      emailSecurityAlerts: body.emailSecurityAlerts,
      emailBillingReports: body.emailBillingReports,
      emailTaskReminders: body.emailTaskReminders,
      pushDirectMessages: body.pushDirectMessages,
      pushMentions: body.pushMentions,
    },
  });

  await db.notification.create({
    data: {
      title: "Settings Updated",
      message: "Your notification preferences have been saved.",
      iconClass: "bg-emerald-500",
      iconSymbol: "⚙",
      userId,
    },
  });

  return NextResponse.json({
    language: user.language,
    emailProductUpdates: user.emailProductUpdates,
    emailSecurityAlerts: user.emailSecurityAlerts,
    emailBillingReports: user.emailBillingReports,
    emailTaskReminders: user.emailTaskReminders,
    pushDirectMessages: user.pushDirectMessages,
    pushMentions: user.pushMentions,
  });
}
