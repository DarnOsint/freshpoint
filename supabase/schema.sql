-- FreshPoint Supabase schema.
-- Run this in the Supabase SQL editor before signup/login and before switching the app
-- from localStorage to Supabase tables. Product/hero images live in Cloudflare R2;
-- these tables store only the public object key (or a full URL).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text,
  phone text unique,
  email text unique,
  account_type text not null default 'household'
    check (account_type in ('household', 'retailer', 'restaurant', 'wholesale')),
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent upgrade for databases created before the role column existed.
alter table public.profiles
  add column if not exists role text not null default 'customer'
    check (role in ('customer', 'admin'));

create unique index if not exists profiles_username_key on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin access is granted by setting app_metadata.role = 'admin' on the auth user.
-- The profiles.role column mirrors it for reporting only.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Catalogue. `image` is an R2 object key such as products/tomatoes.jpg,
-- or a full https URL if you serve images from a different public domain.
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(12, 2) not null check (price >= 0),
  unit text not null default 'per kg',
  emoji text not null default '🥬',
  tone text not null default 'green'
    check (tone in ('red', 'orange', 'brown', 'green', 'amber', 'teal')),
  stock integer not null default 0 check (stock >= 0),
  image text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Products are public" on public.products;
create policy "Products are public"
  on public.products for select
  using (true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- Orders and their line items.
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  customer text not null,
  phone text not null,
  address text not null,
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'Pending'
    check (status in ('Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all orders" on public.orders;
create policy "Admins can read all orders"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  name text not null,
  quantity integer not null check (quantity > 0),
  price numeric(12, 2) not null check (price >= 0),
  emoji text,
  image text,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can read all order items" on public.order_items;
create policy "Admins can read all order items"
  on public.order_items for select
  using (public.is_admin());

drop policy if exists "Users can create own order items" on public.order_items;
create policy "Users can create own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- Keep updated_at accurate on mutable tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Email confirmation codes are generated and sent by the serverless API via Resend.
-- This table is server-only; no anon or authenticated grants are given.
create table if not exists public.email_confirmations (
  email text primary key,
  user_id uuid not null,
  code_hash text not null,
  full_name text not null,
  username text not null,
  phone text,
  account_type text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_confirmations enable row level security;
revoke all on public.email_confirmations from anon, authenticated;
grant all on public.email_confirmations to service_role;

drop trigger if exists email_confirmations_set_updated_at on public.email_confirmations;
create trigger email_confirmations_set_updated_at
  before update on public.email_confirmations
  for each row execute function public.set_updated_at();

-- Password reset codes are emailed by the serverless API via Resend.
-- Server-only, like email_confirmations.
create table if not exists public.password_resets (
  email text primary key,
  user_id uuid not null,
  code_hash text not null,
  full_name text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.password_resets enable row level security;
revoke all on public.password_resets from anon, authenticated;
grant all on public.password_resets to service_role;

drop trigger if exists password_resets_set_updated_at on public.password_resets;
create trigger password_resets_set_updated_at
  before update on public.password_resets
  for each row execute function public.set_updated_at();

-- Supabase creates these roles, but raw SQL tables need explicit REST privileges.
grant usage on schema public to anon, authenticated, service_role;
grant all on public.profiles, public.products, public.orders, public.order_items to service_role;
grant usage, select on sequence public.order_items_id_seq to service_role;
grant select, insert, update on public.profiles to authenticated;
grant select on public.products to anon, authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant usage, select on sequence public.order_items_id_seq to authenticated;

-- Signup: check a username before creating the auth account.
create or replace function public.username_exists(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where lower(username) = lower(p_username)
  );
$$;

-- Login: resolve a username to the identifier Supabase can authenticate.
create or replace function public.login_identifier_for_username(p_username text)
returns table (identifier text, kind text)
language sql
security definer
set search_path = public
as $$
  select email as identifier, 'email'::text as kind
    from public.profiles
   where lower(username) = lower(p_username) and email is not null
  union all
  select phone as identifier, 'phone'::text as kind
    from public.profiles
   where lower(username) = lower(p_username) and phone is not null
  limit 1;
$$;

-- Phone login falls back to the linked email when Supabase phone sign-in is off.
create or replace function public.login_identifier_for_phone(p_phone text)
returns table (email text)
language sql
security definer
set search_path = public
as $$
  select email
    from public.profiles
   where email is not null
     and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  limit 1;
$$;

revoke all on function public.username_exists(text) from public;
revoke all on function public.login_identifier_for_username(text) from public;
revoke all on function public.login_identifier_for_phone(text) from public;
grant execute on function public.username_exists(text) to anon, authenticated;
grant execute on function public.login_identifier_for_username(text) to anon, authenticated;
grant execute on function public.login_identifier_for_phone(text) to anon, authenticated;
