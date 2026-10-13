
# Phase 3: Zod Validation and Test-Driven Development

## Context
The project has completed Phases 1A, 1B, and 2.

Existing stack:
- Next.js 16.4.0 App Router
- React 19.3.0
- TypeScript
- PostgreSQL 17
- Prisma and @prisma/client 6.19.3
- Vitest 5.0.4
- React Testing Library
- Existing Prisma models: MenuItem, Order, OrderItem
- Existing OrderStatus enum:
  ORDER_RECEIVED, PREPARING, OUT_FOR_DELIVERY

Read the existing prisma/schema.prisma, package.json,
vitest.config.mts, and relevant project instructions before editing.

## Objectives

### 1. Zod dependency
- Add Zod as a direct project dependency.
- Reuse the existing installed version if compatible.
- Do not upgrade unrelated packages.

### 2. Create validation schemas

Create a clearly organized validation module, preferably
lib/validations/order.ts.

Define schemas for:

A. Create order request
- customerName: required, trimmed, non-empty string
- deliveryAddress: required, trimmed, non-empty string
- phone: required, validated as a reasonable phone number
- items: non-empty array
- each item contains menuItemId and quantity
- menuItemId must be a non-empty string
- quantity must be a positive integer
- apply reasonable maximum lengths and quantities

B. Update order status request
- status must be one of the existing OrderStatus values
- reject all unsupported statuses

C. Menu item response or input schemas only if useful
for the existing architecture. Avoid unnecessary abstractions.

Important security rules:
- Never accept client-supplied unit prices or totalAmount
  as authoritative values.
- Prices and totals must eventually be calculated on the server.
- Do not query the database inside Zod schemas.
- Avoid duplicating the Prisma OrderStatus definition unnecessarily.

### 3. Add schema unit tests
Create focused Vitest tests covering:
- valid order payload
- missing customer name
- blank delivery address
- invalid phone number
- empty items array
- zero, negative, fractional, and excessive quantities
- missing menuItemId
- valid order status
- invalid order status
- unexpected client-supplied price or total fields

Document whether unexpected fields are stripped or rejected.
Prefer strict validation where appropriate for security-sensitive
request payloads.

### 4. Prepare API contract tests
Define the expected behavior for:
- GET /api/menu
- POST /api/orders
- GET /api/orders/[id]
- PATCH /api/orders/[id]/status

Test expectations should include:
- correct success response
- malformed input returns HTTP 400
- missing resources return HTTP 404
- invalid status updates are rejected
- database failures do not expose internal details

Do not build route handlers in this phase.

If the route handlers do not exist yet, clearly separate pending
API tests from runnable schema tests. Do not add fake production
implementations just to make tests pass.

### 5. Testing requirements
- Use the existing Vitest setup.
- Keep browser-based tests in jsdom where appropriate.
- Use a Node environment for server-side tests when necessary.
- Mock database dependencies in unit/API tests where appropriate.
- Do not connect tests to or mutate the real development database.
- Keep the existing Counter test passing.

## Scope restrictions
- Do not implement API route handlers.
- Do not build the UI, cart, or checkout.
- Do not modify the database schema or run migrations.
- Do not reseed or reset the database.
- Do not alter existing Prisma configuration unless necessary
  and explicitly justified.
- Do not introduce authentication or unrelated features.

## Definition of done
- Zod is declared as a direct dependency.
- Validation schemas are implemented and documented.
- Schema tests pass.
- API contract expectations are documented or prepared for TDD.
- Existing Counter test still passes.
- TypeScript and ESLint pass.
- Report changed files and exact test results.
- Clearly identify any API tests intentionally deferred
  because route handlers do not exist yet.
