-- Closes Wave 3.A #22 P0-1: cron.job_run_details "success" masks HTTP failures.
--
-- PATTERN HOTEL (per AP #58 synthesis): pg_cron records status='succeeded'
-- the moment `SELECT net.http_post(...)` ENQUEUES the request. The actual
-- HTTP call resolves async in `net._http_response`. The audit measured
-- 8/728 (1.1%) HTTP timeouts in 24h that were invisible behind a 100%
-- "cron success" reading.
--
-- This migration creates `public.cron_http_health_v` — the canonical
-- health surface that reads `net._http_response`. Joins back to
-- `net.http_request_queue` to recover the request URL, then derives the
-- edge-function name from the URL path. Aggregates the last hour.
--
-- Admin readers query this view; service_role can also use it from edge
-- functions for self-monitoring. RLS-equivalent via grants (the
-- underlying net.* tables are restricted by default; this view selects
-- only the aggregated counts, not individual request bodies).

create or replace view public.cron_http_health_v
  with (security_invoker = true)
as
with recent as (
  select
    r.id,
    r.status_code,
    r.created            as response_created,
    q.url                as request_url
  from net._http_response r
  left join net.http_request_queue q on q.id = r.id
  where r.created > now() - interval '1 hour'
),
parsed as (
  select
    -- Derive function name from /functions/v1/<name>(?...|/...)? path.
    -- Falls back to the raw URL if the pattern doesn't match (shouldn't
    -- happen for cron-triggered calls but keep the view robust).
    coalesce(
      substring(request_url from '/functions/v1/([^/?]+)'),
      request_url
    )                    as function_name,
    status_code,
    response_created
  from recent
)
select
  function_name,
  count(*) filter (where status_code between 200 and 299)        as ok_count,
  count(*) filter (where status_code is null or status_code >= 300) as fail_count,
  count(*)                                                       as total,
  max(response_created) filter (where status_code between 200 and 299) as last_success_at,
  max(response_created) filter (where status_code is null or status_code >= 300) as last_failure_at,
  -- Convenience: percentage success, rounded to 1 decimal. Avoids
  -- divide-by-zero by gating on total > 0.
  case
    when count(*) = 0 then null
    else round(100.0 * count(*) filter (where status_code between 200 and 299) / count(*), 1)
  end                                                            as success_pct
from parsed
group by function_name
order by function_name;

-- Grants: authenticated admins read via RLS on the underlying view
-- (security_invoker means RLS applies as the caller). For now, allow
-- service_role + authenticated; restrict anon. A follow-up RLS policy
-- on this view can scope it to admins-only if needed (today every
-- authenticated user is in an admin role for some org per single-tenant
-- posture; for multi-tenant, add a `WHERE caller-is-admin-in-some-org`
-- guard via an RLS policy on this view).
grant select on public.cron_http_health_v to authenticated, service_role;
revoke select on public.cron_http_health_v from anon, public;

comment on view public.cron_http_health_v is
  'Wave 3.A #22 P0-1 closure. Last-hour HTTP-layer health per edge function (last_success_at, last_failure_at, ok_count, fail_count, success_pct). Reads net._http_response (canonical HTTP-success source) rather than cron.job_run_details (only signals enqueue-success). See docs/DISASTER_RECOVERY.md §5 for the use-it-during-incident query patterns.';
