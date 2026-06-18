# AI Decision Log

## Inventory Ledger
**Reason:** inventory must be auditable and reconstructable. The repository models both immutable ledger entries and FIFO inventory layers so stock and cost changes can be replayed and explained.

## FIFO Layers
**Reason:** kitchens buy stock at changing prices and with shelf-life pressure. FIFO lets the system represent real receiving order and sensible consumption order.

## Recipe Cost Engine
**Reason:** chefs need food cost at dish level, but many dishes depend on prep recipes. Cost therefore rolls up across ingredient lines and prep components instead of stopping at raw stock.

## Command Centre
**Reason:** chefs should not manually connect prep, stock, compliance, ordering, waste, and menu risk across separate modules. The command centre exists to collapse those signals into one operational view.

## Service Readiness
**Reason:** chefs think in readiness, not modules. A weighted readiness score is easier to act on than checking six screens before service.

## Dishes At Risk
**Reason:** menu risk is a better operational question than raw low-stock counts. A chef cares which sellable dishes are threatened and how many portions are exposed.

## Morning Workflow
**Reason:** morning planning workload should be reduced. Covers are turned into prep and ordering guidance so the kitchen starts with an actionable plan.

## Contract-first API
**Reason:** the web app, mobile app, and backend need one stable interface. OpenAPI plus generated clients reduces drift and AI guesswork.

## Venue-scoped authorization
**Reason:** this is a multi-venue system and tenant leakage would be severe. Route-level venue checks are part of the core architecture, not optional glue.

## Compliance snapshot
**Reason:** service readiness is unsafe if compliance is fragmented. Temperature, cleaning, and chemical documentation are aggregated because chefs need a single service-safe answer.
