import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/properties?page=0&size=6&q=&status=&category=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "0");
  const size = parseInt(url.searchParams.get("size") || "6");
  const query = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const category = url.searchParams.get("category") || "";

  const where: Record<string, unknown> = { userId };

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { location: { contains: query } },
      { category: { contains: query } },
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;

  const [properties, total] = await Promise.all([
    db.property.findMany({
      where,
      skip: page * size,
      take: size,
      orderBy: { createdAt: "desc" },
    }),
    db.property.count({ where }),
  ]);

  const allUserProperties = await db.property.findMany({
    where: { userId },
    select: { id: true, title: true, status: true, revenue: true },
  });

  const occupiedCount = allUserProperties.filter((p) => p.status === "Occupied").length;
  const maintenanceCount = allUserProperties.filter((p) => p.status === "Maintenance").length;
  const estimatedRevenue = allUserProperties.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const occupancyRate = allUserProperties.length > 0 ? Math.round((occupiedCount / allUserProperties.length) * 100 * 10) / 10 : 0;

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
}

// POST /api/properties - Create property
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
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
}

// PUT /api/properties - Update property
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const body = await req.json();
  const { id, ...data } = body;

  const existing = await db.property.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const property = await db.property.update({ where: { id }, data });
  return NextResponse.json(property);
}

// DELETE /api/properties?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const id = new URL(req.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Property ID required" }, { status: 400 });
  }

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
}
