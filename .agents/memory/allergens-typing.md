---
name: Allergens field typing
description: The allergens jsonb column exists in DB and is returned by the API, but is not yet in the OpenAPI spec's Recipe/RecipeDetail schema — requires a cast in the frontend.
---

The `allergens` column is `jsonb` in the `recipes` table, holding a `string[]` of EU allergen keys. The API `parseRecipe` function returns it as `allergens: (r.allergens as string[] | null) ?? []`.

However, the OpenAPI spec's `Recipe` and `RecipeDetail` schemas do not yet include the `allergens` field (the spec was updated for `RecipeInput` and `RecipeUpdate` but not the response schemas). Orval therefore doesn't include `allergens` in the generated TypeScript `Recipe` type.

**Rule:** Access allergens in frontend components via `(recipe as any).allergens as string[] | null | undefined` until the OpenAPI spec's response schemas are updated.

**How to fix fully:** Add `allergens` to the `Recipe` and `RecipeDetail` schemas in `lib/api-spec/openapi.yaml` and re-run `pnpm --filter @workspace/api-spec run codegen`. Then the cast can be removed.
