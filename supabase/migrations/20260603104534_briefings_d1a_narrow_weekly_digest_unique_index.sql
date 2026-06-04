-- Briefings Phase 3 — D-1(a) BUG A fix: narrow comms_messages_weekly_digest_unique predicate.
--
-- Cross-reference: docs/REDESIGN_BRIEFINGS_2026-06-03.md §2.D-1.
-- Origin: docs/AUDIT_BRIEFINGS_2026-06-02.md §1.3-DEEP-1 (BUG A reshape).
--
-- The original index (migration 20260602195100) covered statuses
-- {draft, scheduled, queued, sent}. This was too aggressive: the
-- briefing-auto-draft-tick cron writes a draft row at the start of
-- the week; when the admin composer subsequently attempts a fresh
-- INSERT for the same (org_id, period_start), the index throws
-- 23505 and the admin sees a raw "duplicate key value violates"
-- error.
--
-- The structural intent of the dedup was the SELECT-then-INSERT
-- race in the cron's weekly_sunday handler (Wave 3.A #22 P1). That
-- race only matters for ROWS THAT WILL ACTUALLY SEND — sent +
-- scheduled + queued. Two concurrent drafts coexisting is fine;
-- the composer's flush() distinguishes via local draftId state
-- and the StepKindPicker's DraftResumeRow surfaces existing drafts
-- to the admin.
--
-- The companion change in D-1(c) — handle 23505 in flush() with
-- the race-resolved-other-tick-won pattern — lands in a separate
-- PR.

drop index if exists public.comms_messages_weekly_digest_unique;

create unique index comms_messages_weekly_digest_unique
  on public.comms_messages (org_id, period_start)
  where kind = 'weekly_digest'
    and status in ('scheduled', 'queued', 'sent');

comment on index public.comms_messages_weekly_digest_unique is
  'Wave 3.A #22 P1 closure (narrowed 2026-06-03 per BUG A fix shape D-1(a)). Blocks the SELECT-then-INSERT race for rows that will actually send. Drafts can coexist; composer.flush() distinguishes via local draftId state.';

-- Verification: no existing duplicates in the narrowed status set
-- would block the new index.
do $$
declare
  dup_count int;
begin
  select count(*) into dup_count
    from (
      select org_id, period_start, count(*)
        from public.comms_messages
       where kind = 'weekly_digest'
         and status in ('scheduled', 'queued', 'sent')
       group by org_id, period_start
      having count(*) > 1
    ) d;
  if dup_count > 0 then
    raise exception 'cannot create narrowed unique index: % duplicate (org_id, period_start) groups found in active-send weekly_digest rows. Reconcile manually first.', dup_count;
  end if;
end $$;
