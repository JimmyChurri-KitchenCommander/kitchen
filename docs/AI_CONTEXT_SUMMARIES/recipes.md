# Recipes

## Purpose
Represent dishes and prep recipes, connect them to inventory, and calculate cost.

## Key files
- `lib/db/src/schema/recipes.ts`
- `artifacts/api-server/src/utils/recipeCost.ts`
- `artifacts/api-server/src/routes/recipes.ts`

## Key routes
- `/api/venues/:venueId/recipes*`
- includes ingredient, component, import, activate/deactivate, classify, and prep-log flows

## Key tables
- `recipes`
- `recipe_ingredients`
- `recipe_components`

## Business rules
- Recipes can be menu recipes or prep recipes.
- Menu recipes can consume prep recipes through components.
- Cost rolls through nested prep components with cycle guards.
- Review-date and cost-date freshness matter for food-cost confidence.

## Architecture
Recipes depend on inventory pricing and feed menu, prep planning, dishes-at-risk, and command-centre readiness.
