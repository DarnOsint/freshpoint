-- Run this in the Supabase SQL editor after the manager-roles migration.
-- Audit rows are written by the service role only; the browser never inserts directly.

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text not null default '',
  actor_role text not null default '',
  action text not null,
  target_type text not null,
  target_id text not null default '',
  details jsonb not null default '{}'::jsonb
);

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
