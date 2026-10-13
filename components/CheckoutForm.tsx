"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { createOrderSchema } from "@/lib/validations/order";

interface ConfirmedOrder {
  id: string;
  customerName: string;
  totalAmount?: number;
}

interface CheckoutFormProps {
  onSuccess?: (order: ConfirmedOrder) => void;
  onCancel?: () => void;
}

export function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const router = useRouter();
  const { items, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<{
    customerName?: string;
    deliveryAddress?: string;
    phone?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Reset previous errors
    setErrors({});

    // Validate payload client-side using createOrderSchema
    const payload = {
      customerName,
      deliveryAddress,
      phone,
      items: items.map((ci) => ({
        menuItemId: ci.item.id,
        quantity: ci.quantity,
      })),
    };

    const validation = createOrderSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: {
        customerName?: string;
        deliveryAddress?: string;
        phone?: string;
        general?: string;
      } = {};

      for (const issue of validation.error.issues) {
        const path = issue.path[0];
        if (path === "customerName" && !fieldErrors.customerName) {
          fieldErrors.customerName = issue.message;
        } else if (path === "deliveryAddress" && !fieldErrors.deliveryAddress) {
          fieldErrors.deliveryAddress = issue.message;
        } else if (path === "phone" && !fieldErrors.phone) {
          fieldErrors.phone = issue.message;
        } else if (!fieldErrors.general) {
          fieldErrors.general = issue.message;
        }
      }

      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          general: data.error || "Failed to create order. Please try again.",
        });
        return;
      }

      // Order created successfully!
      clearCart();
      setConfirmedOrder(data);
      onSuccess?.(data);
      router.push(`/orders/${data.id}`);
    } catch {
      setErrors({
        general: "A network error occurred while placing your order.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order is successfully confirmed, show the confirmation screen
  if (confirmedOrder) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h3 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Order Confirmed!
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 break-words">
          Thank you for your order, {confirmedOrder.customerName}.
        </p>

        <div className="mt-4 w-full rounded-xl bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700/60">
          <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Order Reference
          </span>
          <p className="mt-1 font-mono text-base font-bold text-orange-600 dark:text-orange-400 break-all">
            {confirmedOrder.id}
          </p>
        </div>

        <Link
          href={`/orders/${confirmedOrder.id}`}
          className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          Track Order Live →
        </Link>

        <button
          type="button"
          onClick={() => {
            setConfirmedOrder(null);
            setCustomerName("");
            setDeliveryAddress("");
            setPhone("");
            onCancel?.();
          }}
          className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
        >
          {errors.general}
        </div>
      )}

      <div>
        <label
          htmlFor="customerName"
          className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Customer Name
        </label>
        <input
          id="customerName"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          disabled={isSubmitting}
          aria-invalid={errors.customerName ? "true" : undefined}
          aria-describedby={errors.customerName ? "customerName-error" : undefined}
          placeholder="e.g. Jane Smith"
          className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.customerName
              ? "border-red-500 focus:border-red-500"
              : "border-zinc-300 dark:border-zinc-700 focus:border-orange-500"
          }`}
        />
        {errors.customerName && (
          <p id="customerName-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.customerName}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="deliveryAddress"
          className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Delivery Address
        </label>
        <textarea
          id="deliveryAddress"
          rows={3}
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          disabled={isSubmitting}
          aria-invalid={errors.deliveryAddress ? "true" : undefined}
          aria-describedby={errors.deliveryAddress ? "deliveryAddress-error" : undefined}
          placeholder="Street address, apartment, suite, unit, etc."
          className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.deliveryAddress
              ? "border-red-500 focus:border-red-500"
              : "border-zinc-300 dark:border-zinc-700 focus:border-orange-500"
          }`}
        />
        {errors.deliveryAddress && (
          <p id="deliveryAddress-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.deliveryAddress}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
          aria-invalid={errors.phone ? "true" : undefined}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          placeholder="e.g. +1 (555) 019-2834"
          className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.phone
              ? "border-red-500 focus:border-red-500"
              : "border-zinc-300 dark:border-zinc-700 focus:border-orange-500"
          }`}
        />
        {errors.phone && (
          <p id="phone-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.phone}
          </p>
        )}
      </div>

      <div className="pt-2 flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="flex-1 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Placing Order...</span>
            </>
          ) : (
            <span>Place Order</span>
          )}
        </button>
      </div>
    </form>
  );
}
