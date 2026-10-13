import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React, { ReactNode } from "react";
import { CartProvider, useCart } from "@/context/CartContext";
import { MenuItem } from "@/types/menu";

const mockItem1: MenuItem = {
  id: "item-1",
  name: "Classic Margherita Pizza",
  description: "Tomato sauce, mozzarella, basil",
  price: 14.99,
  imageUrl: "https://example.com/pizza.jpg",
};

const mockItem2: MenuItem = {
  id: "item-2",
  name: "Caesar Salad",
  description: "Romaine lettuce, parmesan, croutons",
  price: 11.5,
  imageUrl: "https://example.com/salad.jpg",
};

describe("CartContext", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  it("initializes with an empty cart and zero totals", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it("adds an item to the cart with initial quantity 1", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].item.id).toBe("item-1");
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalAmount).toBe(14.99);
  });

  it("increments quantity when the same item is added again", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
      result.current.addItem(mockItem1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalAmount).toBe(29.98);
  });

  it("handles multiple distinct items and calculates correct subtotal and total amount", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1); // 14.99 * 2 = 29.98
      result.current.addItem(mockItem1);
      result.current.addItem(mockItem2); // 11.50 * 1 = 11.50
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.totalCount).toBe(3);
    // 29.98 + 11.50 = 41.48
    expect(result.current.totalAmount).toBe(41.48);
  });

  it("updates item quantity with updateQuantity", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
      result.current.updateQuantity("item-1", 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalCount).toBe(5);
    expect(result.current.totalAmount).toBe(74.95);
  });

  it("removes item when quantity is decreased to 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
      result.current.updateQuantity("item-1", 0);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it("removes item directly using removeItem", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
      result.current.addItem(mockItem2);
      result.current.removeItem("item-1");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].item.id).toBe("item-2");
    expect(result.current.totalAmount).toBe(11.5);
  });

  it("clamps quantity to maximum limit of 99", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
      result.current.updateQuantity("item-1", 150);
    });

    expect(result.current.items[0].quantity).toBe(99);
  });

  it("clears entire cart using clearCart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
      result.current.addItem(mockItem2);
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it("correctly retrieves quantity for a specific item using getItemQuantity", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.getItemQuantity("item-1")).toBe(0);

    act(() => {
      result.current.addItem(mockItem1);
      result.current.addItem(mockItem1);
    });

    expect(result.current.getItemQuantity("item-1")).toBe(2);
    expect(result.current.getItemQuantity("item-2")).toBe(0);
  });
});
