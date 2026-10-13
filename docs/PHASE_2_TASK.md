
# Phase 2: Project Inspection and Architecture

## Project
Food Order Management assessment.

## Existing environment
- Next.js 16.4.0
- React 19.3.0
- TypeScript
- Node.js 22.13.1
- npm 11.2.0
- Vitest 5.0.4
- React Testing Library configured
- ESLint and TypeScript checks currently pass
- No `src/` directory exists currently

## Assessment requirements
- Display menu items with name, description, price, and image.
- Allow users to add items to a cart and change quantities.
- Collect customer name, delivery address, and phone number.
- Place orders through REST API endpoints.
- Track order status: Order Received, Preparing, Out for Delivery.
- Simulate automatic order-status updates.
- Persist menu items and orders.
- Include tests for API endpoints and key functionality.

## Proposed data models
1. MenuItem
   - id, name, description, price, imageUrl

2. Order
   - id, customerName, deliveryAddress, phone,
     totalAmount, status, createdAt, updatedAt

3. OrderItem
   - id, orderId, menuItemId, quantity, unitPrice

OrderItem must preserve the unit price at purchase time.

## Proposed API endpoints
- GET /api/menu
- POST /api/orders
- GET /api/orders/[id]
- PATCH /api/orders/[id]/status

Use Next.js App Router route handlers.

## Current task: INSPECT ONLY
1. Inspect the existing project structure and package.json.
2. Inspect the current testing configuration and test files.
3. Check whether PostgreSQL tools are installed and whether a local PostgreSQL server appears to be available.
4. Check existing environment-variable files by filename only. Never display or expose secrets.
5. Identify the current Prisma-related dependencies, if any.
6. Recommend a compatible Prisma and PostgreSQL setup for this project.
7. Report any potential compatibility issues.

## Constraints
- Do not install, uninstall, or upgrade dependencies.
- Do not modify application code or configuration.
- Do not create database migrations.
- Do not overwrite existing files.
- Do not expose .env contents or credentials.
- Do not assume PostgreSQL is installed.
- Do not implement later phases.

## Deliverable
Report:
- Current project structure
- Existing configuration and test setup
- PostgreSQL availability findings
- Recommended Prisma version and setup
- Any blockers
- Exact proposed next steps

Wait for approval before making changes.
