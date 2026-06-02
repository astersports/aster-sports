-- Closes Wave 3.A #22 P1: weekly_sunday handler dedup race window.
--
-- Today briefing-auto-draft-tick's weekly_sunday handler runs SELECT
-- existing → if absent INSERT (briefing-auto-draft-tick/index.ts
-- handleWeeklySunday). Two concurrent ticks can both SELECT no row
-- and both INSERT, producing duplicate draft rows.
--
-- Partial UNIQUE index closes the race at the DB layer: only one
-- (org_id, period_start) row can exist for kind='weekly_digest' when
-- the row is in an active status (draft / scheduled / queued / sent).
-- The handler-side change (catch 23505 unique_violation in a
-- companion commit / follow-up PR) treats the loser-tick as "skipped:
-- race_resolved_other_tick_won" rather than a hard error.

create unique index if not exists comms_messages_weekly_digest_unique
  on public.comms_messages (org_id, period_start)
  where kind = 'weekly_digest'
    and status in ('draft', 'scheduled', 'queued', 'sent');

comment on index public.comms_messages_weekly_digest_unique is
  'Wave 3.A #22 P1 closure. Blocks the SELECT-then-INSERT race in the weekly_sunday cron handler. Partial index — only enforced for active weekly_digest rows; cancelled / failed rows are ignored so a fresh retry is unblocked.';

-- Verification: no existing duplicates would block this index.
do $$
declare
  dup_count int;
begin
  select count(*) into dup_count
    from (
      select org_id, period_start, count(*)
        from public.comms_messages
       where kind = 'weekly_digest'
         and status in ('draft', 'scheduled', 'queued', 'sent')
       group by org_id, period_start
      having count(*) > 1
    ) d;
  if dup_count > 0 then
    raise exception 'cannot create unique index: % duplicate (org_id, period_start) groups found in active weekly_digest rows. Reconcile manually first.', dup_count;
  end if;
end $$;
