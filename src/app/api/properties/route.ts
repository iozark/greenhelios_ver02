import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";
import type { Prisma } from "@prisma/client";

const MAX_PAGE_SIZE = 100;

// GET /api/properties?page=0&size=6&q=&status=&category=
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "0", 10);
  const rawSize = parseInt(url.searchParams.get("size") || "6", 10);
  const size = Math.min(isNaN(rawSize) ? 6 : rawSize, MAX_PAGE_SIZE);
  const query = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const category = url.searchParams.get("category") || "";

  const where: Prisma.PropertyWhereInput = { userId };

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { location: { contains: query } },
      { category: { contains: query } },
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;

  try {
    const [properties, total, allUserProperties] = await Promise.all([
      db.property.findMany({
        where,
        skip: page * size,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      db.property.count({ where }),
      db.property.findMany({
        where: { userId },
        select: { id: true, title: true, status: true, revenue: true },
      }),
    ]);

    const occupiedCount = allUserProperties.filter((p) => p.status === "Occupied").length;
    const maintenanceCount = allUserProperties.filter((p) => p.status === "Maintenance").length;
    const estimatedRevenue = allUserProperties.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const occupancyRate =
      allUserProperties.length > 0
        ? Math.round((occupiedCount / allUserProperties.length) * 100 * 10) / 10
        : 0;

    return NextResponse.json({
      properties,
      total,
      totalPages: Math.ceil(total / size),
      currentPage: page,
      hasPrevious: page > 0,
      hasNext: page < Math.ceil(total / size) - 1,
      totalProperties: allUserProperties.length,
      occupiedCount,
      maintenanceCount,
      estimatedRevenue,
      occupancyRate,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

// POST /api/properties - Create property
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
    const body = await req.json();
    const imageClasses = ["santorini", "loft", "cabin", "modern", "apartment"];
    const randomImage = imageClasses[Math.floor(Math.random() * imageClasses.length)];

    const property = await db.property.create({
      data: {
        ...body,
        imageClass: body.imageClass || randomImage,
        userId,
      },
    });

    await db.notification.create({
      data: {
        title: "Property Created",
        message: `${property.title} has been added to your portfolio.`,
        iconClass: "bg-blue-500",
        iconSymbol: "🏠",
        userId,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}

// PUT /api/properties - Update property
export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
    const body = await req.json();
    const { id, ...data } = body;

    const existing = await db.property.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const property = await db.property.update({ where: { id }, data });
    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

// DELETE /api/properties?id=xxx
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { userId } = auth;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Property ID required" }, { status: 400 });
  }

  try {
    const existing = await db.property.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await db.property.delete({ where: { id } });

    await db.notification.create({
      data: {
        title: "Property Deleted",
        message: `${existing.title} has been removed from your portfolio.`,
        iconClass: "bg-red-500",
        iconSymbol: "🗑",
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
