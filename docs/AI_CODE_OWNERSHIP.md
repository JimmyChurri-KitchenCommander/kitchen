# AI Code Ownership

## Mission critical

### `/artifacts/api-server/src/services/inventoryLedger.ts`
- **Purpose:** writes auditable stock movements, FIFO layer changes, and ledger entries
- **Dependencies:** `inventory_items`, `inventory_layers`, `inventory_ledger_entries`
- **Potential consequences:** breaks inventory truth, cost impact, restock timing, or FIFO behavior

### `/artifacts/api-server/src/utils/prepPlan.ts`
- **Purpose:** converts menu + covers into ingredient gaps, prep requirements, and suggested tasks
- **Dependencies:** menus, recipes, recipe ingredients/components, inventory, prep task library
- **Potential consequences:** wrong prep demand, bad ordering suggestions, false readiness

### `/artifacts/api-server/src/utils/recipeCost.ts`
- **Purpose:** calculates total recipe cost including nested prep components
- **Dependencies:** recipes, recipe ingredients, inventory costs, unit conversion
- **Potential consequences:** distorted margin and food-cost outputs

### `/artifacts/api-server/src/utils/commandCentre.ts`
- **Purpose:** orchestrates operational state across domains
- **Dependencies:** inventory, suppliers, prep, compliance, recipes, waste, readiness utilities
- **Potential consequences:** breaks the main chef-facing decision surface

### `/artifacts/api-server/src/utils/serviceReadiness.ts`
- **Purpose:** scores service readiness from prep, stock, ordering, compliance, and menu state
- **Dependencies:** prep plan output, compliance snapshot, dishes at risk, inventory status
- **Potential consequences:** false ready/high-risk states before service

### `/artifacts/api-server/src/utils/dishesAtRisk.ts`
- **Purpose:** maps shortages to sellable menu risk
- **Dependencies:** prep-plan output and shortage-source matching
- **Potential consequences:** chefs lose trust in menu-risk warnings

## High risk
- `/lib/db/src/schema/inventory.ts`
- `/lib/db/src/schema/recipes.ts`
- `/lib/db/src/schema/prepBoard.ts`
- `/artifacts/api-server/src/routes/inventory.ts`
- `/artifacts/api-server/src/routes/recipes.ts`
- `/artifacts/api-server/src/routes/commandCentre.ts`
- `/artifacts/api-server/src/routes/invoiceScan.ts`
- `/lib/api-spec/openapi.yaml`

**Why high risk:** these files define schema/contracts or large domain entry points. Small changes can cascade through generated clients, UI flows, and data integrity.

## Shared utilities
- `/artifacts/api-server/src/utils/unitConvert.ts`
- `/artifacts/api-server/src/utils/supplierCutoffs.ts`
- `/artifacts/api-server/src/utils/inventoryStatus.ts`
- `/artifacts/api-server/src/utils/complianceSnapshot.ts`
- `/artifacts/api-server/src/utils/mergeOrdering.ts`

**Why shared:** they influence multiple domains and can create subtle regressions across command centre, dashboard, and mobile.

## Safe to refactor first
- Page-level presentational components in `artifacts/hospitality-ops/src/components`
- Non-generated UI pages that consume already-stable hooks
- Copy/content files not tied to core calculations

**Caution:** even "safe" UI changes should not silently reinterpret readiness, cost, or stock semantics.
