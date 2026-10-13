import { describe, expect, it } from "vitest";
import { OrderStatus } from "@prisma/client";
import {
  createOrderItemSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  phoneSchema,
} from "@/lib/validations/order";

describe("Order Validation Schemas", () => {
  describe("phoneSchema", () => {
    it("accepts valid phone numbers across standard formats", () => {
      const validNumbers = [
        "+1 (555) 123-4567",
        "555-123-4567",
        "(555) 123-4567",
        "+91 98765 43210",
        "1234567890",
        "+44 20 7946 0958",
      ];

      for (const phone of validNumbers) {
        const result = phoneSchema.safeParse(phone);
        expect(result.success, `Expected "${phone}" to be valid`).toBe(true);
      }
    });

    it("rejects invalid phone numbers", () => {
      const invalidNumbers = [
        "", // empty
        "   ", // whitespace
        "12345", // too short (< 7 digits)
        "12345678901234567890", // too long (> 15 digits)
        "555-abc-4567", // contains letters
        "phone1234567", // letters and digits
        "+++5551234567", // invalid symbol format
      ];

      for (const phone of invalidNumbers) {
        const result = phoneSchema.safeParse(phone);
        expect(result.success, `Expected "${phone}" to be invalid`).toBe(false);
      }
    });
  });

  describe("createOrderItemSchema", () => {
    it("accepts valid order item payload", () => {
      const validItem = {
        menuItemId: "item-cuid-123",
        quantity: 2,
      };

      const result = createOrderItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          menuItemId: "item-cuid-123",
          quantity: 2,
        });
      }
    });

    it("trims whitespace from menuItemId", () => {
      const item = {
        menuItemId: "   item-cuid-123   ",
        quantity: 1,
      };

      const result = createOrderItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.menuItemId).toBe("item-cuid-123");
      }
    });

    it("rejects missing or empty menuItemId", () => {
      expect(createOrderItemSchema.safeParse({ quantity: 1 }).success).toBe(false);
      expect(
        createOrderItemSchema.safeParse({ menuItemId: "", quantity: 1 }).success
      ).toBe(false);
      expect(
        createOrderItemSchema.safeParse({ menuItemId: "   ", quantity: 1 }).success
      ).toBe(false);
    });

    it("rejects zero, negative, fractional, and excessive quantities", () => {
      const invalidQuantities = [
        0, // zero
        -1, // negative
        -10,
        1.5, // fractional
        0.5,
        100, // exceeds max limit of 99
        999,
      ];

      for (const qty of invalidQuantities) {
        const result = createOrderItemSchema.safeParse({
          menuItemId: "item-123",
          quantity: qty,
        });
        expect(result.success, `Expected quantity ${qty} to be invalid`).toBe(false);
      }
    });

    it("accepts boundary quantities", () => {
      expect(
        createOrderItemSchema.safeParse({ menuItemId: "item-123", quantity: 1 }).success
      ).toBe(true);
      expect(
        createOrderItemSchema.safeParse({ menuItemId: "item-123", quantity: 99 }).success
      ).toBe(true);
    });

    it("STRICT MODE: rejects unexpected client-supplied price and total fields", () => {
      const itemWithUnitPrice = {
        menuItemId: "item-123",
        quantity: 2,
        unitPrice: 15.99,
      };
      const resultUnitPrice = createOrderItemSchema.safeParse(itemWithUnitPrice);
      expect(resultUnitPrice.success).toBe(false);

      const itemWithPrice = {
        menuItemId: "item-123",
        quantity: 2,
        price: 15.99,
      };
      const resultPrice = createOrderItemSchema.safeParse(itemWithPrice);
      expect(resultPrice.success).toBe(false);
    });
  });

  describe("createOrderSchema", () => {
    const validOrderPayload = {
      customerName: "Jane Doe",
      deliveryAddress: "742 Evergreen Terrace, Springfield",
      phone: "+1 555-867-5309",
      items: [
        { menuItemId: "item-cuid-1", quantity: 2 },
        { menuItemId: "item-cuid-2", quantity: 1 },
      ],
    };

    it("accepts valid order payload and trims strings", () => {
      const payload = {
        ...validOrderPayload,
        customerName: "  Jane Doe  ",
        deliveryAddress: "  742 Evergreen Terrace, Springfield  ",
      };

      const result = createOrderSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerName).toBe("Jane Doe");
        expect(result.data.deliveryAddress).toBe(
          "742 Evergreen Terrace, Springfield"
        );
        expect(result.data.items).toHaveLength(2);
      }
    });

    it("rejects missing customerName", () => {
      const payloadWithoutCustomerName = {
        deliveryAddress: validOrderPayload.deliveryAddress,
        phone: validOrderPayload.phone,
        items: validOrderPayload.items,
      };
      expect(createOrderSchema.safeParse(payloadWithoutCustomerName).success).toBe(false);
    });

    it("rejects blank or whitespace-only customerName", () => {
      expect(
        createOrderSchema.safeParse({ ...validOrderPayload, customerName: "" }).success
      ).toBe(false);
      expect(
        createOrderSchema.safeParse({ ...validOrderPayload, customerName: "    " })
          .success
      ).toBe(false);
    });

    it("rejects excessive customerName length (> 100 characters)", () => {
      const longName = "A".repeat(101);
      expect(
        createOrderSchema.safeParse({ ...validOrderPayload, customerName: longName })
          .success
      ).toBe(false);
    });

    it("rejects missing deliveryAddress", () => {
      const payloadWithoutAddress = {
        customerName: validOrderPayload.customerName,
        phone: validOrderPayload.phone,
        items: validOrderPayload.items,
      };
      expect(createOrderSchema.safeParse(payloadWithoutAddress).success).toBe(false);
    });

    it("rejects blank or whitespace-only deliveryAddress", () => {
      expect(
        createOrderSchema.safeParse({ ...validOrderPayload, deliveryAddress: "" })
          .success
      ).toBe(false);
      expect(
        createOrderSchema.safeParse({ ...validOrderPayload, deliveryAddress: "    " })
          .success
      ).toBe(false);
    });

    it("rejects excessive deliveryAddress length (> 300 characters)", () => {
      const longAddress = "X".repeat(301);
      expect(
        createOrderSchema.safeParse({
          ...validOrderPayload,
          deliveryAddress: longAddress,
        }).success
      ).toBe(false);
    });

    it("rejects missing or invalid phone number", () => {
      const payloadWithoutPhone = {
        customerName: validOrderPayload.customerName,
        deliveryAddress: validOrderPayload.deliveryAddress,
        items: validOrderPayload.items,
      };
      expect(createOrderSchema.safeParse(payloadWithoutPhone).success).toBe(false);
      expect(
        createOrderSchema.safeParse({ ...validOrderPayload, phone: "invalid-phone" })
          .success
      ).toBe(false);
    });

    it("rejects empty items array", () => {
      expect(
        createOrderSchema.safeParse({ ...validOrderPayload, items: [] }).success
      ).toBe(false);
    });

    it("rejects missing items field", () => {
      const payloadWithoutItems = {
        customerName: validOrderPayload.customerName,
        deliveryAddress: validOrderPayload.deliveryAddress,
        phone: validOrderPayload.phone,
      };
      expect(createOrderSchema.safeParse(payloadWithoutItems).success).toBe(false);
    });

    it("rejects order items with invalid data", () => {
      const payloadWithInvalidItem = {
        ...validOrderPayload,
        items: [{ menuItemId: "", quantity: 0 }],
      };
      expect(createOrderSchema.safeParse(payloadWithInvalidItem).success).toBe(false);
    });

    it("STRICT MODE: rejects unexpected client-supplied totalAmount, price, or status fields", () => {
      // Client attempting to supply authoritative total
      const payloadWithTotal = {
        ...validOrderPayload,
        totalAmount: 99.99,
      };
      expect(createOrderSchema.safeParse(payloadWithTotal).success).toBe(false);

      // Client attempting to set status directly
      const payloadWithStatus = {
        ...validOrderPayload,
        status: "OUT_FOR_DELIVERY",
      };
      expect(createOrderSchema.safeParse(payloadWithStatus).success).toBe(false);

      // Client attempting to supply an ID
      const payloadWithId = {
        ...validOrderPayload,
        id: "custom-order-id",
      };
      expect(createOrderSchema.safeParse(payloadWithId).success).toBe(false);
    });
  });

  describe("updateOrderStatusSchema", () => {
    it("accepts all valid Prisma OrderStatus values", () => {
      const validStatuses = [
        OrderStatus.ORDER_RECEIVED,
        OrderStatus.PREPARING,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
      ];

      for (const status of validStatuses) {
        const result = updateOrderStatusSchema.safeParse({ status });
        expect(result.success, `Expected status ${status} to be valid`).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      }
    });

    it("rejects unsupported and invalid statuses", () => {
      const invalidStatuses = [
        "CANCELLED",
        "PENDING",
        "order_received",
        "",
        null,
        123,
      ];

      for (const status of invalidStatuses) {
        const result = updateOrderStatusSchema.safeParse({ status });
        expect(result.success, `Expected status ${status} to be rejected`).toBe(false);
      }
    });

    it("STRICT MODE: rejects unexpected extra fields", () => {
      const payloadWithExtra = {
        status: OrderStatus.PREPARING,
        note: "Rushing this order",
      };
      expect(updateOrderStatusSchema.safeParse(payloadWithExtra).success).toBe(false);
    });
  });
});
