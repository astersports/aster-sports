-- Wave 3.A #19 P0-1 follow-on: expire the pre-dispatcher event_notifications
-- backlog. 30 rows sat queued (oldest 2026-05-12, newest 2026-05-28) because
-- no dispatcher consumed them. With the dispatcher going live inside
-- briefing-auto-draft-tick, these stale rows must NOT fire — a 12-17 day old
-- "schedule changed / cancelled" blast to families would be confusing
-- (Decision B, 2026-05-29). Mark them 'cancelled' (predates dispatcher; not an
-- error, so no failed_at/failure_reason per the failure_pair CHECK).
--
-- Deterministic on db reset: a fresh DB has no backlog rows, so this is a
-- no-op there. The fixed cutoff pins it to rows that exist at cutover time.
UPDATE public.event_notifications
SET status = 'cancelled'
WHERE status = 'queued'
  AND created_at < '2026-05-29T02:00:00+00:00';
