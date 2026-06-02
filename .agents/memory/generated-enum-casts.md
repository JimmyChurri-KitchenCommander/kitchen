---
name: Generated enum comparisons
description: Zod-inferred enum types from codegen (e.g. PrepTaskPriority) are branded types and don't overlap with plain string literals — requires a cast.
---

When Orval generates hooks from the OpenAPI spec, enum fields get typed as `z.infer<typeof SomeEnumSchema>` which TypeScript treats as a distinct branded type. Direct equality comparisons with string literals trigger TS2367 ("comparison appears unintentional").

**Rule:** Always cast enum fields to `string` before comparing: use `(task.priority as string) === "critical"` or `String(task.priority) === "critical"`. For sort functions, use `Record<string, number>` for the order map and index with `String(x)`.

**Why:** The generated type is `PrepTaskPriority = "critical" | "high" | "medium" | "low"` as a Zod enum infer, not a plain TypeScript union — the strict null checks and brand tracking cause the overlap error.
