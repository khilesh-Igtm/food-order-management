# Phase 6: Checkout and Order Submission

## Context
Phases 1-5 are complete. The Cart UI is functioning, state is managed, and Zod validation schemas are prepared in `lib/validations/order.ts`. 

## Scope
Implement `POST /api/orders` and the frontend checkout form.
Do NOT implement order tracking (`GET /api/orders/[id]`) or status updates (`PATCH`) in this phase.

## Requirements

### 1. API: `POST /api/orders`
- Validate incoming requests using `createOrderSchema`.
- **CRITICAL SECURITY:** Do not trust the client's cart total or unit prices. Fetch the current `price` for each `menuItemId` directly from the database.
- Calculate the `totalAmount` entirely on the server.
- Save the `Order` (with status `ORDER_RECEIVED`) and `OrderItems` (capturing the snapshot `unitPrice`) inside a Prisma `$transaction`.
- Return HTTP 201 with the newly created order ID and data.
- Handle database errors gracefully, returning HTTP 500 without leaking internal traces.

### 2. UI: Checkout Form
- Create `components/CheckoutForm.tsx` (or integrate it into the Cart sidebar/modal).
- Inputs: Customer Name, Delivery Address, Phone Number.
- Implement frontend validation that mirrors the Zod schema.
- Display loading states (disable the submit button while processing).
- Display error messages if the API rejects the payload.
- On successful submission: clear the cart using `clearCart()` and show a success confirmation containing the order ID.

## TDD & Verification
1. Activate the `POST /api/orders` tests currently marked as `todo` in `tests/api/contracts.test.ts`.
2. Write unit tests for the checkout form (input validation, submission state, success clearing).
3. Ensure the test suite mocks Prisma to avoid mutating the local database.
4. Run all tests, TypeScript validation, and ESLint.