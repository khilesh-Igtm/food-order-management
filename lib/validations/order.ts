import { z } from "zod";
import { OrderStatus } from "@prisma/client";

/**
 * Phone number validation:
 * Accepts numbers with optional country code (+), spaces, dashes, and parentheses.
 * Digits count must be between 7 and 15 (consistent with E.164 and local formats).
 */
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,25}$/;

export const phoneSchema = z
  .string({ message: "Phone number is required" })
  .trim()
  .min(1, "Phone number cannot be empty")
  .refine(
    (val) => {
      if (!PHONE_REGEX.test(val)) return false;
      const digits = val.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    },
    {
      message:
        "Please provide a valid phone number with 7 to 15 digits (e.g. +1 555-123-4567 or 5551234567)",
    }
  );

/**
 * Schema for an individual order item within a create-order request.
 *
 * Security:
 * - Uses `.strict()` to reject unexpected fields (such as client-supplied `unitPrice` or `price`).
 * - Prices MUST be fetched and applied server-side from the database MenuItem records.
 */
export const createOrderItemSchema = z
  .object({
    menuItemId: z
      .string({ message: "Menu item ID is required" })
      .trim()
      .min(1, "Menu item ID cannot be empty")
      .max(100, "Menu item ID is too long"),
    quantity: z
      .number({ message: "Quantity is required" })
      .int("Quantity must be an integer")
      .positive("Quantity must be greater than zero")
      .max(99, "Maximum quantity per item is 99"),
  })
  .strict();

/**
 * Schema for creating a new customer order.
 *
 * Security:
 * - Uses `.strict()`: Rejects client-supplied `totalAmount`, `status`, `id`, `unitPrice`, etc.
 * - Server will calculate `totalAmount` authoritatively using database MenuItem prices.
 */
export const createOrderSchema = z
  .object({
    customerName: z
      .string({ message: "Customer name is required" })
      .trim()
      .min(1, "Customer name cannot be empty")
      .max(100, "Customer name must not exceed 100 characters"),
    deliveryAddress: z
      .string({ message: "Delivery address is required" })
      .trim()
      .min(1, "Delivery address cannot be empty")
      .max(300, "Delivery address must not exceed 300 characters"),
    phone: phoneSchema,
    items: z
      .array(createOrderItemSchema, { message: "Items must be an array of order items" })
      .min(1, "Order must contain at least one item")
      .max(50, "Order cannot exceed 50 distinct items"),
  })
  .strict();

/**
 * Schema for updating an order's status.
 * Reuses Prisma's native OrderStatus enum.
 * Supported values: ORDER_RECEIVED, PREPARING, OUT_FOR_DELIVERY.
 */
export const updateOrderStatusSchema = z
  .object({
    status: z.nativeEnum(OrderStatus, {
      message: `Invalid status. Must be one of: ${Object.values(OrderStatus).join(", ")}`,
    }),
  })
  .strict();

/**
 * Inferred TypeScript types
 */
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
