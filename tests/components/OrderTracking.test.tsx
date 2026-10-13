import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { OrderTrackingView } from "@/components/OrderTrackingView";

const mockOrder = {
  id: "order-test-123",
  customerName: "Alice Smith",
  deliveryAddress: "456 Maple Avenue, Apt 2B",
  phone: "+1 (555) 234-5678",
  totalAmount: 39.0,
  status: "PREPARING",
  createdAt: "2026-02-01T12:00:00Z",
  items: [
    {
      id: "item-1",
      name: "Classic Margherita Pizza",
      imageUrl: "https://example.com/pizza.jpg",
      quantity: 2,
      unitPrice: 14.5,
      subtotal: 29.0,
    },
    {
      id: "item-2",
      name: "Caesar Salad",
      imageUrl: "https://example.com/salad.jpg",
      quantity: 1,
      unitPrice: 10.0,
      subtotal: 10.0,
    },
  ],
};

describe("OrderTrackingView Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("displays loading state while fetching order details", () => {
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<OrderTrackingView orderId="order-test-123" />);

    expect(screen.getByTestId("order-loading")).toBeInTheDocument();
  });

  it("displays 404 error state when order does not exist", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Order not found" }),
    } as Response);

    render(<OrderTrackingView orderId="order-nonexistent" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /order not found/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /back to menu/i })).toBeInTheDocument();
  });

  it("displays order information, items receipt, and active status step", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOrder,
    } as Response);

    render(<OrderTrackingView orderId="order-test-123" />);

    await waitFor(() => {
      expect(screen.getByText(/order-test-123/i)).toBeInTheDocument();
    });

    // Customer & delivery details
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText(/456 Maple Avenue, Apt 2B/i)).toBeInTheDocument();

    // Line items receipt
    expect(screen.getByText("Classic Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    expect(screen.getByText("$39.00")).toBeInTheDocument();

    // Visual Status Tracker: "Preparing" should be highlighted as the active step
    const statusTracker = screen.getByTestId("status-tracker");
    expect(statusTracker).toHaveTextContent(/order received/i);
    expect(statusTracker).toHaveTextContent(/preparing/i);
    expect(statusTracker).toHaveTextContent(/out for delivery/i);
  });

  it("allows refreshing the order status", async () => {
    const user = userEvent.setup();

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOrder,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockOrder,
          status: "OUT_FOR_DELIVERY",
        }),
      } as Response);

    render(<OrderTrackingView orderId="order-test-123" />);

    await waitFor(() => {
      expect(screen.getByText(/preparing/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole("button", { name: /refresh status/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it("polls for order status every 5 seconds", async () => {
    vi.useFakeTimers();

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockOrder, status: "ORDER_RECEIVED" }),
      } as Response);

    render(<OrderTrackingView orderId="order-test-123" />);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance 5 seconds to trigger 1st poll
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Advance another 5 seconds to trigger 2nd poll
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("stops polling once order status reaches DELIVERED", async () => {
    vi.useFakeTimers();

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockOrder, status: "OUT_FOR_DELIVERY" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockOrder, status: "DELIVERED" }),
      } as Response);

    render(<OrderTrackingView orderId="order-test-123" />);

    // Initial render
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // First poll at 5s transitions to DELIVERED
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Advance another 15s (3 polling cycles) - no further fetches should occur
    await vi.advanceTimersByTimeAsync(15000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("cleans up polling interval on unmount", async () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOrder,
    } as Response);

    const { unmount } = render(<OrderTrackingView orderId="order-test-123" />);
    await vi.advanceTimersByTimeAsync(0);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("renders extremely long address and name with break-words to prevent overflow", async () => {
    const longName = "Bartholomew".repeat(8);
    const longAddress = "123 Supercalifragilisticexpialidocious Boulevard, Penthouse Suite 9999";

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ...mockOrder,
        customerName: longName,
        deliveryAddress: longAddress,
      }),
    } as Response);

    render(<OrderTrackingView orderId="order-test-123" />);

    await waitFor(() => {
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    const nameEl = screen.getByText(longName);
    expect(nameEl).toHaveClass("break-words");

    const addressEl = screen.getByText(longAddress);
    expect(addressEl).toHaveClass("break-words");
  });
});
