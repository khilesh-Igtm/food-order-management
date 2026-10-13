"use client";

import React, { useEffect, useState } from "react";
import { MenuItem } from "@/types/menu";
import { MenuCard } from "./MenuCard";

export function MenuList() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadMenu() {
      try {
        const response = await fetch("/api/menu");
        if (!response.ok) {
          throw new Error(`Failed to load menu items (HTTP ${response.status})`);
        }
        const data: MenuItem[] = await response.json();
        if (!ignore) {
          setItems(data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load menu items"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div data-testid="menu-loading" className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-80 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800/60"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Failed to load menu items
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-5 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 active:scale-[0.98]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
        <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
          No menu items available at this time.
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          Please check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} />
      ))}
    </div>
  );
}
