-- Closes Wave 3.A #22 P1: cron.job_run_details has no retention policy.
-- Audit measured 28MB / 53k rows at 20 days; ~365MB/year unbounded.
--
-- Adds a SECDEF cleanup function (deletes rows older than 30 days) +
-- schedules it daily at 03:00 UTC via pg_cron. Conservative window:
-- 30 days is long enough for any operator incident triage; longer is
-- waste. Run frequency: daily covers any growth pattern.

create or replace function public.cleanup_cron_job_run_details()
returns void
language sql
security definer
set search_path = cron, pg_catalog
as $$
  delete from cron.job_run_details
   where start_time < now() - interval '30 days';
$$;

revoke execute on function public.cleanup_cron_job_run_details() from public;
revoke execute on function public.cleanup_cron_job_run_details() from anon;
revoke execute on function public.cleanup_cron_job_run_details() from authenticated;

comment on function public.cleanup_cron_job_run_details() is
  'Daily cleanup of cron.job_run_details rows older than 30 days. Closes Wave 3.A #22 P1 (no retention policy → unbounded growth).';

-- Schedule the job. If a prior schedule with the same name exists,
-- replace it.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-cron-job-run-details') then
    perform cron.unschedule('cleanup-cron-job-run-details');
  end if;
  perform cron.schedule(
    'cleanup-cron-job-run-details',
    '0 3 * * *',
    $cmd$select public.cleanup_cron_job_run_details();$cmd$
  );
end $$;

-- Verification
do $$
declare
  job_count int;
begin
  select count(*) into job_count from cron.job where jobname = 'cleanup-cron-job-run-details';
  if job_count <> 1 then
    raise exception 'cleanup-cron-job-run-details schedule missing';
  end if;
end $$;
