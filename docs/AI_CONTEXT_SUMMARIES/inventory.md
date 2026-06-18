# Inventory

## Purpose
Track stock position, FIFO layers, par levels, average cost, and audit history.

## Key files
- `lib/db/src/schema/inventory.ts`
- `artifacts/api-server/src/services/inventoryLedger.ts`
- `artifacts/api-server/src/routes/inventory.ts`
- `artifacts/api-server/src/utils/inventoryStatus.ts`

## Key routes
- `/api/venues/:venueId/inventory*`
- inventory alerts and ledger endpoints under the same route module

## Key tables
- `inventory_items`
- `inventory_layers`
- `inventory_ledger_entries`

## Business rules
- Ledger entries are immutable movement records.
- Positive received movements can create FIFO layers.
- Negative movements consume oldest remaining layers first.
- Statuses such as `critical`, `low_stock`, `stagnant`, and `expiry_risk` are computed, not stored as truth.
- Production and stocktake movements are first-class movement types.

## Architecture
Inventory is the base dependency for recipe costing, prep planning, ordering, waste analysis, and command-centre readiness.
