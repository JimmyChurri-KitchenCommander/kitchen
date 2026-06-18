# Compliance

## Purpose
Keep kitchens safe and audit-ready through temperature, cleaning, and chemical-documentation workflows.

## Key files
- `lib/db/src/schema/temperature.ts`
- `lib/db/src/schema/cleaning.ts`
- `lib/db/src/schema/chemicals.ts`
- `artifacts/api-server/src/utils/complianceSnapshot.ts`
- `artifacts/api-server/src/routes/temperature.ts`
- `artifacts/api-server/src/routes/cleaning.ts`
- `artifacts/api-server/src/routes/chemicals.ts`

## Key routes
- `/api/venues/:venueId/temperature*`
- `/api/venues/:venueId/cleaning*`
- `/api/venues/:venueId/chemicals*`
- compliance summary/task endpoints in `chemicals.ts` and `complianceOverview.ts`

## Key tables
- `temperature_equipment`
- `temperature_logs`
- `cleaning_tasks`
- `cleaning_logs`
- `chemicals`
- `cleaning_task_chemicals`
- `compliance_tasks`

## Business rules
- Unresolved temperature failures are readiness blockers.
- Overdue cleaning tasks are operational issues.
- Missing or expired MSDS/SDS documentation creates compliance blockers.

## Architecture
Compliance is aggregated into a single snapshot so readiness and command-centre logic can reason over it quickly.
