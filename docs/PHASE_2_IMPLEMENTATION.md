
# Phase 2: Database and Prisma Implementation

## Goal
Set up PostgreSQL persistence for the Food Order Management assessment.

## Existing environment
- Windows
- Node.js 22.13.1
- npm 11.2.0
- Next.js 16.4.0
- React 19.3.0
- TypeScript
- Vitest 5.0.4
- PostgreSQL 17 running locally on localhost:5432
- Existing database names include postgres and projectK
- No project database exists yet
- Prisma is not installed

## Approved scope
1. Create a dedicated database named food_order_db.
2. Install a compatible stable Prisma 6.x release and matching @prisma/client version.
3. Configure the Prisma schema for PostgreSQL.
4. Create MenuItem, Order, and OrderItem models.
5. Create an OrderStatus enum with:
   - ORDER_RECEIVED
   - PREPARING
   - OUT_FOR_DELIVERY
6. Use Decimal for monetary values.
7. Preserve the purchase-time price in OrderItem.unitPrice.
8. Create a safe server-side Prisma singleton in lib/prisma.ts.
9. Add sample menu data through a Prisma seed script.
10. Generate the Prisma client and create the initial database migration.
11. Verify TypeScript, lint, and tests.

## Data model requirements

MenuItem:
- id
- name
- description
- price
- imageUrl
- createdAt
- updatedAt

Order:
- id
- customerName
- deliveryAddress
- phone
- totalAmount
- status
- createdAt
- updatedAt
- items relation

OrderItem:
- id
- orderId
- menuItemId
- quantity
- unitPrice
- Order relation
- MenuItem relation

Use suitable IDs, defaults, constraints, indexes, and deletion behavior.

## Compatibility requirements
- Check that the selected Prisma version actually exists.
- Use matching Prisma CLI and client versions.
- Follow the documented configuration for that exact version.
- Keep the existing Next.js, Tailwind, ESLint, and Vitest setup working.
- Do not upgrade unrelated dependencies.
- Use npm.cmd and npx.cmd in Windows commands if PowerShell blocks npm.ps1.
- Keep App Router files at the existing project root; do not create src/ merely for convention.

## Environment and security
- Create .env.example containing only a placeholder DATABASE_URL.
- Create .env.local only if the connection string can be configured safely.
- Never guess, print, or expose database passwords.
- Check whether the existing local PostgreSQL authentication permits a connection without a password.
- If a password is required and is not available, stop and ask the user to configure it securely.
- Ensure .env.local is ignored by Git.
- Never delete or modify existing databases.
- Do not drop, reset, or truncate databases or tables.
- Do not print environment-variable values or secrets in logs.
- Use the least destructive migration commands.

## Implementation sequence
1. Verify the Prisma package version and connection approach.
2. Create food_order_db without affecting other databases.
3. Install matching Prisma dependencies.
4. Configure schema.prisma and environment variables.
5. Create the initial migration and generate the client.
6. Implement lib/prisma.ts.
7. Implement the seed script and execute it.
8. Inspect the resulting schema and sample data.
9. Run TypeScript, lint, and the existing test suite.

## Stop conditions
Stop and report the problem if:
- The chosen Prisma version is unavailable.
- Database authentication cannot be configured safely.
- The migration would require destructive changes.
- Existing application or test configuration needs an unrelated breaking change.

Do not implement the menu API, checkout, cart, UI features, or order tracking in this task.

## Final report
List the files created or modified, dependency versions, migration name, database verification result, seed result, and verification commands with their outcomes.
Never include secrets in the report.
