import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusSchema } from "@/lib/validations/order";

export async function PATCH(
  request: Request,
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const validationResult = updateOrderStatusSchema.safeParse(body);
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

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: validationResult.data.status,
      },
    });

    return NextResponse.json(
      {
        id: updatedOrder.id,
        customerName: updatedOrder.customerName,
        deliveryAddress: updatedOrder.deliveryAddress,
        phone: updatedOrder.phone,
        totalAmount: Number(updatedOrder.totalAmount),
        status: updatedOrder.status,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to update order status:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
