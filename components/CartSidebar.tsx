"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { CheckoutForm } from "./CheckoutForm";

export function CartSidebar() {
  const { items, updateQuantity, removeItem, totalCount, totalAmount, clearCart } =
    useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  return (
    <aside
      data-testid="cart-sidebar"
      className="flex flex-col h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {isCheckingOut ? (
            <button
              type="button"
              onClick={() => setIsCheckingOut(false)}
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to cart
            </button>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Your Order
              </h2>
            </>
          )}
        </div>

        {!isCheckingOut && items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-medium text-zinc-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {isCheckingOut ? (
          <div className="pt-2">
            <CheckoutForm onCancel={() => setIsCheckingOut(false)} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
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
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <p className="mt-4 text-base font-medium text-zinc-700 dark:text-zinc-300">
              Your cart is empty
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Select dishes from the menu to build your feast.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(({ item, quantity }) => {
              const subtotal = Math.round(item.price * quantity * 100) / 100;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>${item.price.toFixed(2)} each</span>
                      <span>•</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Subtotal: ${subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                      >
                        -
                      </button>
                      <span className="min-w-[1.5rem] text-center text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, quantity + 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isCheckingOut && (
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>Total items</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {totalCount}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-zinc-50">
            <span>Total</span>
            <span data-testid="cart-total" className="text-xl text-orange-600">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCheckingOut(true)}
              className="w-full mt-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Proceed to Checkout
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
