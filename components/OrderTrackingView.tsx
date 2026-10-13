"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface OrderItemDetail {
  id: string;
  menuItemId: string;
  name?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  customerName: string;
  deliveryAddress: string;
  phone: string;
  totalAmount: number;
  status:
    | "ORDER_RECEIVED"
    | "PREPARING"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED";
  createdAt: string;
  items: OrderItemDetail[];
}

const STATUS_STEPS = [
  {
    key: "ORDER_RECEIVED",
    label: "Order Received",
    description: "Your order has been received and confirmed by the kitchen.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    key: "PREPARING",
    label: "Preparing",
    description: "Our chefs are freshly crafting and cooking your meal.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 012.343 5.657c0 2.12-.828 4.14-2.342 5.657z"
        />
      </svg>
    ),
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    description: "Your order is with the courier and headed straight to you.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
];

export function OrderTrackingView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function fetchOrderData() {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Order not found");
          }
          throw new Error(`Failed to load order (HTTP ${response.status})`);
        }
        const data: OrderDetail = await response.json();
        if (!ignore) {
          setOrder(data);
          setError(null);
          if (data.status === "DELIVERED" || data.status === "CANCELLED") {
            if (intervalId !== null) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load order");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchOrderData();

    intervalId = setInterval(fetchOrderData, 5000);

    return () => {
      ignore = true;
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [orderId, reloadKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setReloadKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div data-testid="order-loading" className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-zinc-200 rounded-lg dark:bg-zinc-800" />
        <div className="h-44 bg-zinc-100 rounded-2xl dark:bg-zinc-800/60" />
        <div className="h-64 bg-zinc-100 rounded-2xl dark:bg-zinc-800/60" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Order Not Found
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
          {error || "We could not find an order matching reference #" + orderId}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";

  const currentStepIndex = isDelivered
    ? STATUS_STEPS.length
    : STATUS_STEPS.findIndex((step) => step.key === order.status);

  return (
    <div className="space-y-8">
      {/* Top Banner / Order Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs uppercase font-bold tracking-wider ${
                isDelivered
                  ? "text-green-600 dark:text-green-400"
                  : isCancelled
                  ? "text-red-600 dark:text-red-400"
                  : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {isDelivered
                ? "Order Delivered"
                : isCancelled
                ? "Order Cancelled"
                : "Live Order Tracker"}
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
            #{order.id}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-orange-600" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Status
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            Return to Menu
          </Link>
        </div>
      </div>

      {/* Visual Progress Status Tracker */}
      <div
        data-testid="status-tracker"
        className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">
          Order Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`relative flex flex-col p-5 rounded-xl border transition-all ${
                  isCurrent
                    ? "border-orange-500 bg-orange-50/50 dark:border-orange-500/60 dark:bg-orange-950/20 shadow-sm"
                    : isCompleted
                    ? "border-green-200 bg-green-50/30 dark:border-green-900/40 dark:bg-green-950/10"
                    : "border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/30 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                      isCurrent
                        ? "bg-orange-600 text-white shadow-md animate-pulse"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Step {idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {step.label}
                    </h4>
                  </div>
                </div>

                <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>

                {isCurrent && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                    <span className="h-2 w-2 rounded-full bg-orange-600 animate-ping" />
                    Currently in progress
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer & Delivery Details and Receipt Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Customer & Delivery Info */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            Delivery Details
          </h3>

          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Customer
            </span>
            <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 break-words">
              {order.customerName}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Destination Address
            </span>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-0.5 whitespace-pre-wrap break-words">
              {order.deliveryAddress}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Contact Phone
            </span>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-0.5 font-mono">
              {order.phone}
            </p>
          </div>
        </div>

        {/* Ordered Items Receipt */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            Order Receipt ({order.items.length} items)
          </h3>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 py-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3.5 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.imageUrl && (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={item.imageUrl}
                        alt={item.name || "Menu item"}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.name || "Menu Item"}
                    </h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      ${item.unitPrice.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Total Amount
            </span>
            <span className="text-2xl font-extrabold text-orange-600">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
