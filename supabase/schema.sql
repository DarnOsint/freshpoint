-- Run in the Supabase SQL editor before using signup/login.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text,
  phone text unique,
  email text unique,
  account_type text not null default 'household'
    check (account_type in ('household', 'retailer', 'restaurant', 'wholesale')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_key on public.profiles (lower(username));

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

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
  select phone as identifier, 'phone'::text as kind
    from public.profiles
   where lower(username) = lower(p_username) and phone is not null
  union all
  select email as identifier, 'email'::text as kind
    from public.profiles
   where lower(username) = lower(p_username) and email is not null
  limit 1;
$$;

revoke all on function public.username_exists(text) from public;
revoke all on function public.login_identifier_for_username(text) from public;
grant execute on function public.username_exists(text) to anon, authenticated;
grant execute on function public.login_identifier_for_username(text) to anon, authenticated;
