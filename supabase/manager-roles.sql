-- Align an existing FreshPoint database with the three-role model.
-- Safe to re-run. The app works from app_metadata.role; this keeps profiles
-- and row-level policies consistent.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'manager', 'admin'));

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'manager'), false);
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to anon, authenticated;

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Staff can read all profiles" on public.profiles;
create policy "Staff can read all profiles"
  on public.profiles for select
  using (public.is_staff());

drop policy if exists "Admins can read all orders" on public.orders;
drop policy if exists "Staff can read all orders" on public.orders;
create policy "Staff can read all orders"
  on public.orders for select
  using (public.is_staff());

drop policy if exists "Admins can read all order items" on public.order_items;
drop policy if exists "Staff can read all order items" on public.order_items;
create policy "Staff can read all order items"
  on public.order_items for select
  using (public.is_staff());
