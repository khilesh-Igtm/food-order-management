"use client";

import React from "react";
import Image from "next/image";
import { MenuItem } from "@/types/menu";
import { useCart } from "@/context/CartContext";

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const { addItem, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(item.id);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-3 right-3 rounded-full bg-black/75 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
          ${item.price.toFixed(2)}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {item.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {item.description}
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => addItem(item)}
              aria-label="Add to cart"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 active:scale-[0.98] shadow-sm"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, quantity - 1)}
                aria-label="Decrease quantity"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-sm transition-colors hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                <span className="sr-only">Decrease</span>
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
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <span className="font-semibold text-zinc-900 dark:text-zinc-100 px-2 min-w-[1.5rem] text-center">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => updateQuantity(item.id, quantity + 1)}
                aria-label="Increase quantity"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-sm transition-colors hover:bg-orange-700 active:scale-[0.98]"
              >
                <span className="sr-only">Increase</span>
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
