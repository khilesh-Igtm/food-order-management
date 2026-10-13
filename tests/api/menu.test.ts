import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/menu/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    menuItem: {
      findMany: vi.fn(),
    },
  },
  default: {
    menuItem: {
      findMany: vi.fn(),
    },
  },
}));

describe("GET /api/menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns HTTP 200 with all menu items and expected fields", async () => {
    const mockDbItems = [
      {
        id: "item-1",
        name: "Classic Margherita Pizza",
        description: "Fresh mozzarella, tomato sauce, basil",
        price: new Prisma.Decimal("14.99"),
        imageUrl: "https://example.com/pizza.jpg",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        id: "item-2",
        name: "Truffle Mushroom Burger",
        description: "Beef patty with truffle aioli",
        price: new Prisma.Decimal("16.50"),
        imageUrl: "https://example.com/burger.jpg",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];

    vi.mocked(prisma.menuItem.findMany).mockResolvedValue(mockDbItems);

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);

    expect(data[0]).toEqual({
      id: "item-1",
      name: "Classic Margherita Pizza",
      description: "Fresh mozzarella, tomato sauce, basil",
      price: 14.99,
      imageUrl: "https://example.com/pizza.jpg",
    });

    // Ensure internal fields are not exposed
    expect(data[0]).not.toHaveProperty("createdAt");
    expect(data[0]).not.toHaveProperty("updatedAt");

    // Ensure deterministic ordering query was sent to Prisma
    expect(prisma.menuItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      })
    );
  });

  it("correctly serializes prices as JSON-safe numbers", async () => {
    const mockDbItems = [
      {
        id: "item-price-1",
        name: "Budget Item",
        description: "Low cost item",
        price: new Prisma.Decimal("5.00"),
        imageUrl: "https://example.com/cheap.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "item-price-2",
        name: "Premium Item",
        description: "High end item",
        price: new Prisma.Decimal("99.99"),
        imageUrl: "https://example.com/premium.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.menuItem.findMany).mockResolvedValue(mockDbItems);

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data[0].price).toBe(5);
    expect(typeof data[0].price).toBe("number");
    expect(data[1].price).toBe(99.99);
    expect(typeof data[1].price).toBe("number");
  });

  it("returns HTTP 200 with an empty array when the menu is empty", async () => {
    vi.mocked(prisma.menuItem.findMany).mockResolvedValue([]);

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it("returns HTTP 500 with sanitized error message on database failure", async () => {
    // Suppress console.error in test output for expected error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(prisma.menuItem.findMany).mockRejectedValue(
      new Error("FATAL: Database connection timeout at 127.0.0.1:5432 - credentials secret")
    );

    const response = await GET();
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toEqual({ error: "Failed to fetch menu items" });

    // Verify internal sensitive details are NEVER leaked in response
    const jsonString = JSON.stringify(data);
    expect(jsonString).not.toContain("FATAL");
    expect(jsonString).not.toContain("5432");
    expect(jsonString).not.toContain("credentials");
    expect(jsonString).not.toContain("secret");

    consoleSpy.mockRestore();
  });
});
