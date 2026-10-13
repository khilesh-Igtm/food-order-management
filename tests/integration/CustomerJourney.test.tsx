import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import Home from "@/app/page";
import { OrderTrackingView } from "@/components/OrderTrackingView";
import { useRouter } from "next/navigation";

const mockMenuItems = [
  {
    id: "item-pizza-1",
    name: "Truffle Mushroom Pizza",
    description: "Wood-fired crust with wild mushrooms and truffle glaze",
    price: 18.5,
    imageUrl: "https://example.com/pizza.jpg",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "item-salad-2",
    name: "Mediterranean Caesar",
    description: "Crisp romaine, shaved parmesan, garlic croutons",
    price: 12.0,
    imageUrl: "https://example.com/salad.jpg",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
];

const mockPlacedOrder = {
  id: "order-journey-12345",
  customerName: "Alex Rivera",
  deliveryAddress: "123 Evergreen Terrace, Springfield",
  phone: "+1 555-432-1098",
  totalAmount: 30.5,
  status: "ORDER_RECEIVED",
};

const mockOrderDetails = {
  ...mockPlacedOrder,
  createdAt: "2026-02-01T12:00:00Z",
  items: [
    {
      id: "oi-1",
      menuItemId: "item-pizza-1",
      name: "Truffle Mushroom Pizza",
      imageUrl: "https://example.com/pizza.jpg",
      quantity: 1,
      unitPrice: 18.5,
      subtotal: 18.5,
    },
    {
      id: "oi-2",
      menuItemId: "item-salad-2",
      name: "Mediterranean Caesar",
      imageUrl: "https://example.com/salad.jpg",
      quantity: 1,
      unitPrice: 12.0,
      subtotal: 12.0,
    },
  ],
};

describe("End-to-End Customer Journey Integration", () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockClear();

    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("completes full happy path: browsing menu -> adding to cart -> checkout -> redirect -> tracking", async () => {
    const user = userEvent.setup();

    // Mock fetch for all endpoints involved in the flow
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;

      if (url.includes("/api/menu")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockMenuItems,
        } as Response;
      }

      if (url.includes("/api/orders") && !url.includes("order-journey-12345")) {
        return {
          ok: true,
          status: 201,
          json: async () => mockPlacedOrder,
        } as Response;
      }

      if (url.includes("/api/orders/order-journey-12345")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockOrderDetails,
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      } as Response;
    });

    // 1. Render the main store application
    const { unmount } = render(<Home />);

    // Verify menu items are displayed
    expect(await screen.findByText("Truffle Mushroom Pizza")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Caesar")).toBeInTheDocument();

    // Verify cart is initially empty
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();

    // 2. Add Truffle Mushroom Pizza to cart
    const addButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await user.click(addButtons[0]);

    // Add Mediterranean Caesar to cart
    await user.click(addButtons[1]);

    // 3. Verify Cart Sidebar updates with items and calculated total ($18.50 + $12.00 = $30.50)
    const cartTotal = screen.getByTestId("cart-total");
    expect(cartTotal).toHaveTextContent("$30.50");

    // 4. Transition from Cart to Checkout
    const checkoutButton = screen.getByRole("button", { name: /proceed to checkout/i });
    await user.click(checkoutButton);

    // Verify Checkout form fields are rendered
    const nameInput = screen.getByLabelText(/customer name/i);
    const addressInput = screen.getByLabelText(/delivery address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    expect(nameInput).toBeInTheDocument();

    // 5. Fill out checkout form with customer details
    await user.type(nameInput, "Alex Rivera");
    await user.type(addressInput, "123 Evergreen Terrace, Springfield");
    await user.type(phoneInput, "+1 555-432-1098");

    // 6. Submit the order
    const placeOrderButton = screen.getByRole("button", { name: /place order/i });
    await user.click(placeOrderButton);

    // Verify POST /api/orders request payload
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: "Alex Rivera",
            deliveryAddress: "123 Evergreen Terrace, Springfield",
            phone: "+1 555-432-1098",
            items: [
              { menuItemId: "item-pizza-1", quantity: 1 },
              { menuItemId: "item-salad-2", quantity: 1 },
            ],
          }),
        })
      );
    });

    // 7. Verify automatic redirect to Order Tracking page (/orders/[id])
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/orders/order-journey-12345");
    });

    // Verify confirmation banner with order reference and tracking button
    expect(await screen.findByText(/order confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/order-journey-12345/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /track order live/i })).toHaveAttribute(
      "href",
      "/orders/order-journey-12345"
    );

    // Unmount home page
    unmount();

    // 8. Render the Order Tracking page view for the created order
    render(<OrderTrackingView orderId="order-journey-12345" />);

    // Verify order tracking information renders correctly
    await waitFor(() => {
      expect(screen.getByText(/order-journey-12345/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText(/123 Evergreen Terrace, Springfield/i)).toBeInTheDocument();
    expect(screen.getByText("Truffle Mushroom Pizza")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Caesar")).toBeInTheDocument();
    expect(screen.getByText("$30.50")).toBeInTheDocument();

    // Verify visual progress tracker
    const statusTracker = screen.getByTestId("status-tracker");
    expect(statusTracker).toHaveTextContent(/order received/i);

    // Verify "Return to Menu" action is present
    const returnToMenuLink = screen.getByRole("link", { name: /return to menu/i });
    expect(returnToMenuLink).toBeInTheDocument();
    expect(returnToMenuLink).toHaveAttribute("href", "/");
  });

  it("allows the customer to cancel checkout and return to editing the cart", async () => {
    const user = userEvent.setup();

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockMenuItems,
    } as Response);

    render(<Home />);

    // Add item to cart
    expect(await screen.findByText("Truffle Mushroom Pizza")).toBeInTheDocument();
    const addButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await user.click(addButtons[0]);

    // Go to checkout
    const checkoutButton = screen.getByRole("button", { name: /proceed to checkout/i });
    await user.click(checkoutButton);
    expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();

    // Click "Back to cart"
    const backToCartButton = screen.getByRole("button", { name: /back to cart/i });
    await user.click(backToCartButton);

    // Verify cart is restored with item and total
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$18.50");
    expect(screen.queryByLabelText(/customer name/i)).not.toBeInTheDocument();
  });

  it("clears cart and resets form when customer chooses to place another order", async () => {
    const user = userEvent.setup();

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/api/menu")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockMenuItems,
        } as Response;
      }
      if (url.includes("/api/orders")) {
        return {
          ok: true,
          status: 201,
          json: async () => mockPlacedOrder,
        } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    render(<Home />);

    expect(await screen.findByText("Truffle Mushroom Pizza")).toBeInTheDocument();
    const addButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await user.click(addButtons[0]);

    await user.click(screen.getByRole("button", { name: /proceed to checkout/i }));

    await user.type(screen.getByLabelText(/customer name/i), "Alex Rivera");
    await user.type(screen.getByLabelText(/delivery address/i), "123 Evergreen Terrace");
    await user.type(screen.getByLabelText(/phone number/i), "+1 555-432-1098");

    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText(/order confirmed/i)).toBeInTheDocument();

    // Click "Place Another Order"
    const placeAnotherButton = screen.getByRole("button", { name: /place another order/i });
    await user.click(placeAnotherButton);

    // Cart should now be empty and ready for next order
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
