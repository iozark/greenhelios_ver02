import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";
import bcrypt from "bcryptjs";

// POST /api/seed - Create default admin user
export async function POST(req: NextRequest) {
  try {
    const existing = await db.user.findUnique({
      where: { email: "admin@greenhelios.local" },
    });

    if (existing) {
      return NextResponse.json({ message: "Admin user already exists", user: { id: existing.id, email: existing.email } });
    }

    const passwordHash = await bcrypt.hash("admin123", 10);

    const user = await db.user.create({
      data: {
        email: "admin@greenhelios.local",
        passwordHash,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        currency: "EUR",
        language: "English (US)",
        timezone: "UTC",
        dateFormat: "DD/MM/YYYY",
      },
    });

    // Create some sample properties
    const properties = await Promise.all([
      db.property.create({
        data: {
          title: "Seaside Villa",
          location: "Santorini, Greece",
          category: "Residential",
          area: "150 m²",
          status: "Occupied",
          revenue: 3500,
          energyClass: "A+",
          bedrooms: 3,
          bathrooms: 2,
          occupants: 6,
          imageClass: "santorini",
          dateFrom: "2024-06-01",
          dateTo: "2024-09-30",
          userId: user.id,
        },
      }),
      db.property.create({
        data: {
          title: "Downtown Loft",
          location: "Athens, Greece",
          category: "Apartment",
          area: "85 m²",
          status: "Vacant",
          revenue: 1800,
          energyClass: "B",
          bedrooms: 2,
          bathrooms: 1,
          occupants: 4,
          imageClass: "loft",
          dateFrom: "2024-01-01",
          dateTo: "2024-12-31",
          userId: user.id,
        },
      }),
      db.property.create({
        data: {
          title: "Mountain Cabin",
          location: "Zakynthos, Greece",
          category: "Residential",
          area: "95 m²",
          status: "Maintenance",
          revenue: 2200,
          energyClass: "C",
          bedrooms: 2,
          bathrooms: 1,
          occupants: 4,
          imageClass: "cabin",
          dateFrom: "2024-05-01",
          dateTo: "2024-10-31",
          userId: user.id,
        },
      }),
      db.property.create({
        data: {
          title: "City Center Studio",
          location: "Thessaloniki, Greece",
          category: "Apartment",
          area: "45 m²",
          status: "Occupied",
          revenue: 950,
          energyClass: "B+",
          bedrooms: 1,
          bathrooms: 1,
          occupants: 2,
          imageClass: "modern",
          userId: user.id,
        },
      }),
    ]);

    // Create sample income records
    const incomeData = [
      { propertyId: properties[0].id, amount: 3500, date: "2024-07-01", description: "Monthly rental - July" },
      { propertyId: properties[0].id, amount: 3200, date: "2024-06-01", description: "Monthly rental - June" },
      { propertyId: properties[1].id, amount: 1800, date: "2024-07-01", description: "Monthly rental - July" },
      { propertyId: properties[1].id, amount: 1800, date: "2024-06-01", description: "Monthly rental - June" },
      { propertyId: properties[2].id, amount: 2200, date: "2024-06-01", description: "Monthly rental - June" },
      { propertyId: properties[3].id, amount: 950, date: "2024-07-01", description: "Monthly rental - July" },
      { propertyId: properties[3].id, amount: 950, date: "2024-06-01", description: "Monthly rental - June" },
      { propertyId: properties[0].id, amount: 400, date: "2024-07-15", description: "Cleaning fee" },
      { propertyId: properties[1].id, amount: 200, date: "2024-07-10", description: "Late checkout fee" },
    ];

    await Promise.all(
      incomeData.map((i) =>
        db.income.create({ data: i })
      )
    );

    // Create sample expense records
    const expenseData = [
      { propertyId: properties[0].id, category: "Maintenance", amount: 350, date: "2024-07-05", description: "Pool cleaning service" },
      { propertyId: properties[0].id, category: "Utilities", amount: 180, date: "2024-07-01", description: "Electricity bill" },
      { propertyId: properties[1].id, category: "Utilities", amount: 120, date: "2024-07-01", description: "Water & electricity" },
      { propertyId: properties[1].id, category: "Cleaning", amount: 80, date: "2024-07-03", description: "Deep cleaning" },
      { propertyId: properties[2].id, category: "Maintenance", amount: 500, date: "2024-06-15", description: "Roof repair" },
      { propertyId: properties[2].id, category: "Utilities", amount: 90, date: "2024-06-01", description: "Gas bill" },
      { propertyId: properties[3].id, category: "Cleaning", amount: 60, date: "2024-07-01", description: "Regular cleaning" },
      { propertyId: properties[3].id, category: "Insurance", amount: 150, date: "2024-07-01", description: "Property insurance" },
      { propertyId: properties[0].id, category: "Insurance", amount: 300, date: "2024-07-01", description: "Annual insurance" },
      { propertyId: properties[1].id, category: "Other", amount: 45, date: "2024-07-10", description: "Welcome basket supplies" },
    ];

    await Promise.all(
      expenseData.map((e) =>
        db.expense.create({ data: e })
      )
    );

    // Create sample notifications
    await Promise.all([
      db.notification.create({
        data: {
          title: "Property Created",
          message: "Seaside Villa has been added to your portfolio.",
          iconClass: "bg-blue-500",
          iconSymbol: "🏠",
          userId: user.id,
        },
      }),
      db.notification.create({
        data: {
          title: "Transaction Recorded",
          message: "Income of €3,500 received for Seaside Villa.",
          iconClass: "bg-green-500",
          iconSymbol: "💳",
          userId: user.id,
        },
      }),
      db.notification.create({
        data: {
          title: "Maintenance Alert",
          message: "Mountain Cabin is currently under maintenance.",
          iconClass: "bg-orange-500",
          iconSymbol: "🔧",
          userId: user.id,
        },
      }),
      db.notification.create({
        data: {
          title: "Welcome to GreenHelios",
          message: "Your account has been set up successfully. Start adding properties to manage your rental portfolio.",
          iconClass: "bg-emerald-500",
          iconSymbol: "👋",
          userId: user.id,
        },
      }),
    ]);

    return NextResponse.json({ message: "Seed data created successfully", userId: user.id });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}

// GET /api/seed - Check if seeded (requires auth)
export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const count = await db.user.count();
    return NextResponse.json({ userCount: count, seeded: count > 0 });
  } catch {
    return NextResponse.json({ error: "Failed to check seed status" }, { status: 500 });
  }
}
