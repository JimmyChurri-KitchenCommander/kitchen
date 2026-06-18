-- Phase 1: inventory layers and ledger-backed stock movements.
-- Current deployment uses Drizzle schema push; this SQL is the explicit migration
-- plan for Supabase-hosted Postgres environments that apply migrations manually.

alter table public.inventory_items
  add column if not exists stock_type text not null default 'raw';

update public.inventory_items
set stock_type = 'prep'
where production_recipe_id is not null
  and stock_type = 'raw';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_items_stock_type_check'
      and conrelid = 'public.inventory_items'::regclass
  ) then
    alter table public.inventory_items
      add constraint inventory_items_stock_type_check
      check (stock_type in ('raw', 'prep', 'finished'));
  end if;
end $$;

create table if not exists public.inventory_layers (
  id serial primary key,
  venue_id integer not null references public.venues(id) on delete cascade,
  inventory_item_id integer not null references public.inventory_items(id) on delete cascade,
  source_type text not null,
  source_id integer,
  quantity_received numeric(12, 4) not null,
  quantity_remaining numeric(12, 4) not null,
  unit_cost numeric(10, 4) not null default 0,
  received_at timestamp default now() not null,
  expires_at timestamp,
  created_by text,
  created_at timestamp default now() not null
);

create index if not exists inventory_layers_venue_idx
  on public.inventory_layers (venue_id);

create index if not exists inventory_layers_item_idx
  on public.inventory_layers (inventory_item_id);

create index if not exists inventory_layers_item_received_idx
  on public.inventory_layers (inventory_item_id, received_at);

create table if not exists public.inventory_ledger_entries (
  id serial primary key,
  venue_id integer not null references public.venues(id) on delete cascade,
  inventory_item_id integer not null references public.inventory_items(id) on delete cascade,
  layer_id integer references public.inventory_layers(id) on delete set null,
  transaction_type text not null,
  quantity_delta numeric(12, 4) not null,
  resulting_stock numeric(12, 4) not null,
  unit_cost numeric(10, 4) not null default 0,
  cost_impact numeric(12, 4) not null default 0,
  reason text not null,
  reference_type text,
  reference_id integer,
  idempotency_key text,
  metadata jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamp default now() not null
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_ledger_entries_transaction_type_check'
      and conrelid = 'public.inventory_ledger_entries'::regclass
  ) then
    alter table public.inventory_ledger_entries
      add constraint inventory_ledger_entries_transaction_type_check
      check (transaction_type in (
        'PURCHASE',
        'PRODUCTION_INPUT',
        'PRODUCTION_OUTPUT',
        'SALE',
        'WASTE',
        'STOCKTAKE'
      ));
  end if;
end $$;

create index if not exists inventory_ledger_entries_venue_idx
  on public.inventory_ledger_entries (venue_id);

create index if not exists inventory_ledger_entries_item_created_idx
  on public.inventory_ledger_entries (inventory_item_id, created_at);

create index if not exists inventory_ledger_entries_type_idx
  on public.inventory_ledger_entries (transaction_type);

create unique index if not exists inventory_ledger_entries_idempotency_key_unique
  on public.inventory_ledger_entries (idempotency_key);
