# Suppliers

## Purpose
Store vendor relationships, delivery cadence, order cutoffs, and pricing context.

## Key files
- `lib/db/src/schema/suppliers.ts`
- `lib/db/src/schema/priceHistory.ts`
- `artifacts/api-server/src/routes/suppliers.ts`
- `artifacts/api-server/src/routes/supplierImport.ts`
- `artifacts/api-server/src/routes/supplierBulkImport.ts`

## Key routes
- `/api/venues/:venueId/suppliers*`
- supplier import and price-apply flows

## Key tables
- `suppliers`
- `price_history`

## Business rules
- Order cutoff time and delivery days affect urgency.
- Reliability and expected invoice frequency help signal pricing drift or ordering trust.
- Supplier data supports inventory, invoices, purchase orders, and command-centre ordering logic.

## Architecture
Suppliers are master data that become operationally important only when joined with inventory gaps and purchasing workflows.
