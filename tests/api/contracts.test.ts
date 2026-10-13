import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/orders/route";
import { GET as getOrder } from "@/app/api/orders/[id]/route";
import { PATCH as updateOrderStatus } from "@/app/api/orders/[id]/status/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    menuItem: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  default: {
    menuItem: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    customerName: "Alice Smith",
    deliveryAddress: "456 Maple Avenue, Apt 2B",
    phone: "+1 (555) 234-5678",
    items: [
      { menuItemId: "item-1", quantity: 2 },
      { menuItemId: "item-2", quantity: 1 },
    ],
  };

  const mockDbMenuItems = [
    {
      id: "item-1",
      name: "Margherita Pizza",
      price: new Prisma.Decimal("14.50"),
    },
    {
      id: "item-2",
      name: "Caesar Salad",
      price: new Prisma.Decimal("10.00"),
    },
  ];

  it("returns HTTP 201 with created order and items when payload is valid", async () => {
    vi.mocked(prisma.menuItem.findMany).mockResolvedValue(mockDbMenuItems as never);

    const createdOrder = {
      id: "order-cuid-123",
      customerName: "Alice Smith",
      deliveryAddress: "456 Maple Avenue, Apt 2B",
      phone: "+1 (555) 234-5678",
      totalAmount: new Prisma.Decimal("39.00"),
      status: OrderStatus.ORDER_RECEIVED,
      createdAt: new Date("2026-02-01T12:00:00Z"),
      updatedAt: new Date("2026-02-01T12:00:00Z"),
      items: [
        {
          id: "order-item-1",
          orderId: "order-cuid-123",
          menuItemId: "item-1",
          quantity: 2,
          unitPrice: new Prisma.Decimal("14.50"),
        },
        {
          id: "order-item-2",
          orderId: "order-cuid-123",
          menuItemId: "item-2",
          quantity: 1,
          unitPrice: new Prisma.Decimal("10.00"),
        },
      ],
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const tx = {
        order: {
          create: vi.fn().mockResolvedValue(createdOrder),
        },
      };
      return callback(tx as never);
    });

    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBe("order-cuid-123");
    expect(data.customerName).toBe("Alice Smith");
    expect(data.totalAmount).toBe(39);
    expect(data.status).toBe("ORDER_RECEIVED");
    expect(data.items).toHaveLength(2);
    expect(data.items[0]).toEqual({
      id: "order-item-1",
      menuItemId: "item-1",
      quantity: 2,
      unitPrice: 14.5,
    });
  });

  it("calculates totalAmount authoritatively on the server ignoring any client totals", async () => {
    vi.mocked(prisma.menuItem.findMany).mockResolvedValue(mockDbMenuItems as never);

    let recordedTotal: Prisma.Decimal | undefined;

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const tx = {
        order: {
          create: vi.fn().mockImplementation((args) => {
            recordedTotal = args.data.totalAmount;
            return {
              id: "order-calc-1",
              customerName: args.data.customerName,
              deliveryAddress: args.data.deliveryAddress,
              phone: args.data.phone,
              totalAmount: args.data.totalAmount,
              status: OrderStatus.ORDER_RECEIVED,
              createdAt: new Date(),
              items: [],
            };
          }),
        },
      };
      return callback(tx as never);
    });

    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    expect(Number(recordedTotal)).toBe(39);
  });

  it("returns HTTP 400 with validation details when request body is malformed", async () => {
    const invalidPayload = {
      customerName: "",
      deliveryAddress: "   ",
      phone: "123",
      items: [],
    };

    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
    expect(Array.isArray(data.details)).toBe(true);
    expect(data.details.length).toBeGreaterThan(0);
  });

  it("returns HTTP 400 when client attempts to inject unexpected fields (price, unitPrice, totalAmount)", async () => {
    const payloadWithInjectedFinancials = {
      ...validPayload,
      totalAmount: 1.0,
      items: [{ menuItemId: "item-1", quantity: 2, unitPrice: 0.5 }],
    };

    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithInjectedFinancials),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
  });

  it("returns HTTP 404 when one or more menuItemId items do not exist in the database", async () => {
    vi.mocked(prisma.menuItem.findMany).mockResolvedValue([mockDbMenuItems[0]] as never);

    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toContain("item-2");
  });

  it("returns HTTP 500 with sanitized message on database transaction failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(prisma.menuItem.findMany).mockResolvedValue(mockDbMenuItems as never);
    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Error("FATAL: relation 'Order' does not exist - password=secret_pw")
    );

    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toEqual({ error: "Failed to create order" });

    const jsonString = JSON.stringify(data);
    expect(jsonString).not.toContain("FATAL");
    expect(jsonString).not.toContain("secret_pw");

    consoleSpy.mockRestore();
  });
});

describe("GET /api/orders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockOrderWithItems = {
    id: "order-123",
    customerName: "Alice Smith",
    deliveryAddress: "456 Maple Avenue",
    phone: "+1 555-234-5678",
    totalAmount: new Prisma.Decimal("29.98"),
    status: OrderStatus.PREPARING,
    createdAt: new Date("2026-02-01T14:00:00Z"),
    updatedAt: new Date("2026-02-01T14:10:00Z"),
    items: [
      {
        id: "order-item-1",
        orderId: "order-123",
        menuItemId: "item-1",
        quantity: 2,
        unitPrice: new Prisma.Decimal("14.99"),
        menuItem: {
          name: "Classic Margherita Pizza",
          imageUrl: "https://example.com/pizza.jpg",
        },
      },
    ],
  };

  it("returns HTTP 200 with order details and associated order items for a valid order ID", async () => {
    // Only 10 seconds elapsed since creation (no simulated progression)
    vi.setSystemTime(new Date("2026-02-01T14:00:10Z"));
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrderWithItems as never);

    const request = new Request("http://localhost:3000/api/orders/order-123");
    const response = await getOrder(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBe("order-123");
    expect(data.customerName).toBe("Alice Smith");
    expect(data.totalAmount).toBe(29.98);
    expect(data.status).toBe("PREPARING");
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toEqual({
      id: "order-item-1",
      menuItemId: "item-1",
      name: "Classic Margherita Pizza",
      imageUrl: "https://example.com/pizza.jpg",
      quantity: 2,
      unitPrice: 14.99,
      subtotal: 29.98,
    });
  });

  it("does not advance status if 30 seconds have not elapsed for ORDER_RECEIVED", async () => {
    vi.setSystemTime(new Date("2026-02-01T14:00:20Z"));
    const orderReceived = {
      ...mockOrderWithItems,
      status: OrderStatus.ORDER_RECEIVED,
    };
    vi.mocked(prisma.order.findUnique).mockResolvedValue(orderReceived as never);

    const request = new Request("http://localhost:3000/api/orders/order-123");
    const response = await getOrder(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ORDER_RECEIVED");
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("advances status from ORDER_RECEIVED to PREPARING when > 30 seconds have elapsed", async () => {
    vi.setSystemTime(new Date("2026-02-01T14:00:35Z")); // 35s > 30s
    const orderReceived = {
      ...mockOrderWithItems,
      status: OrderStatus.ORDER_RECEIVED,
    };
    vi.mocked(prisma.order.findUnique).mockResolvedValue(orderReceived as never);
    vi.mocked(prisma.order.update).mockResolvedValue({
      ...orderReceived,
      status: OrderStatus.PREPARING,
    } as never);

    const request = new Request("http://localhost:3000/api/orders/order-123");
    const response = await getOrder(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("PREPARING");
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order-123" },
      data: { status: "PREPARING" },
    });
  });

  it("advances status from PREPARING to OUT_FOR_DELIVERY when > 60 seconds have elapsed since creation", async () => {
    vi.setSystemTime(new Date("2026-02-01T14:01:05Z")); // 65s > 60s
    const preparingOrder = {
      ...mockOrderWithItems,
      status: OrderStatus.PREPARING,
    };
    vi.mocked(prisma.order.findUnique).mockResolvedValue(preparingOrder as never);
    vi.mocked(prisma.order.update).mockResolvedValue({
      ...preparingOrder,
      status: OrderStatus.OUT_FOR_DELIVERY,
    } as never);

    const request = new Request("http://localhost:3000/api/orders/order-123");
    const response = await getOrder(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("OUT_FOR_DELIVERY");
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order-123" },
      data: { status: "OUT_FOR_DELIVERY" },
    });
  });

  it("advances status from OUT_FOR_DELIVERY to DELIVERED when > 90 seconds have elapsed since creation", async () => {
    vi.setSystemTime(new Date("2026-02-01T14:01:35Z")); // 95s > 90s
    const deliveryOrder = {
      ...mockOrderWithItems,
      status: OrderStatus.OUT_FOR_DELIVERY,
    };
    vi.mocked(prisma.order.findUnique).mockResolvedValue(deliveryOrder as never);
    vi.mocked(prisma.order.update).mockResolvedValue({
      ...deliveryOrder,
      status: OrderStatus.DELIVERED,
    } as never);

    const request = new Request("http://localhost:3000/api/orders/order-123");
    const response = await getOrder(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("DELIVERED");
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order-123" },
      data: { status: OrderStatus.DELIVERED },
    });
  });

  it("does not update database if order is already DELIVERED", async () => {
    vi.setSystemTime(new Date("2026-02-01T14:05:00Z"));
    const deliveredOrder = {
      ...mockOrderWithItems,
      status: OrderStatus.DELIVERED,
    };
    vi.mocked(prisma.order.findUnique).mockResolvedValue(deliveredOrder as never);

    const request = new Request("http://localhost:3000/api/orders/order-123");
    const response = await getOrder(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("DELIVERED");
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("returns HTTP 404 when requested order ID does not exist", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/orders/non-existent");
    const response = await getOrder(request, {
      params: Promise.resolve({ id: "non-existent" }),
    });

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Order not found");
  });

  it("returns HTTP 500 with sanitized error message on database failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(prisma.order.findUnique).mockRejectedValue(
      new Error("Database connection refused - root:secret_password")
    );

    const request = new Request("http://localhost:3000/api/orders/order-123");
    const response = await getOrder(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toEqual({ error: "Failed to fetch order" });

    const jsonString = JSON.stringify(data);
    expect(jsonString).not.toContain("secret_password");
    expect(jsonString).not.toContain("refused");

    consoleSpy.mockRestore();
  });
});

describe("PATCH /api/orders/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns HTTP 200 with updated order when status transition is valid", async () => {
    const existingOrder = {
      id: "order-123",
      status: OrderStatus.ORDER_RECEIVED,
    };

    const updatedOrder = {
      id: "order-123",
      customerName: "Alice Smith",
      deliveryAddress: "456 Maple Ave",
      phone: "+1 555-234-5678",
      totalAmount: new Prisma.Decimal("29.98"),
      status: OrderStatus.PREPARING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(existingOrder as never);
    vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as never);

    const request = new Request("http://localhost:3000/api/orders/order-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PREPARING" }),
    });

    const response = await updateOrderStatus(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBe("order-123");
    expect(data.status).toBe("PREPARING");
  });

  it("returns HTTP 400 when status is invalid, unsupported, or missing", async () => {
    const request = new Request("http://localhost:3000/api/orders/order-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "UNSUPPORTED_STATUS" }),
    });

    const response = await updateOrderStatus(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
  });

  it("returns HTTP 404 when target order ID does not exist", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/orders/order-999/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "OUT_FOR_DELIVERY" }),
    });

    const response = await updateOrderStatus(request, {
      params: Promise.resolve({ id: "order-999" }),
    });

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Order not found");
  });

  it("returns HTTP 500 with sanitized error message on database failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-123",
      status: OrderStatus.ORDER_RECEIVED,
    } as never);

    vi.mocked(prisma.order.update).mockRejectedValue(
      new Error("DB Deadlock error: sensitive_db_token")
    );

    const request = new Request("http://localhost:3000/api/orders/order-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "OUT_FOR_DELIVERY" }),
    });

    const response = await updateOrderStatus(request, {
      params: Promise.resolve({ id: "order-123" }),
    });

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toEqual({ error: "Failed to update order status" });

    const jsonString = JSON.stringify(data);
    expect(jsonString).not.toContain("sensitive_db_token");

    consoleSpy.mockRestore();
  });
});
