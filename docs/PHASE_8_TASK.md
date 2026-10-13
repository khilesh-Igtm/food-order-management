# Phase 8: Simulated Real-Time Status Updates

## Context
Phase 7 introduced the order tracking UI and manual refresh. To meet the assessment requirement for "simulated real-time status updates", we need the application to automatically progress the order and the UI to reflect this without user intervention.

## Scope
Implement automated time-based status progression on the backend and automatic polling on the frontend.

## Requirements

### 1. Backend Simulation (`app/api/orders/[id]/route.ts`)
- Modify the existing `GET` endpoint to act as a stateless "kitchen simulator".
- When an order is fetched, compare its `createdAt` timestamp to the current time:
  - If status is `ORDER_RECEIVED` and > 30 seconds have passed, update it to `PREPARING` in the database.
  - If status is `PREPARING` and > 60 seconds have passed since creation, update it to `OUT_FOR_DELIVERY`.
  - If status is `OUT_FOR_DELIVERY` and > 90 seconds have passed, update to `DELIVERED`.
- Save the updated status via Prisma before returning the response to ensure persistence.
- Return the newly calculated order so the client gets real-time progression.

### 2. Frontend Polling (`components/OrderTrackingView.tsx`)
- Implement a polling mechanism (e.g., using `useEffect` and `setInterval`) to fetch the order data every 5 seconds.
- Automatically clear the interval/stop polling once the order reaches `DELIVERED` or `CANCELLED`.
- Ensure the 3-step progress tracker visually updates seamlessly as the polled status changes.
- Ensure the component cleans up the interval on unmount.

## TDD & Verification
1. Update API contract tests to verify the time-based status progression logic. Use `vi.setSystemTime()` to mock the passage of time.
2. Update the frontend component tests to verify polling behavior and unmount cleanup using `vi.useFakeTimers()`.
3. Run the full test suite, TypeScript check, and ESLint.