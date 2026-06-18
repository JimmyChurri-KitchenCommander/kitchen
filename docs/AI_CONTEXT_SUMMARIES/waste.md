# Waste

## Purpose
Capture waste with cost impact and surface margin leakage.

## Key files
- `lib/db/src/schema/waste.ts`
- `artifacts/api-server/src/routes/waste.ts`
- waste consumers in `dashboard.ts`, `analytics.ts`, and `commandCentre.ts`

## Key routes
- `/api/venues/:venueId/waste*`

## Key tables
- `waste_logs`

## Business rules
- Waste events store quantity, unit, cost impact, and reason.
- Quick-capture mode allows logging during service before full inventory matching.
- Elevated same-day waste becomes an operational signal.

## Architecture
Waste is a simple source domain with outsized downstream value for analytics, dashboard, and command-centre attention.
