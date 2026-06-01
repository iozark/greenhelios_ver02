import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/notifications
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
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
}
