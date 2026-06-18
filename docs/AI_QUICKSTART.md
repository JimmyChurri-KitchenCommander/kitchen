# AI Quickstart

## What this platform is
Kitchen Command is a hospitality operations platform designed to become the operational brain of a commercial kitchen. It combines stock, prep, ordering, compliance, waste, food cost, and service-readiness signals into one operational layer.

## Primary users
- Head Chef
- Sous Chef
- Kitchen Manager

## Product objective
Reduce mental load by answering the questions chefs actually ask:
- What needs attention today?
- What needs prep today?
- What needs ordering today?
- What menu items are at risk?
- Are we service ready?

## Read these first
1. `/docs/AI_CURRENT_STATE.md`
2. `/docs/AI_SYSTEM_MAP.md`
3. `/docs/AI_CHANGE_PROTOCOL.md`
4. `/docs/AI_DECISION_LOG.md`

## Monorepo at a glance
- `artifacts/api-server` — Express backend
- `artifacts/hospitality-ops` — React web app
- `artifacts/kitchen-command-mobile` — Expo mobile app
- `lib/db` — Drizzle/Postgres schema
- `lib/api-spec` — OpenAPI source of truth
- `lib/api-client-react` — generated React Query client

## Critical systems
- **Inventory Ledger** — auditable stock movements, FIFO layers, cost impact
- **Recipe Cost Engine** — ingredient + prep-component rollups
- **Prep Planning Engine** — cover-driven prep and ordering requirements
- **Command Centre** — one operational view across domains
- **Service Readiness** — weighted readiness score before service
- **Dishes At Risk** — menu risk from prep and ingredient shortages

## Files that should not be modified casually
- `/artifacts/api-server/src/services/inventoryLedger.ts`
- `/artifacts/api-server/src/utils/recipeCost.ts`
- `/artifacts/api-server/src/utils/prepPlan.ts`
- `/artifacts/api-server/src/utils/commandCentre.ts`
- `/artifacts/api-server/src/utils/serviceReadiness.ts`
- `/artifacts/api-server/src/utils/dishesAtRisk.ts`
- `/lib/db/src/schema/inventory.ts`
- `/lib/db/src/schema/recipes.ts`
- `/lib/db/src/schema/prepBoard.ts`
- `/artifacts/api-server/src/routes/index.ts`
- `/lib/api-spec/openapi.yaml`
- `/lib/api-client-react/src/generated/api.ts` (generated; regenerate, do not hand-edit)

## Operating assumptions
- API contracts are contract-first from `/lib/api-spec/openapi.yaml`
- Venue ownership and access checks are core safety boundaries
- Inventory, prep, cost, and readiness logic live primarily in API utilities/services, not the frontend
- Unknown or weakly evidenced areas must be marked **Needs Verification**
