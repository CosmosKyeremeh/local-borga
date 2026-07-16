-- web-client/supabase/setup.sql
-- Run this once in the Supabase SQL Editor for a fresh project.
-- Recreated from web-client/README.md's documented schema — the original
-- setup.sql / stock-migration.sql / farm-tools-seed.sql files referenced
-- there were never committed to the repo, so this consolidates all three
-- into the final column set the app code (app/api/**) actually expects.

-- ── products ─────────────────────────────────────────────────────────
create table if not exists public.products (
  id             serial primary key,
  name           text not null,
  price          numeric not null,
  category       text not null,
  description    text,
  image          text,
  is_premium     boolean not null default false,
  section        text not null default 'staples' check (section in ('staples', 'farm_tools')),
  stock_quantity integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ── orders ───────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                  bigserial primary key,
  item_name           text not null,
  order_type          text not null default 'shelf' check (order_type in ('shelf', 'custom_milling', 'farm_tool')),
  milling_style       text,
  weight_kg           numeric,
  total_price         numeric not null,
  status              text not null default 'pending',
  cart_items          jsonb,
  customer_name       text,
  customer_email      text,
  customer_phone      text,
  shipping_address    jsonb,
  user_id             uuid references auth.users(id),
  paystack_reference  text,
  created_at          timestamptz not null default now()
);

-- ── deduct_stock(items) ──────────────────────────────────────────────
-- Atomically decrements stock_quantity for each {id, quantity} pair.
-- Called from app/api/orders/route.ts after an order is inserted.
create or replace function public.deduct_stock(items jsonb)
returns void
language plpgsql
security definer
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    update public.products
    set stock_quantity = stock_quantity - (item->>'quantity')::integer
    where id = (item->>'id')::integer;

    if not found then
      raise exception 'Product % not found', item->>'id';
    end if;
  end loop;
end;
$$;

-- ── Row Level Security ───────────────────────────────────────────────
-- API routes use the service-role key (bypasses RLS). These policies
-- only matter if the anon/browser client ever queries these tables
-- directly (e.g. Realtime subscriptions on orders).
alter table public.products enable row level security;
alter table public.orders   enable row level security;

drop policy if exists "Public read access to products" on public.products;
create policy "Public read access to products"
  on public.products for select
  using (true);

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────────────
-- account/page.tsx subscribes to postgres_changes UPDATE events on orders.
alter publication supabase_realtime add table public.orders;
