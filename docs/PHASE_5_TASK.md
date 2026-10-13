# Phase 5: Cart and Quantity Management

## Context
Phase 4 (Menu API) is complete. We now need to build the frontend Menu and Cart functionality.

## Scope
Implement Phase 5 ONLY: Cart and quantity management UI. 
Do NOT implement checkout, customer delivery details, order creation, order tracking, or new API endpoints.

## Requirements
- Display menu items fetched from `GET /api/menu`.
- Allow users to add items to the cart.
- Allow quantity increases and decreases.
- Prevent invalid quantities and remove items when their quantity reaches zero.
- Display each item's price, quantity, subtotal, and cart total.
- Handle menu-loading and error states.
- Keep cart state consistent across menu interactions (e.g., using React Context or similar state management).
- Make the interface responsive (usable on desktop and mobile).

## Constraints
- Reuse the existing stack and components where appropriate.
- Do not add dependencies without a clear need.
- Do not change Prisma schema, migrations, or seed data.
- Keep prices and monetary calculations consistent.

## TDD & Verification
1. Inspect the existing app structure and testing setup.
2. Write tests for the cart state and UI before implementing the functionality.
3. Run the focused tests, full test suite, TypeScript check, and ESLint.