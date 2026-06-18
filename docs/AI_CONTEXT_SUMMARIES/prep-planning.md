# Prep Planning

## Purpose
Turn covers and active menu structure into prep demand, ordering gaps, and actionable tasks.

## Key files
- `lib/db/src/schema/prepBoard.ts`
- `artifacts/api-server/src/utils/prepPlan.ts`
- `artifacts/api-server/src/routes/prepPlan.ts`
- `artifacts/api-server/src/routes/prepTasks.ts`
- `artifacts/api-server/src/routes/prepLibrary.ts`

## Key routes
- `/api/venues/:venueId/prep-plan*`
- `/api/venues/:venueId/prep-tasks*`
- `/api/venues/:venueId/prep-library*`

## Key tables
- `prep_task_library`
- `prep_tasks`
- `venue_booking_notes`
- `venue_staff`
- plus menu/recipe/inventory tables as dependencies

## Business rules
- Covers must exist to produce a meaningful plan.
- Active menu is the default planning target.
- Menu mix is even unless overrides are supplied.
- Planning is read-only until prep or stock movement is explicitly logged.
- Suggested tasks can be generated from missing prep output.

## Architecture
Prep planning is a cross-domain engine used directly by command centre and kitchen-brief style workflows.
