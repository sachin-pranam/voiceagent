create or replace function public.call_stats(_tz text default 'UTC')
returns json language sql stable security invoker set search_path = public as $$
  select json_build_object(
    'total_calls', (select count(*) from public.calls),
    'calls_today', (select count(*) from public.calls where (coalesce(started_at, created_at) at time zone _tz)::date = (now() at time zone _tz)::date),
    'total_duration', (select coalesce(sum(duration_seconds), 0) from public.calls),
    'total_cost', (select coalesce(sum(cost_usd), 0) from public.calls),
    'per_day', (
      select json_agg(json_build_object('day', d::date, 'count', (
        select count(*) from public.calls c where (coalesce(c.started_at, c.created_at) at time zone _tz)::date = d::date
      )) order by d)
      from generate_series((now() at time zone _tz)::date - 6, (now() at time zone _tz)::date, interval '1 day') d
    )
  )
$$;
revoke execute on function public.call_stats(text) from public, anon;
grant execute on function public.call_stats(text) to authenticated;