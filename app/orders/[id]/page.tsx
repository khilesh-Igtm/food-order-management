import React, { Suspense } from "react";
import Link from "next/link";
import { OrderTrackingView } from "@/components/OrderTrackingView";

async function OrderContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderTrackingView orderId={id} />;
}

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white font-bold text-lg shadow-sm">
              🍽️
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                Gourmet Kitchen
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Fresh & artisanal dishes
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-zinc-600 hover:text-orange-600 dark:text-zinc-300 dark:hover:text-orange-400 transition-colors"
          >
            ← Return to Menu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div data-testid="order-loading" className="space-y-8 animate-pulse">
              <div className="h-10 w-64 bg-zinc-200 rounded-lg dark:bg-zinc-800" />
              <div className="h-44 bg-zinc-100 rounded-2xl dark:bg-zinc-800/60" />
              <div className="h-64 bg-zinc-100 rounded-2xl dark:bg-zinc-800/60" />
            </div>
          }
        >
          <OrderContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}
