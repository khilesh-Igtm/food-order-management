"use client";

import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { MenuItem } from "@/types/menu";
import { CartItem } from "@/types/cart";

const MAX_QUANTITY = 99;

export interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  totalCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = React.useCallback((item: MenuItem) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = Math.min(currentQty + 1, MAX_QUANTITY);
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      }

      return [...prevItems, { item, quantity: 1 }];
    });
  }, []);

  const removeItem = React.useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((ci) => ci.item.id !== itemId));
  }, []);

  const updateQuantity = React.useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }

      const clampedQuantity = Math.min(Math.floor(quantity), MAX_QUANTITY);

      setItems((prevItems) =>
        prevItems
          .map((ci) => {
            if (ci.item.id === itemId) {
              return { ...ci, quantity: clampedQuantity };
            }
            return ci;
          })
          .filter((ci) => ci.quantity > 0)
      );
    },
    [removeItem]
  );

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = React.useCallback(
    (itemId: string): number => {
      const found = items.find((ci) => ci.item.id === itemId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const totalCount = useMemo(() => {
    return items.reduce((sum, ci) => sum + ci.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    const rawTotal = items.reduce(
      (sum, ci) => sum + ci.quantity * ci.item.price,
      0
    );
    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(rawTotal * 100) / 100;
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemQuantity,
      totalCount,
      totalAmount,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemQuantity,
      totalCount,
      totalAmount,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
