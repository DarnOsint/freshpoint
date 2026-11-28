-- Run this in the Supabase SQL editor after audit-logging.sql.
-- The login API also falls back to audit_logs when this migration is not applied.

create table if not exists public.login_rate_limits (
  attempt_key text primary key,
  failed_count integer not null default 0,
  first_failed_at timestamptz,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.login_rate_limits enable row level security;
revoke all on public.login_rate_limits from anon, authenticated;
grant all on public.login_rate_limits to service_role;

create or replace function public.consume_login_attempt(
  p_key text,
  p_limit integer default 8,
  p_window_seconds integer default 900,
  p_block_seconds integer default 900
)
returns table (allowed boolean, retry_after integer, attempts_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_state public.login_rate_limits%rowtype;
  v_count integer;
  v_blocked_until timestamptz;
begin
  if p_key is null or length(p_key) = 0 then
    return query select false, 1, 0;
    return;
  end if;

  -- Serialize attempts for the same key so parallel requests cannot both pass.
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  select * into v_state from public.login_rate_limits where attempt_key = p_key;
  if not found then
    insert into public.login_rate_limits (attempt_key, updated_at)
    values (p_key, v_now)
    returning * into v_state;
  end if;

  if v_state.blocked_until is not null and v_state.blocked_until > v_now then
    return query select false, greatest(1, ceil(extract(epoch from (v_state.blocked_until - v_now)))::integer), 0;
    return;
  end if;

  if v_state.first_failed_at is null
     or v_state.first_failed_at <= v_now - (p_window_seconds || ' seconds')::interval then
    update public.login_rate_limits
      set failed_count = 0,
          first_failed_at = null,
          blocked_until = null,
          updated_at = v_now
      where attempt_key = p_key
      returning * into v_state;
  end if;

  v_count := v_state.failed_count + 1;
  v_blocked_until := case
    when v_count >= p_limit then v_now + (p_block_seconds || ' seconds')::interval
    else null
  end;

  update public.login_rate_limits
    set failed_count = v_count,
        first_failed_at = coalesce(v_state.first_failed_at, v_now),
        blocked_until = v_blocked_until,
        updated_at = v_now
    where attempt_key = p_key;

  return query select true, 0, greatest(p_limit - v_count, 0);
end;
$$;

revoke all on function public.consume_login_attempt(text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_login_attempt(text, integer, integer, integer) to service_role;
