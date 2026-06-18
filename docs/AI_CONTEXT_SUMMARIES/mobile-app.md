# Mobile App

## Purpose
Provide quick operational access for kitchen-floor workflows.

## Key files
- `artifacts/kitchen-command-mobile/app/(tabs)/index.tsx`
- `artifacts/kitchen-command-mobile/app/(tabs)/log.tsx`
- `artifacts/kitchen-command-mobile/app/(tabs)/service.tsx`
- `artifacts/kitchen-command-mobile/app/orders.tsx`
- `artifacts/kitchen-command-mobile/app/stocktake.tsx`
- `artifacts/kitchen-command-mobile/app/handover.tsx`

## Key routes
The mobile app consumes shared backend API routes through generated client hooks; it does not define separate backend routes.

## Key tables
No mobile-only tables. It uses shared backend domains such as venues, prep tasks, inventory alerts, and supplier cutoffs.

## Business rules
- Mobile is optimized for speed and reduced taps.
- Today view emphasizes low stock, stagnant stock, supplier cutoffs, and prep tasks.
- Needs Verification: exact coverage parity with the web app for all operational modules.

## Architecture
Expo Router tabs provide Today, Log, Recipes, Service, and More entry points over the same API contract used by the web app.
