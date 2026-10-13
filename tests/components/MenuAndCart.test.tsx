import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CartProvider } from "@/context/CartContext";
import { MenuCard } from "@/components/MenuCard";
import { CartSidebar } from "@/components/CartSidebar";
import { MenuList } from "@/components/MenuList";
import { MenuItem } from "@/types/menu";

const sampleItems: MenuItem[] = [
  {
    id: "item-1",
    name: "Classic Margherita Pizza",
    description: "Tomato sauce, mozzarella, basil",
    price: 14.99,
    imageUrl: "https://example.com/pizza.jpg",
  },
  {
    id: "item-2",
    name: "Caesar Salad",
    description: "Romaine lettuce, parmesan, croutons",
    price: 11.5,
    imageUrl: "https://example.com/salad.jpg",
  },
];

describe("MenuCard Component", () => {
  it("renders item name, description, and formatted price", () => {
    render(
      <CartProvider>
        <MenuCard item={sampleItems[0]} />
      </CartProvider>
    );

    expect(screen.getByText("Classic Margherita Pizza")).toBeInTheDocument();
    expect(
      screen.getByText("Tomato sauce, mozzarella, basil")
    ).toBeInTheDocument();
    expect(screen.getByText("$14.99")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add to cart/i })
    ).toBeInTheDocument();
  });

  it("adds item to cart and displays quantity controls", async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <MenuCard item={sampleItems[0]} />
      </CartProvider>
    );

    const addButton = screen.getByRole("button", { name: /add to cart/i });
    await user.click(addButton);

    // Quantity controls should appear
    expect(
      screen.getByRole("button", { name: /decrease/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /increase/i })
    ).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Clicking increase
    await user.click(screen.getByRole("button", { name: /increase/i }));
    expect(screen.getByText("2")).toBeInTheDocument();

    // Clicking decrease twice removes from cart and restores Add to Cart button
    await user.click(screen.getByRole("button", { name: /decrease/i }));
    expect(screen.getByText("1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /decrease/i }));
    expect(
      screen.getByRole("button", { name: /add to cart/i })
    ).toBeInTheDocument();
  });
});

describe("CartSidebar Component", () => {
  it("displays empty state when cart has no items", () => {
    render(
      <CartProvider>
        <CartSidebar />
      </CartProvider>
    );

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("displays items, unit prices, quantities, subtotals, and total amount", async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <MenuCard item={sampleItems[0]} />
        <MenuCard item={sampleItems[1]} />
        <CartSidebar />
      </CartProvider>
    );

    // Add first item (14.99)
    const addButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await user.click(addButtons[0]);

    // Add second item (11.50)
    await user.click(addButtons[1]);

    // Check cart sidebar displays both items
    const cartElement = screen.getByTestId("cart-sidebar");
    expect(cartElement).toHaveTextContent("Classic Margherita Pizza");
    expect(cartElement).toHaveTextContent("Caesar Salad");

    // Total should be 14.99 + 11.50 = 26.49
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$26.49");

    // Increase quantity of second item in sidebar
    const increaseButtons = screen.getAllByRole("button", {
      name: /increase quantity of caesar salad/i,
    });
    await user.click(increaseButtons[0]);

    // Total should be 14.99 + (11.50 * 2) = 37.99
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$37.99");
  });
});

describe("MenuList Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeleton while fetching menu items", () => {
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(
      <CartProvider>
        <MenuList />
      </CartProvider>
    );

    expect(screen.getByTestId("menu-loading")).toBeInTheDocument();
  });

  it("shows error state with retry button when fetch fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network Error"));

    render(
      <CartProvider>
        <MenuList />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load menu items/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Test retry
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleItems,
    } as Response);

    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Classic Margherita Pizza")).toBeInTheDocument();
    });
  });

  it("shows empty state if API returns no items", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    render(
      <CartProvider>
        <MenuList />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no menu items available/i)).toBeInTheDocument();
    });
  });

  it("renders menu items when fetch succeeds", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => sampleItems,
    } as Response);

    render(
      <CartProvider>
        <MenuList />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Classic Margherita Pizza")).toBeInTheDocument();
      expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    });
  });
});
