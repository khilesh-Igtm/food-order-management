"use client";

import React from "react";
import { useCart } from "@/context/CartContext";

interface NavbarProps {
  onToggleMobileCart?: () => void;
}

export function Navbar({ onToggleMobileCart }: NavbarProps) {
  const { totalCount, totalAmount } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white font-bold text-lg shadow-sm">
            🍽️
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              Gourmet Kitchen
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Fresh & artisanal dishes
            </p>
          </div>
        </div>

        {/* Mobile Cart Button */}
        <button
          type="button"
          onClick={onToggleMobileCart}
          className="lg:hidden flex items-center gap-2 rounded-xl bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-95 transition-all"
          aria-label="View shopping cart"
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
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>{totalCount}</span>
          <span>•</span>
          <span>${totalAmount.toFixed(2)}</span>
        </button>
      </div>
    </header>
  );
}
