import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Kitchen simulator: calculate simulated status progression based on elapsed time since creation
    const now = Date.now();
    const createdTime = new Date(order.createdAt).getTime();
    const elapsedSeconds = (now - createdTime) / 1000;

    let currentStatus: OrderStatus = order.status;
    let newStatus: OrderStatus = currentStatus;

    if (currentStatus === "ORDER_RECEIVED" && elapsedSeconds > 30) {
      if (elapsedSeconds > 90) {
        newStatus = "DELIVERED";
      } else if (elapsedSeconds > 60) {
        newStatus = "OUT_FOR_DELIVERY";
      } else {
        newStatus = "PREPARING";
      }
    } else if (currentStatus === "PREPARING" && elapsedSeconds > 60) {
      if (elapsedSeconds > 90) {
        newStatus = "DELIVERED";
      } else {
        newStatus = "OUT_FOR_DELIVERY";
      }
    } else if (currentStatus === "OUT_FOR_DELIVERY" && elapsedSeconds > 90) {
      newStatus = "DELIVERED";
    }

    if (newStatus !== currentStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });
      currentStatus = newStatus;
    }

    return NextResponse.json(
      {
        id: order.id,
        customerName: order.customerName,
        deliveryAddress: order.deliveryAddress,
        phone: order.phone,
        totalAmount: Number(order.totalAmount),
        status: currentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((item) => {
          const unitPrice = Number(item.unitPrice);
          const subtotal = Math.round(unitPrice * item.quantity * 100) / 100;

          return {
            id: item.id,
            menuItemId: item.menuItemId,
            name: item.menuItem?.name,
            imageUrl: item.menuItem?.imageUrl,
            quantity: item.quantity,
            unitPrice: unitPrice,
            subtotal: subtotal,
          };
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to fetch order:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
