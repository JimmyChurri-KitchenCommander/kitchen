# AI Dependency Graph

## Business dependency graph
Command Centre
├── Prep Plan
├── Service Readiness
├── Dishes At Risk
├── Inventory Status
├── Supplier Cutoffs
├── Compliance Snapshot
├── Waste Signals
└── Operational Attention

Service Readiness
├── Prep Tasks
├── Prep Suggestions
├── Ingredient Availability
├── Ordering Gaps
├── Compliance Snapshot
└── Dishes At Risk

Recipe Cost Engine
├── Recipe Ingredients
├── Inventory Average Cost
├── Recipe Components
└── Unit Conversion

Inventory Ledger
├── Inventory Items
├── FIFO Layers
├── Receiving / Invoices
├── Waste Events
├── Stocktakes
└── Production Movements

Prep Planning
├── Active Menu
├── Menu Items
├── Recipes
├── Recipe Ingredients
├── Recipe Components
├── Inventory Stock
└── Prep Task Library

Ordering
├── Inventory Par Gaps
├── Prep Demand Gaps
├── Supplier Master Data
├── Price History
├── Purchase Orders
└── Invoice Receiving

Compliance Snapshot
├── Temperature Equipment
├── Temperature Logs
├── Cleaning Tasks
├── Cleaning Logs
├── Chemicals
└── Compliance Tasks

## Technical dependency matrix
| System | Depends on |
|---|---|
| Web app | generated API client, API routes, venue state, Clerk auth |
| Mobile app | generated API client, API routes, venue context |
| API routes | Drizzle schema, business utilities, Clerk, venue auth |
| Command Centre route | commandCentre util, readiness util, prepPlan, dishesAtRisk, complianceSnapshot |
| Recipe routes | recipeCost util, DB schema, inventory cost data |
| Inventory routes | inventoryLedger service, inventoryStatus util, stocktake and supplier data |
| Generated client | OpenAPI spec |
| Zod API types | OpenAPI spec |
| DB client | schema index, environment DB connection |

## Dependency hotspots
- `/lib/api-spec/openapi.yaml`
- `/lib/db/src/schema/index.ts`
- `/artifacts/api-server/src/routes/index.ts`
- `/artifacts/api-server/src/utils/commandCentre.ts`
- `/artifacts/api-server/src/services/inventoryLedger.ts`
