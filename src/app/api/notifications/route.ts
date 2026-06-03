import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";

// GET /api/notifications
export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const views = notifications.map((n) => ({
      id: n.id,
      iconClass: n.iconClass,
      iconSymbol: n.iconSymbol,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ notifications: views, count: views.length });
  } catch {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
