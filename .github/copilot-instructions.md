
# Copilot Instructions for EazyQue Retail Billing Platform

## Project Architecture & Structure

- **Monorepo**: All code is in a monorepo, organized by `/apps` (web, api, mobile) and `/packages` (database, gst-utils, shared).
- **Web App** (`/apps/web`): Next.js 15, TypeScript, Tailwind CSS. Contains admin dashboard, POS, analytics, and inventory UIs. Uses server components and React Query for data fetching.
- **API** (`/apps/api`): Node.js + Express, PostgreSQL (Prisma ORM). Implements RESTful endpoints for products, orders, inventory, analytics, and authentication. JWT-based auth, RBAC enforced.
- **Mobile App** (`/apps/mobile`): React Native, TypeScript. Customer self-checkout and barcode scanning.
- **Shared Packages**: `/packages/shared` (types, utils), `/packages/gst-utils` (GST/HSN logic), `/packages/database` (Prisma schema).

## Developer Workflows

- **Build & Start (dev)**: `npm run dev` (runs both web and api via `concurrently`).
- **Test All**: `./test-suite.sh` (integration), `cd apps/web && npm test` (frontend), Playwright for E2E.
- **Seed Data**: `node scripts/seed-test-products.ts` or `seed-barcode-test-products.ts`.
- **API/DB Health**: `curl http://localhost:5001/health` (API), `curl http://localhost:3000` (web).
- **Regression Reports**: See `/regression-reports/` for markdown and HTML summaries.

## Key Conventions & Patterns

- **TypeScript strict mode** everywhere. Prefer explicit types and interfaces from `/packages/shared`.
- **GST/HSN Compliance**: All billing logic must use `/packages/gst-utils` for tax and HSN validation.
- **Real-time**: Use Socket.io for live updates (orders, inventory, analytics). See `/apps/api/src/routes/analytics.ts` and `/apps/web/src/app/enhanced-dashboard/page.tsx` for examples.
- **API Proxying**: Next.js API routes proxy to backend to avoid CORS and centralize auth. See `/apps/web/src/app/api/`.
- **State Management**: Use Zustand for client state, React Query for server state.
- **Error Handling**: Always return structured error objects from API. Use error boundaries in React.
- **Testing**: All features require E2E and regression coverage. See `/test-suite.sh`, `/comprehensive-regression-test.js`, `/ENHANCED_ANALYTICS_IMPLEMENTATION_COMPLETE.md`.

## Integration & Data Flow

- **Frontend ↔ API**: All data flows through REST endpoints. Use OpenAPI docs for contract.
- **Database**: Prisma migrations in `/packages/database`. Always run `prisma generate` after schema changes.
- **Payments**: UPI is primary, with Razorpay/Stripe for cards. Payment logic in `/apps/api/src/routes/payments.ts`.
- **Localization**: All UI and currency in INR (₹), support for Hindi/regional languages.

## Examples & References

- **Analytics**: `/apps/web/src/app/enhanced-dashboard/page.tsx`, `/apps/api/src/routes/analytics.ts`
- **Testing**: `/TESTING_REPORT.md`, `/COMPREHENSIVE_AUTOMATION_TESTING_REPORT.md`
- **Roadmap**: `/NEXT_FEATURES_ROADMAP.md`
- **POS/Barcode**: `/apps/web/src/app/pos/`, `/apps/api/src/routes/barcode.ts`

## Security & Compliance

- Enforce JWT auth and RBAC on all endpoints.
- Validate and sanitize all user input (see `/apps/api/src/middleware/validate.ts`).
- PCI DSS for payments, OWASP for web security.
- All calculations must be GST compliant and use HSN codes.

## Priorities for AI Agents

1. Type safety and error handling
2. Real-time sync and mobile performance
3. GST/HSN compliance and Indian market requirements
4. Scalable, modular code (prefer shared packages)
5. Regression and E2E test coverage for all features
