"use client";

import React, { useState } from "react";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { MenuList } from "@/components/MenuList";
import { CartSidebar } from "@/components/CartSidebar";

function HomeContent() {
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <Navbar onToggleMobileCart={() => setMobileCartOpen((prev) => !prev)} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Our Culinary Selection
          </h2>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            Handcrafted dishes made from fresh, locally sourced ingredients. Add items to your cart to begin your order.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Menu Items Section */}
          <section className="lg:col-span-8">
            <MenuList />
          </section>

          {/* Desktop Cart Sidebar */}
          <section className="hidden lg:block lg:col-span-4 sticky top-24">
            <CartSidebar />
          </section>
        </div>
      </main>

      {/* Mobile Cart Drawer Overlay */}
      {mobileCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full p-4 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                Your Order
              </h3>
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                aria-label="Close cart"
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-2">
              <CartSidebar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <CartProvider>
      <HomeContent />
    </CartProvider>
  );
}
