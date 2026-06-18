# AI Current State

Update this file whenever major architecture or product-state changes happen.

## Complete
- Inventory Ledger
- FIFO Layers
- Inventory alerts and status classification
- Recipe Cost Engine
- Recipe component cost rollups
- Command Centre
- Morning Workflow (`/command-centre/morning-run`)
- Service Readiness scoring
- Dishes At Risk calculation
- Supplier cutoff intelligence
- Waste logging
- Temperature logging
- Cleaning/compliance snapshots
- Purchase orders CRUD
- Invoice storage and invoice scan/apply flows
- Multi-venue access model

## Partially complete
- PO receiving workflow
- Prep execution logging
- Food cost confidence / freshness signals
- Mobile operations shell
- AI assistant context groundwork
- Service Mode operational workflow
- Analytics breadth beyond current waste / stock / price signals

## Planned or Needs Verification
- AI Sous Chef
- Forecast Engine
- Service Readiness History
- Predictive Ordering
- Historical risk trend intelligence

## Notes
- The repo clearly contains foundations for AI-ready context building (`assistantContext`, OpenAI/Anthropic integrations), but end-user AI workflows beyond structured context remain **Needs Verification**.
- Forecasting and predictive ordering are not established as finished systems in the explored code and should not be assumed to exist.
