# AI Data Flow

## Major operational flows

### Supplier → Purchase Order → Receiving → Inventory Ledger → FIFO Layers → Inventory Stock
- Suppliers provide cutoff and delivery context
- Purchase orders capture intended buys
- Invoice/receiving flows confirm delivered quantity and price
- Inventory movements create ledger entries
- Positive stock can create FIFO layers
- Item stock, average cost, and restock dates update

### Inventory → Recipe Costing → Menu Costing → Food Cost %
- Inventory holds unit and average cost
- Recipe ingredients consume inventory pricing
- Prep components roll into menu-recipe cost
- Menu and recipe views expose total cost, portion cost, and margin signals

### Menu → Covers → Prep Planning → Dishes At Risk → Command Centre
- Active menu defines recipes for service
- Expected covers feed prep planning
- Prep planning calculates ingredient and prep gaps
- Dishes at risk classify menu vulnerability
- Command Centre surfaces risk, attention, and readiness

### Inventory + Par Levels + Demand Gaps → Ordering → Supplier Cutoffs
- Inventory deficits are compared against par
- Prep demand adds demand-based gaps
- Ordering logic merges both views to avoid double-ordering
- Supplier cutoff urgency changes attention severity

### Compliance → Service Readiness → Command Centre
- Cleaning schedules, temperature checks, and chemical/MSDS state form compliance snapshot
- Compliance score feeds readiness scoring
- Unresolved temperature failures can block green readiness
- Command Centre exposes the headline operational state

### Waste → Analytics → Operational Attention
- Waste events capture quantity, reason, and cost impact
- Analytics aggregate recent waste patterns
- Elevated daily waste can become a command-centre attention item

### Venue Configuration → Service Windows / Covers → Morning Workflow
- Venue settings define service windows and average covers
- Morning workflow converts covers into service periods
- Prep plan can create missing prep tasks for the day
- Resulting tasks feed readiness, prep board, and mobile views

### Shared API Spec → Generated Client → Web/Mobile Consumption
- OpenAPI spec is the contract source
- Generated Zod/client layers power typed API access
- Web and mobile consume the same backend contract

## Notes
- The repo has strong read-path orchestration for operational answers.
- Historical closed-loop forecasting remains **Needs Verification**.
