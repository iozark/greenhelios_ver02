import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";

// GET /api/settings
export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
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
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
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
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
