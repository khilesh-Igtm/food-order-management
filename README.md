# Gourmet Kitchen — Food Order Management System

A production-ready, full-stack food ordering and real-time tracking web application built with **Next.js 16 (App Router, Turbopack, and Partial Prerendering)**, **React 19**, **TypeScript**, **PostgreSQL 17**, **Prisma ORM**, and **Vitest**.

---

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architectural Decisions & Security Design](#architectural-decisions--security-design)
5. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
6. [Database Setup & Seeding](#database-setup--seeding)
7. [Running the Application](#running-the-application)
8. [Testing & Verification](#testing--verification)
9. [Project Structure](#project-structure)
10. [API Contracts](#api-contracts)

---

## Overview

Gourmet Kitchen is an artisanal food ordering platform that provides an end-to-end customer journey:
- Customers explore an appetizing, responsive menu catalog with live prices and high-quality dish imagery.
- Customers build their orders using an interactive shopping cart with instant quantity controls and subtotal calculation.
- Customers check out with strictly validated delivery details.
- Orders are placed against a resilient PostgreSQL backend that enforces transactional integrity and authoritative server-side price computation.
- Customers track their order progress live through an interactive 3-step visual tracker driven by automated background polling and a backend kitchen simulation engine.

---

## Key Features

- **Artisanal Menu Catalog**: Filterable, responsive grid of dishes loaded from `GET /api/menu` with fallback loading skeletons and retry error boundaries.
- **Client-Side Cart State**: Centralized state management via `CartContext` supporting add, update, remove, and clear actions with zero flicker.
- **Accessible & Responsive Sidebar Drawer**: Desktop sticky sidebar and mobile drawer modal with full keyboard navigation and accessible focus management.
- **Strict Validation & Security**: Client and server validation powered by Zod schemas rejecting client-supplied prices, empty inputs, malformed phone numbers, and prototype pollution.
- **Atomic Order Placement**: Server-authoritative total amount calculations performed inside a single Prisma interactive database transaction (`$transaction`).
- **Simulated Real-Time Kitchen Tracker**: Stateless time-based progression simulator in `GET /api/orders/[id]` advancing orders (`ORDER_RECEIVED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`) with adaptive 5-second polling and automatic teardown upon delivery.
- **Responsive & Accessible (a11y)**: Built according to WCAG guidelines with semantic HTML elements (`<header>`, `<main>`, `<aside>`, `<section>`, `<form>`), ARIA labels, `aria-invalid`, `aria-describedby`, and responsive typography.

---

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16.4.0 | App Router, Turbopack, Partial Prerendering (PPR), Server Components |
| **Frontend** | React 19.3.0 | React Hooks, Context API, Suspense streaming |
| **Language** | TypeScript 5.x | Strict type-safety, zero untyped errors across entire codebase |
| **Styling** | Tailwind CSS 3.4.1 | Fluid responsive layouts, dark mode support, glassmorphism tokens |
| **Database** | PostgreSQL 17 | Relational persistence with foreign key constraints and index optimizations |
| **ORM** | Prisma 6.19.3 | Schema management, type-safe queries, interactive transactions |
| **Validation** | Zod 4.0.0-alpha.3 | Strict schemas for orders, order items, status transitions, and phone validation |
| **Testing** | Vitest 5.0.4 + RTL | Full test suite: unit, API contract, component, and E2E integration tests |

---

## Architectural Decisions & Security Design

### 1. Server-Authoritative Price Calculation
- **Never Trust the Client**: Client requests to `POST /api/orders` submit only `menuItemId` and positive integer `quantity`. Any client-supplied `price`, `unitPrice`, or `totalAmount` is rejected using Zod's `.strict()` mode.
- **Interactive Prisma Transactions**: Prices are queried directly from database `MenuItem` records inside a Prisma interactive transaction (`$transaction`). The grand total is calculated authoritatively on the server, guaranteeing that tampering with client network payloads cannot manipulate order prices.

### 2. Snapshot Pricing in Order Records
- Menu items can experience price fluctuations over time. To ensure historical and financial integrity, `OrderItem` captures a snapshot of the exact unit price (`unitPrice: Decimal(10, 2)`) at the moment of order placement.
- If a restaurant updates their menu item price, existing orders and receipts retain their historical snapshot values.

### 3. Stateless Kitchen Simulator & Real-Time Polling
- **Stateless Backend Simulator**: Rather than relying on fragile long-running background server processes or external schedulers, `GET /api/orders/[id]` computes the current order progression by comparing `order.createdAt` with the current system time:
  - `0 - 30s`: `ORDER_RECEIVED`
  - `31 - 60s`: `PREPARING`
  - `61 - 90s`: `OUT_FOR_DELIVERY`
  - `> 90s`: `DELIVERED`
- Any status progression is persisted directly to PostgreSQL via `prisma.order.update` before returning the response.
- **Adaptive Frontend Polling**: `OrderTrackingView` polls the order endpoint every 5 seconds. Once the order reaches `DELIVERED` or `CANCELLED`, the polling timer is automatically cleared to conserve network and server resources.

### 4. Next.js 16 Partial Prerendering (PPR)
- Dynamic route segment `app/orders/[id]/page.tsx` isolates parameter resolution within a `<Suspense>` boundary. This allows Next.js to prerender the static outer application shell while streaming dynamic server content to the client without blocking page renders.

---

## Prerequisites & Environment Setup

Ensure you have installed:
- **Node.js**: v20.x or v22.x (`node -v`)
- **npm**: v10.x or v11.x (`npm -v`)
- **PostgreSQL**: v16 or v17 running locally or via Docker

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd food-order-management
npm install
```

### 2. Environment Variables Configuration

Copy `.env.example` to `.env` (or create a `.env` file):

```env
# Supabase connection pooler (Transaction pooler)
DATABASE_URL="postgres://postgres.[YOUR-REF]:[YOUR-PASSWORD]@[aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true](https://aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true)"

# Supabase direct connection (Session pooler)
DIRECT_URL="postgres://postgres.[YOUR-REF]:[YOUR-PASSWORD]@[aws-0-region.pooler.supabase.com:5432/postgres](https://aws-0-region.pooler.supabase.com:5432/postgres)"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

*Note: Replace `postgres:postgres` with your local PostgreSQL user credentials and port if different.*

---

## Database Setup & Seeding

Run Prisma migrations to generate the database schema and apply indexes:

```bash
# Apply migrations to local PostgreSQL database
npx prisma migrate dev

# Seed the database with gourmet menu items (Pizza, Pasta, Salads, Desserts)
npx prisma db seed
```

---

## Running the Application

### Development Server

Start the Next.js development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Production Build

To build and run the optimized production bundle:

```bash
npm run build
npm start
```

---

## Testing & Verification

The project includes 80 automated automated tests across 9 test suites covering every layer of the application. Prisma is mocked in automated tests to prevent polluting the local database.

### Run All Tests

```bash
npm run test:run
```

### Interactive Test Watcher

```bash
npm run test
```

### TypeScript Validation

```bash
npx tsc --noEmit
```

### ESLint Check

```bash
npm run lint
```

---

## Test Suites Breakdown

| Test Suite | Purpose | Tests |
|---|---|---|
| `tests/validations/order.test.ts` | Zod schemas, phone number regex, boundary limits, strict rejection | 23 |
| `tests/api/contracts.test.ts` | API contract tests for POST orders, GET order, status progression, PATCH status | 18 |
| `tests/api/menu.test.ts` | Menu item retrieval, decimal serialization, error handling | 4 |
| `tests/context/CartContext.test.tsx` | Cart state management, additions, removals, quantity updates, total computations | 10 |
| `tests/components/MenuAndCart.test.tsx` | MenuCard and CartSidebar UI rendering, quantity controls, empty cart state | 8 |
| `tests/components/CheckoutForm.test.tsx` | Input validation, submission states, field errors, duplicate prevention, a11y | 8 |
| `tests/components/OrderTracking.test.tsx` | Order receipt rendering, 3-step tracker, polling, fake timers, unmount cleanup | 8 |
| `tests/integration/CustomerJourney.test.tsx` | Full end-to-end integration: Menu -> Cart -> Checkout -> Redirection -> Tracking | 3 |
| `tests/Counter.test.tsx` | Component sanity smoke test | 1 |
| **Total** | | **80 Passed** |

---

## Project Structure

```
food-order-management/
├── app/
│   ├── api/
│   │   ├── menu/
│   │   │   └── route.ts             # GET /api/menu
│   │   └── orders/
│   │       ├── route.ts             # POST /api/orders (authoritative transactions)
│   │       └── [id]/
│   │           ├── route.ts         # GET /api/orders/[id] (kitchen simulator)
│   │           └── status/
│   │               └── route.ts     # PATCH /api/orders/[id]/status
│   ├── orders/
│   │   └── [id]/
│   │       └── page.tsx             # Dynamic order tracking page (PPR streaming)
│   ├── layout.tsx                   # Root HTML layout with Geist typography
│   ├── page.tsx                     # Main catalog & shopping cart experience
│   └── globals.css                  # Global styles and Tailwind directives
├── components/
│   ├── CartSidebar.tsx              # Cart item listing, subtotals & checkout toggle
│   ├── CheckoutForm.tsx             # Validated customer form & confirmation view
│   ├── MenuCard.tsx                 # Individual dish card with add/quantity controls
│   ├── MenuList.tsx                 # Responsive dish grid with loading/error states
│   ├── Navbar.tsx                   # Brand header with mobile cart trigger badge
│   └── OrderTrackingView.tsx        # Visual 3-step status tracker with receipt
├── context/
│   └── CartContext.tsx              # Cart React Context provider & useCart hook
├── lib/
│   ├── prisma.ts                    # Cached PrismaClient singleton
│   └── validations/
│       └── order.ts                 # Zod validation schemas & inferred TypeScript types
├── prisma/
│   ├── migrations/                  # Versioned SQL migrations
│   ├── schema.prisma                # PostgreSQL data models (MenuItem, Order, OrderItem)
│   └── seed.ts                      # Initial seed script with culinary menu items
├── tests/
│   ├── api/                         # API contract tests (mocking Prisma)
│   ├── components/                  # React Testing Library component tests
│   ├── context/                     # Cart context state tests
│   ├── integration/                 # End-to-end user journey tests
│   └── validations/                 # Zod schema validation tests
├── vitest.config.mts                # Vitest configuration with jsdom & path aliases
└── vitest.setup.ts                  # Test setup & global Next.js navigation mocks
```

---

## API Contracts

### `GET /api/menu`
- **Description**: Returns all available dishes.
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "cuid-1",
      "name": "Classic Margherita Pizza",
      "description": "San Marzano tomatoes, fresh mozzarella, basil",
      "price": 14.50,
      "imageUrl": "https://..."
    }
  ]
  ```

### `POST /api/orders`
- **Description**: Creates a new customer order. Prices calculated authoritatively on server.
- **Request Body**:
  ```json
  {
    "customerName": "Jane Smith",
    "deliveryAddress": "456 Maple Avenue, Apt 2B",
    "phone": "+1 555-234-5678",
    "items": [
      { "menuItemId": "cuid-1", "quantity": 2 }
    ]
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": "order-cuid-123",
    "customerName": "Jane Smith",
    "deliveryAddress": "456 Maple Avenue, Apt 2B",
    "phone": "+1 555-234-5678",
    "totalAmount": 29.00,
    "status": "ORDER_RECEIVED",
    "createdAt": "2026-10-13T12:00:00.000Z"
  }
  ```

### `GET /api/orders/[id]`
- **Description**: Retrieves order details and advances simulated kitchen status based on elapsed time.
- **Response `200 OK`**:
  ```json
  {
    "id": "order-cuid-123",
    "customerName": "Jane Smith",
    "deliveryAddress": "456 Maple Avenue, Apt 2B",
    "phone": "+1 555-234-5678",
    "totalAmount": 29.00,
    "status": "PREPARING",
    "createdAt": "2026-10-13T12:00:00.000Z",
    "items": [
      {
        "id": "oi-1",
        "menuItemId": "cuid-1",
        "name": "Classic Margherita Pizza",
        "imageUrl": "https://...",
        "quantity": 2,
        "unitPrice": 14.50,
        "subtotal": 29.00
      }
    ]
  }
  ```

### `PATCH /api/orders/[id]/status`
- **Description**: Updates order status explicitly.
- **Request Body**:
  ```json
  {
    "status": "OUT_FOR_DELIVERY"
  }
  ```
- **Response `200 OK`**: Returns updated order object.
