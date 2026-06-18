# AI Architecture

## Monorepo structure
- `artifacts/`
  - `api-server/` — Express 5 API, Clerk auth, Pino logging, esbuild bundle
  - `hospitality-ops/` — React 19 + Vite + Tailwind web application
  - `kitchen-command-mobile/` — Expo / React Native mobile app
  - `mockup-sandbox/` — sandbox prototype area
- `lib/`
  - `db/` — Drizzle schema, DB client, migrations
  - `api-spec/` — OpenAPI source of truth
  - `api-zod/` — generated Zod types
  - `api-client-react/` — generated React Query hooks
  - `integrations-openai-ai-server/` — server-side OpenAI integration
  - `integrations-openai-ai-react/` — client-side OpenAI audio helpers
  - `integrations-anthropic-ai/` — Anthropic integration
- `scripts/` — repo tooling

## Runtime architecture
### Frontend
- React SPA in `artifacts/hospitality-ops`
- Wouter routing
- Zustand for local app state such as active venue
- React Query via generated client hooks
- Command Centre, Dashboard, Prep Board, Inventory, Recipes, Waste, Compliance, Analytics pages

### Backend
- Express app in `artifacts/api-server/src/app.ts`
- Route registry in `artifacts/api-server/src/routes/index.ts`
- Business logic concentrated in `src/utils/*` and `src/services/*`
- Clerk middleware and venue-level authorization protect tenant boundaries

### Database
- PostgreSQL via Drizzle in `lib/db`
- Domain schemas in `lib/db/src/schema/*`
- Inventory is modeled with items, FIFO layers, and immutable ledger entries
- Recipes, menus, prep tasks, suppliers, invoices, waste, compliance, and venue configuration all live in shared schema modules

### Mobile
- Expo Router app in `artifacts/kitchen-command-mobile/app`
- Focused on operational usage: today view, quick log, service, orders, stocktake, handover
- Reuses generated API client and shared backend

### External integrations
- Clerk for auth
- Supabase-hosted Postgres connection pattern in `lib/db`
- OpenAI integrations for server/client AI features
- Anthropic integration for AI backends
- Needs Verification: which integrations are actively used in production flows beyond assistant groundwork

## Domain ownership
- **Inventory** — `/lib/db/src/schema/inventory.ts`, `/artifacts/api-server/src/services/inventoryLedger.ts`, `/artifacts/api-server/src/routes/inventory.ts`
- **Recipes** — `/lib/db/src/schema/recipes.ts`, `/artifacts/api-server/src/utils/recipeCost.ts`, `/artifacts/api-server/src/routes/recipes.ts`
- **Ordering** — `/lib/db/src/schema/suppliers.ts`, `priceHistory.ts`, `purchaseOrders.ts`, `invoices.ts`, routes under `suppliers`, `orders`, `purchaseOrders`, `invoiceScan`
- **Compliance** — `temperature.ts`, `cleaning.ts`, `chemicals.ts`, routes `temperature.ts`, `cleaning.ts`, `chemicals.ts`, `complianceOverview.ts`
- **Waste** — `/lib/db/src/schema/waste.ts`, `/artifacts/api-server/src/routes/waste.ts`
- **Prep Planning** — `/lib/db/src/schema/prepBoard.ts`, `/artifacts/api-server/src/utils/prepPlan.ts`, routes `prepPlan.ts`, `prepTasks.ts`, `prepLibrary.ts`
- **Command Centre** — `/artifacts/api-server/src/utils/commandCentre.ts`, `/artifacts/api-server/src/routes/commandCentre.ts`, `/artifacts/hospitality-ops/src/pages/command-centre.tsx`
- **AI** — `/artifacts/api-server/src/utils/assistantContext.ts`, `/artifacts/api-server/src/routes/assistantContext.ts`, integrations under `lib/integrations-*`
