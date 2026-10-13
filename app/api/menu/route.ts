import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface MenuItemResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

/**
 * GET /api/menu
 * Returns all available menu items sorted deterministically by name in ascending order.
 * Decimal prices are serialized to JSON-safe numbers.
 */
export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
      },
    });

    const menu: MenuItemResponse[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.imageUrl,
    }));

    return NextResponse.json(menu, { status: 200 });
  } catch (error) {
    // Log error internally without exposing details, SQL, or credentials to the client
    console.error("Error retrieving menu items:", error instanceof Error ? error.message : "Unknown error");

    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}
