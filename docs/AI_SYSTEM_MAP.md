# AI System Map

## Inventory
- **Purpose:** track stock, par, FIFO, value, and auditable movement history
- **Key files:** `lib/db/src/schema/inventory.ts`, `artifacts/api-server/src/services/inventoryLedger.ts`, `artifacts/api-server/src/routes/inventory.ts`, `artifacts/api-server/src/utils/inventoryStatus.ts`
- **Database tables:** `inventory_items`, `inventory_layers`, `inventory_ledger_entries`
- **Routes:** `/api/venues/:venueId/inventory*`, inventory alerts and ledger endpoints
- **Business rules:** ledger is immutable, FIFO layers are consumed oldest-first, low/critical/stagnant/expiry states are computed
- **Dependencies:** suppliers, recipes, invoices, stocktakes, waste
- **Used by:** dashboard, command centre, ordering, recipe costing, mobile today view
- **Business impact:** incorrect changes break stock truth, cost truth, and readiness signals

## Recipes
- **Purpose:** define dishes and prep recipes, cost them, connect them to inventory and menus
- **Key files:** `lib/db/src/schema/recipes.ts`, `artifacts/api-server/src/utils/recipeCost.ts`, `artifacts/api-server/src/routes/recipes.ts`
- **Database tables:** `recipes`, `recipe_ingredients`, `recipe_components`
- **Routes:** `/api/venues/:venueId/recipes*`
- **Business rules:** recipe costs roll up from ingredients and prep components, cycles are guarded, freshness is tracked via review/cost dates
- **Dependencies:** inventory, menus, prep planning
- **Used by:** command centre, kitchen brief, menu, prep board
- **Business impact:** recipe errors distort food cost, prep demand, and menu-risk logic

## Prep Planning
- **Purpose:** translate covers and menu mix into prep demand and suggested tasks
- **Key files:** `lib/db/src/schema/prepBoard.ts`, `artifacts/api-server/src/utils/prepPlan.ts`, `artifacts/api-server/src/routes/prepPlan.ts`, `artifacts/api-server/src/routes/prepTasks.ts`
- **Database tables:** `prep_task_library`, `prep_tasks`, `venue_booking_notes`, `venue_staff`
- **Routes:** `/api/venues/:venueId/prep-plan*`, `/prep-tasks*`, `/prep-library*`
- **Business rules:** no stock is deducted until prep is logged/applied; menu mix defaults evenly unless overridden
- **Dependencies:** menus, recipes, inventory
- **Used by:** command centre, service readiness, mobile, prep board
- **Business impact:** prep errors ripple into service readiness and dishes-at-risk

## Ordering
- **Purpose:** surface what to order, when to order it, and from whom
- **Key files:** `lib/db/src/schema/suppliers.ts`, `purchaseOrders.ts`, `invoices.ts`, `priceHistory.ts`, `artifacts/api-server/src/utils/mergeOrdering.ts`, `supplierCutoffs.ts`
- **Database tables:** `suppliers`, `purchase_orders`, `purchase_order_items`, `invoices`, `invoice_items`, `price_history`
- **Routes:** `/api/venues/:venueId/orders*`, `/suppliers*`, `/purchase-orders*`, `/invoices*`, `/invoices/scan*`
- **Business rules:** supplier cutoff urgency matters; command centre merges demand gaps with par gaps to avoid double-ordering
- **Dependencies:** inventory, recipes, invoices, suppliers
- **Used by:** dashboard, command centre, mobile today/orders views
- **Business impact:** ordering errors cause stockouts, excess spend, or inaccurate costs

## Compliance
- **Purpose:** keep kitchens service-safe and audit-ready
- **Key files:** `lib/db/src/schema/temperature.ts`, `cleaning.ts`, `chemicals.ts`, `artifacts/api-server/src/utils/complianceSnapshot.ts`
- **Database tables:** `temperature_equipment`, `temperature_logs`, `cleaning_tasks`, `cleaning_logs`, `chemicals`, `cleaning_task_chemicals`, `compliance_tasks`
- **Routes:** `/api/venues/:venueId/temperature*`, `/cleaning*`, `/chemicals*`, `/compliance*`
- **Business rules:** unresolved temp failures degrade readiness; missing/expired chemical docs create compliance blockers
- **Dependencies:** venues, invoices in temp logs, cleaning schedules
- **Used by:** dashboard, command centre, service readiness
- **Business impact:** compliance issues can block safe service

## Waste
- **Purpose:** capture waste cost and reasons close to the moment it happens
- **Key files:** `lib/db/src/schema/waste.ts`, `artifacts/api-server/src/routes/waste.ts`
- **Database tables:** `waste_logs`
- **Routes:** `/api/venues/:venueId/waste*`
- **Business rules:** quick-capture waste can defer inventory matching; cost impact is a first-class field
- **Dependencies:** inventory
- **Used by:** dashboard, analytics, command centre
- **Business impact:** waste trends expose margin leakage

## Command Centre
- **Purpose:** answer the chef's operational questions in one place
- **Key files:** `artifacts/api-server/src/utils/commandCentre.ts`, `serviceReadiness.ts`, `dishesAtRisk.ts`, `operationalAttention.ts`, `artifacts/api-server/src/routes/commandCentre.ts`, `artifacts/hospitality-ops/src/pages/command-centre.tsx`
- **Database tables:** reads across inventory, prep, compliance, recipes, suppliers, waste, venue config
- **Routes:** `/api/venues/:venueId/command-centre`, `/command-centre/morning-run`
- **Business rules:** readiness is weighted, morning run can create prep tasks, dish risk is derived from shortages
- **Dependencies:** nearly every core operational domain
- **Used by:** Head Chef workflow
- **Business impact:** this is the highest-value orchestration surface

## Suppliers
- **Purpose:** maintain vendor context, cutoff times, and pricing relationships
- **Key files:** `lib/db/src/schema/suppliers.ts`, `artifacts/api-server/src/routes/suppliers.ts`, `supplierImport.ts`, `supplierBulkImport.ts`
- **Database tables:** `suppliers`, `price_history`
- **Routes:** `/api/venues/:venueId/suppliers*`
- **Business rules:** supplier cutoff time and delivery days feed urgency
- **Dependencies:** ordering, inventory, invoices
- **Used by:** command centre, orders, analytics
- **Business impact:** supplier data quality affects ordering accuracy

## Analytics
- **Purpose:** summarize operational patterns from captured data
- **Key files:** `artifacts/api-server/src/routes/analytics.ts`, `dashboard.ts`, `foodCostConfidence.ts`
- **Database tables:** waste, inventory, price history, recipes, invoices
- **Routes:** `/api/venues/:venueId/analytics`, `/food-cost-confidence`
- **Business rules:** current analytics are operational, not predictive
- **Dependencies:** waste, inventory, recipes, suppliers
- **Used by:** analytics page, dashboard, command centre
- **Business impact:** supports trend visibility and confidence checks

## Mobile App
- **Purpose:** give the kitchen team fast operational actions away from the admin UI
- **Key files:** `artifacts/kitchen-command-mobile/app/(tabs)/index.tsx`, `orders.tsx`, `stocktake.tsx`, `handover.tsx`
- **Database tables:** shared backend tables only
- **Routes:** consumes existing API endpoints through generated client
- **Business rules:** optimized for quick operational interaction rather than full admin control
- **Dependencies:** venue selection, inventory alerts, prep tasks, supplier cutoffs
- **Used by:** kitchen floor staff
- **Business impact:** reduces friction during live service
