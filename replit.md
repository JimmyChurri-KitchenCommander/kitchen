# Kitchen Command

A chef-first operational intelligence system for restaurants — a digital sous chef and prep whiteboard for professional kitchens.

Brand name: **Kitchen Command**. Tagline: "Don't just run a kitchen. Command it."

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/hospitality-ops run dev` — run the web app (port 23011, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to Supabase
- Required env: `SUPABASE_DB_CONN` (scheme-free pooler URL), `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
- Falls back to `DATABASE_URL` if `SUPABASE_DB_CONN` is not set (for local dev)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Lucide React, Recharts, Zustand, Wouter
- Auth: Clerk (managed by Replit)
- API: Express 5 with Clerk middleware
- DB: Supabase hosted PostgreSQL 17 + Drizzle ORM (session pooler, SSL)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — all DB table definitions (venues, suppliers, inventory, priceHistory, recipes, waste, invoices)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — requireAuth middleware (Clerk)
- `artifacts/hospitality-ops/src/pages/` — all page components
- `artifacts/hospitality-ops/src/stores/venueStore.ts` — Zustand active venue store

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks. Always regenerate after spec changes.
- Venue ownership: every route verifies the venue belongs to the authenticated user before serving data.
- Theme: dark mode by default (navy/blue command-centre palette matching landing page). Light mode also available. `ThemeProvider` at `src/providers/ThemeProvider.tsx` reads from `localStorage` key `ops-theme` and defaults to `"dark"`. Toggle lives in Settings → Appearance.
- Database: `lib/db/src/index.ts` builds the connection string from `SUPABASE_DB_CONN` (prepends `postgresql://` scheme, enables SSL). Drizzle config in `lib/db/drizzle.config.ts` does the same for `drizzle-kit push`. The Replit secrets panel mangles `postgresql://` URLs so the scheme is stored separately.
- Stagnant/status logic lives in the API layer, computed fresh on every request from `lastRestocked`.
- Clerk proxy middleware intercepts Clerk's own frontend SDK calls, enabling auth to work behind the shared proxy.

## Product

- **Dashboard (Today Mode)**: operational cockpit with supplier cutoff countdowns, stagnant stock suggestions, low stock alerts, and waste cost for the day
- **Inventory**: full item list with status colors (healthy/low/stagnant/expiry risk), inline stock editing, par level tracking
- **Suppliers**: supplier list with order cutoff countdowns and delivery day info, price history charts
- **Recipes**: recipe library with auto-computed food cost %, GP%, and portion cost from linked inventory items
- **Waste Log**: quick-log form for spoilage/overproduction with cost impact tracking
- **Invoices**: invoice tracking with status (pending/processed/flagged)
- **Analytics**: waste cost trends (Recharts), stagnant capital, price spike alerts
- **Venues**: multi-venue support with venue switcher in navigation

## User preferences

- Mobile-first UI with blue accents — dark mode by default, light mode available via Settings toggle
- Chef language throughout ("You're burning through rocket", not "Inventory variance detected")
- No emojis anywhere in the UI
- Color status coding: green=healthy, yellow=stagnant, orange=low_stock, red=critical

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — the DB lib is composite and must be built first
- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen`
- After changing DB schema, run `pnpm --filter @workspace/db run push` to apply migrations
- `req.params` in Express 5 with `@types/express` v5 requires `as string` cast: `req.params["id"] as string`
- Route handlers must declare `: Promise<void>` return type and use `res.status(X).json(Y); return;` pattern (not `return res.status(X).json(Y)`) due to `noImplicitReturns: true`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/clerk-auth/SKILL.md` for Clerk integration details
