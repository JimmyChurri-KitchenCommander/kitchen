# AI Change Protocol

Before any AI agent modifies code:

1. Read `/docs/AI_QUICKSTART.md`
2. Read `/docs/AI_CURRENT_STATE.md`
3. Read `/docs/AI_SYSTEM_MAP.md`
4. Read `/docs/AI_DECISION_LOG.md`
5. Identify the impacted domains
6. Identify shared dependencies
7. Produce an impact assessment
8. Then write code

## Required impact assessment checklist
- What chef-facing question could this change alter?
- Does it touch inventory truth, cost truth, prep demand, ordering urgency, or readiness scoring?
- Does it change OpenAPI contracts or generated clients?
- Does it affect mobile as well as web?
- Does it alter venue authorization or tenant boundaries?
- Does it require schema migration, codegen, or regenerated clients?

## Additional rules
- Do not assume predictive/forecasting features exist unless verified.
- Treat these files as high risk first: inventory ledger, recipe cost, prep plan, command centre, service readiness, dishes-at-risk, DB schema, API spec.
- Mark uncertain areas as **Needs Verification**.
- If changing `/lib/api-spec/openapi.yaml`, regenerate generated clients/types.
- If changing DB schema, reconcile impacts across routes, utilities, and UI consumers.
