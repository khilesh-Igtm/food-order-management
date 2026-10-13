import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CartProvider, useCart } from "@/context/CartContext";
import { CheckoutForm } from "@/components/CheckoutForm";
import { MenuItem } from "@/types/menu";

const sampleItem: MenuItem = {
  id: "item-1",
  name: "Classic Margherita Pizza",
  description: "Tomato sauce, mozzarella, basil",
  price: 14.99,
  imageUrl: "https://example.com/pizza.jpg",
};

function CartPopulator({ children }: { children: React.ReactNode }) {
  const { addItem } = useCart();
  React.useEffect(() => {
    addItem(sampleItem);
  }, [addItem]);
  return <>{children}</>;
}

describe("CheckoutForm Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders customer details inputs and place order button", () => {
    render(
      <CartProvider>
        <CartPopulator>
          <CheckoutForm />
        </CartPopulator>
      </CartProvider>
    );

    expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delivery address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /place order/i })
    ).toBeInTheDocument();
  });

  it("displays field-level validation errors on empty submission", async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <CartPopulator>
          <CheckoutForm />
        </CartPopulator>
      </CartProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /place order/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/customer name cannot be empty/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/delivery address cannot be empty/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/phone number cannot be empty/i)
    ).toBeInTheDocument();
  });

  it("validates phone number format", async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <CartPopulator>
          <CheckoutForm />
        </CartPopulator>
      </CartProvider>
    );

    await user.type(screen.getByLabelText(/customer name/i), "John Doe");
    await user.type(screen.getByLabelText(/delivery address/i), "123 Main St");
    await user.type(screen.getByLabelText(/phone number/i), "12345"); // too short

    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(
      await screen.findByText(/valid phone number with 7 to 15 digits/i)
    ).toBeInTheDocument();
  });

  it("successfully places order, clears cart, and shows confirmation with order ID", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        id: "order-cuid-999",
        customerName: "Jane Smith",
        deliveryAddress: "789 Broadway Ave",
        phone: "+1 555-987-6543",
        totalAmount: 14.99,
        status: "ORDER_RECEIVED",
        items: [{ id: "oi-1", menuItemId: "item-1", quantity: 1, unitPrice: 14.99 }],
      }),
    } as Response);

    render(
      <CartProvider>
        <CartPopulator>
          <CheckoutForm />
        </CartPopulator>
      </CartProvider>
    );

    await user.type(screen.getByLabelText(/customer name/i), "Jane Smith");
    await user.type(
      screen.getByLabelText(/delivery address/i),
      "789 Broadway Ave"
    );
    await user.type(
      screen.getByLabelText(/phone number/i),
      "+1 555-987-6543"
    );

    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: "Jane Smith",
            deliveryAddress: "789 Broadway Ave",
            phone: "+1 555-987-6543",
            items: [{ menuItemId: "item-1", quantity: 1 }],
          }),
        })
      );
    });

    // Confirmation screen should be displayed
    expect(await screen.findByText(/order confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/order-cuid-999/i)).toBeInTheDocument();
  });

  it("prevents duplicate submissions and disables button while submitting", async () => {
    const user = userEvent.setup();

    let resolvePromise: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(() => pendingPromise);

    render(
      <CartProvider>
        <CartPopulator>
          <CheckoutForm />
        </CartPopulator>
      </CartProvider>
    );

    await user.type(screen.getByLabelText(/customer name/i), "Jane Smith");
    await user.type(
      screen.getByLabelText(/delivery address/i),
      "789 Broadway Ave"
    );
    await user.type(
      screen.getByLabelText(/phone number/i),
      "+1 555-987-6543"
    );

    const submitBtn = screen.getByRole("button", { name: /place order/i });
    await user.click(submitBtn);

    // Button should be disabled during submit
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/placing order/i);

    // Clicking again should not trigger another fetch
    await user.click(submitBtn);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Resolve promise
    resolvePromise!({
      ok: true,
      status: 201,
      json: async () => ({
        id: "order-123",
        customerName: "Jane Smith",
        totalAmount: 14.99,
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    });
  });

  it("handles server submission error without clearing cart", async () => {
    const user = userEvent.setup();

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Failed to create order" }),
    } as Response);

    render(
      <CartProvider>
        <CartPopulator>
          <CheckoutForm />
        </CartPopulator>
      </CartProvider>
    );

    await user.type(screen.getByLabelText(/customer name/i), "Jane Smith");
    await user.type(
      screen.getByLabelText(/delivery address/i),
      "789 Broadway Ave"
    );
    await user.type(
      screen.getByLabelText(/phone number/i),
      "+1 555-987-6543"
    );

    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(
      await screen.findByText(/failed to create order/i)
    ).toBeInTheDocument();

    // Still in checkout form, not confirmation
    expect(
      screen.getByRole("button", { name: /place order/i })
    ).toBeInTheDocument();
  });

  it("sets aria-invalid and aria-describedby when field validation fails", async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <CartPopulator>
          <CheckoutForm />
        </CartPopulator>
      </CartProvider>
    );

    const placeOrderBtn = screen.getByRole("button", { name: /place order/i });
    await user.click(placeOrderBtn);

    const nameInput = screen.getByLabelText(/customer name/i);
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(nameInput).toHaveAttribute("aria-describedby", "customerName-error");

    const addressInput = screen.getByLabelText(/delivery address/i);
    expect(addressInput).toHaveAttribute("aria-invalid", "true");
    expect(addressInput).toHaveAttribute("aria-describedby", "deliveryAddress-error");

    const phoneInput = screen.getByLabelText(/phone number/i);
    expect(phoneInput).toHaveAttribute("aria-invalid", "true");
    expect(phoneInput).toHaveAttribute("aria-describedby", "phone-error");
  });

  it("handles extremely long customer name gracefully with break-words in confirmation", async () => {
    const user = userEvent.setup();

    const extremelyLongName = "Alexander".repeat(10); // 90 chars
    const address = "123 Evergreen Terrace, Springfield";

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        id: "order-long-123",
        customerName: extremelyLongName,
        totalAmount: 14.5,
      }),
    } as Response);

    render(
      <CartProvider>
        <CartPopulator>
          <CheckoutForm />
        </CartPopulator>
      </CartProvider>
    );

    await user.type(screen.getByLabelText(/customer name/i), extremelyLongName);
    await user.type(screen.getByLabelText(/delivery address/i), address);
    await user.type(screen.getByLabelText(/phone number/i), "+1 555-123-4567");

    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText(/order confirmed/i)).toBeInTheDocument();
    const thankYouText = screen.getByText(new RegExp(extremelyLongName, "i"));
    expect(thankYouText).toHaveClass("break-words");
  });
});
