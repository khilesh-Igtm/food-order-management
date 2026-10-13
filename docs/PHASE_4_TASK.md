
# Phase 4: Menu API Implementation

## Context
Completed:
- Next.js 16.4 App Router
- PostgreSQL 17 and Prisma 6.19.3
- MenuItem, Order, and OrderItem models
- Eight seeded menu items
- Prisma singleton at lib/prisma.ts
- Zod validation in lib/validations/order.ts
- Vitest setup
- 23 passing validation tests
- API contract specifications in tests/api/contracts.test.ts

Read AGENTS.md and inspect the existing implementation before editing.

## Scope
Implement ONLY GET /api/menu in:
app/api/menu/route.ts

Do not implement order creation, order retrieval, status updates,
cart, checkout, or the menu UI.

## API requirements

Endpoint:
GET /api/menu

Success:
- HTTP 200
- Return menu items from Prisma.
- Use a stable documented response shape.
- Include id, name, description, price, and imageUrl.
- Convert Prisma Decimal prices to JSON-safe numbers, or use
  a documented string representation consistently.
- Sort menu items deterministically, such as by name.
- An empty menu should return HTTP 200 with an empty array.

Error:
- Return HTTP 500 if the database query fails.
- Return a generic error message.
- Never expose stack traces, SQL, credentials, or internal errors.
- Do not log secrets.

## TDD requirements

1. Inspect tests/api/contracts.test.ts and existing test setup.
2. Identify the existing skipped/todo menu contract tests.
3. Add or activate focused tests for GET /api/menu.
4. Mock the Prisma dependency for unit/API tests.
5. Test:
   - HTTP 200 and response shape
   - Price serialization
   - Empty menu
   - Database failure returns sanitized HTTP 500
6. Implement the endpoint and make the tests pass.
7. Do not activate unrelated order API tests prematurely.

If existing test configuration cannot test route handlers safely,
make the smallest justified configuration change. Keep React tests
in jsdom and server-side tests in a suitable Node environment.

## Architecture and security
- Use the existing lib/prisma.ts singleton.
- Use Next.js App Router Route Handler conventions.
- Do not create a separate Express server.
- Do not expose internal Prisma fields.
- Do not modify the Prisma schema or run migrations.
- Do not seed, reset, or mutate the database.
- Do not add unnecessary dependencies.
- Do not change unrelated project files.

## Verification
Run:
- Focused menu API tests
- npm.cmd run test:run
- npx.cmd tsc --noEmit
- npm.cmd run lint

If possible, verify GET /api/menu against the existing development
database without changing its contents.

## Definition of done
The menu endpoint works and tests cover success, empty results,
price serialization, and sanitized failure handling.

Report changed files, test counts, verification results, and any
remaining limitations. Do not claim unexecuted checks passed.
