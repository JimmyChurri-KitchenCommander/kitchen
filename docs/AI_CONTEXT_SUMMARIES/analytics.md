# Analytics

## Purpose
Summarize operational trends from captured kitchen data.

## Key files
- `artifacts/api-server/src/routes/analytics.ts`
- `artifacts/api-server/src/routes/dashboard.ts`
- `artifacts/api-server/src/routes/foodCostConfidence.ts`
- analytics UI in `artifacts/hospitality-ops/src/pages/analytics.tsx`

## Key routes
- `GET /api/venues/:venueId/analytics`
- food cost confidence route

## Key tables
Reads mainly from `waste_logs`, `inventory_items`, `price_history`, `recipes`, and invoice-related data.

## Business rules
- Current analytics are operational and descriptive.
- Food-cost confidence depends on stale review/cost dates.
- Needs Verification: long-horizon forecasting or predictive analytics beyond current signals.

## Architecture
Analytics is downstream of core operational capture domains rather than a primary transactional system.
