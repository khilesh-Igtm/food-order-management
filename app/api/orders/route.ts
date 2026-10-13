import { NextResponse } from "next/server";
import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations/order";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { customerName, deliveryAddress, phone, items } =
      validationResult.data;

    // Collect all unique menu item IDs from order items
    const requestedItemIds = Array.from(
      new Set(items.map((i) => i.menuItemId))
    );

    // Fetch matching menu items from database to verify existence and get authoritative prices
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: requestedItemIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    // Check if any requested item is missing in the database
    const dbItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));
    for (const requestedId of requestedItemIds) {
      if (!dbItemMap.has(requestedId)) {
        return NextResponse.json(
          { error: `Menu item not found: ${requestedId}` },
          { status: 404 }
        );
      }
    }

    // Authoritatively calculate prices and totalAmount on the server
    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData = items.map((cartItem) => {
      const dbItem = dbItemMap.get(cartItem.menuItemId)!;
      const unitPrice = dbItem.price; // Prisma.Decimal from DB
      const lineTotal = unitPrice.mul(cartItem.quantity);
      totalAmount = totalAmount.add(lineTotal);

      return {
        menuItemId: cartItem.menuItemId,
        quantity: cartItem.quantity,
        unitPrice: unitPrice,
      };
    });

    // Save Order and OrderItems atomically inside a Prisma transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          customerName,
          deliveryAddress,
          phone,
          totalAmount,
          status: OrderStatus.ORDER_RECEIVED,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    return NextResponse.json(
      {
        id: newOrder.id,
        customerName: newOrder.customerName,
        deliveryAddress: newOrder.deliveryAddress,
        phone: newOrder.phone,
        totalAmount: Number(newOrder.totalAmount),
        status: newOrder.status,
        createdAt: newOrder.createdAt,
        items: newOrder.items.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    // Log error internally without exposing credentials, stack traces, or SQL
    console.error(
      "Failed to process order:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
