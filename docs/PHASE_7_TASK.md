# Phase 7: Order Tracking and Status Management

## Context
Phases 1-6 are complete. The checkout process successfully creates orders using `POST /api/orders`. There are 7 remaining deferred tests in `tests/api/contracts.test.ts` for order retrieval and status updates.

## Scope
Implement `GET /api/orders/[id]`, `PATCH /api/orders/[id]/status`, and a frontend Order Tracking page.

## Requirements

### 1. API: `GET /api/orders/[id]`
- Retrieve an order by its `id` from the Prisma database.
- Include the associated `items` (OrderItems) and their nested `MenuItem` details (name, imageUrl) so the frontend can display the receipt.
- Return HTTP 200 with the order data.
- Return HTTP 404 if the order does not exist.
- Return HTTP 500 for database failures (sanitized).

### 2. API: `PATCH /api/orders/[id]/status`
- Validate the request body using the existing `updateOrderStatusSchema`.
- Update the order's status in the database.
- Return HTTP 200 with the updated order.
- Return HTTP 400 for invalid statuses.
- Return HTTP 404 if the order does not exist.
- Return HTTP 500 for database failures (sanitized).

### 3. UI: Order Tracking Page (`app/orders/[id]/page.tsx`)
- Create a dynamic route to display the order details.
- Fetch the order data client-side or server-side.
- Display the order ID, customer name, delivery address, and a list of purchased items with their snapshot unit prices and total.
- Display the current order status visually (e.g., a progress tracker for `ORDER_RECEIVED`, `PREPARING`, `OUT_FOR_DELIVERY`).
- Handle loading, error (404 Not Found), and success states.

## TDD & Verification
1. Activate the 7 remaining `todo` tests in `tests/api/contracts.test.ts` (GET and PATCH endpoints).
2. Write unit/integration tests for the Order Tracking UI.
3. Ensure the test suite mocks Prisma to avoid mutating the local database.
4. Run all tests, TypeScript validation, and ESLint.