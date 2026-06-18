# Ordering

## Purpose
Show what to order, why it is needed, and how urgent the action is.

## Key files
- `lib/db/src/schema/suppliers.ts`
- `lib/db/src/schema/purchaseOrders.ts`
- `lib/db/src/schema/invoices.ts`
- `lib/db/src/schema/priceHistory.ts`
- `artifacts/api-server/src/utils/mergeOrdering.ts`
- `artifacts/api-server/src/utils/supplierCutoffs.ts`

## Key routes
- `/api/venues/:venueId/orders*`
- `/api/venues/:venueId/suppliers*`
- `/api/venues/:venueId/purchase-orders*`
- `/api/venues/:venueId/invoices*`
- `/api/venues/:venueId/invoices/scan*`

## Key tables
- `suppliers`
- `purchase_orders`
- `purchase_order_items`
- `invoices`
- `invoice_items`
- `price_history`

## Business rules
- Supplier cutoff urgency matters operationally.
- Ordering suggestions merge demand gaps with par gaps to reduce double-ordering.
- Invoice/receiving data can update stock and pricing truth.
- Needs Verification: depth of PO receiving completeness vs invoice-driven receiving.

## Architecture
Ordering sits between supplier master data, inventory truth, and command-centre operational urgency.
