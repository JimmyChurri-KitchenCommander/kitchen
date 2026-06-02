---
name: Service mode API pattern
description: Service mode Express routes are intentionally public (no requireAuth) and are not in the OpenAPI spec — use fetch directly in the frontend.
---

The `/api/venues/:venueId/service/*` Express routes were built as public, unauthenticated endpoints (for kitchen display screens / staff tablets). They are **not** registered in `lib/api-spec/openapi.yaml`, so Orval codegen does not generate hooks for them.

**Rule:** In any page that talks to service mode endpoints, use `useQuery` / `useMutation` with a custom `queryFn` that calls `fetch("/api/venues/${venueId}/service/...")` directly. Do not attempt to add these to the OpenAPI spec without also adding auth.

**Why:** These routes are designed to be called from wall-mounted kitchen displays that don't hold a Clerk session. Adding them to the spec would cause code-gen to wrap them with auth headers they don't expect.

**How to apply:** When writing service-mode.tsx or any page that polls kitchen display endpoints, import `useQuery` from `@tanstack/react-query` and call `fetch(...)` directly, exactly as done in service-mode.tsx `ServiceConfig` query.
