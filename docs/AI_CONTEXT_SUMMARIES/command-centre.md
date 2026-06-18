# Command Centre

## Purpose
One operational view for service readiness, prep, ordering, menu risk, compliance, food cost, and waste.

## Key files
- `artifacts/api-server/src/utils/commandCentre.ts`
- `artifacts/api-server/src/utils/serviceReadiness.ts`
- `artifacts/api-server/src/utils/dishesAtRisk.ts`
- `artifacts/api-server/src/utils/operationalAttention.ts`
- `artifacts/api-server/src/routes/commandCentre.ts`
- `artifacts/hospitality-ops/src/pages/command-centre.tsx`

## Key routes
- `GET /api/venues/:venueId/command-centre`
- `POST /api/venues/:venueId/command-centre/morning-run`

## Key tables
Reads from `venues`, `inventory_items`, `suppliers`, `waste_logs`, `prep_tasks`, `recipes`, `temperature_equipment`, `temperature_logs`, `chemicals`, `compliance_tasks`.

## Business rules
- Morning workflow converts covers into service periods.
- Prep tasks can be auto-created from calculated gaps.
- Readiness is weighted, not binary.
- Dish risk is derived from shortages against menu demand.
- Supplier cutoff urgency changes ordering attention.
- Compliance failures can block a green readiness state.

## Architecture
This is primarily an orchestration layer, not a source-of-truth domain. It aggregates outputs from prep planning, inventory status, compliance snapshot, dishes-at-risk, ordering merge logic, and waste analysis.
