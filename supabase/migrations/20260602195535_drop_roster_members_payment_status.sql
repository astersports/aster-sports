-- Closes Wave 3.B #10 P1: roster_members.payment_status is dead column.
--
-- Per CLAUDE.md §11.5: payment_status moved to family_balances. The
-- column on roster_members was a "stale constant" (per useRoster.js:11
-- comment) that no live code path reads.
--
-- Pre-flight verification (per AP #34 removal discipline):
--   grep -rn "payment_status" src/ supabase/functions/
--   → only ASSIGNS to the derived `player.payment_status` in
--     useRoster.js:84 (computed from family_balances, NOT read from
--     this column) + UI in PlayerRow.jsx:59-62 reads the derived value.
--   → zero callers SELECT or filter on roster_members.payment_status.
--
-- Also drops the COMMENT from migration 20260505201932 that referenced
-- payment_status as a canonical column — the comment is updated to
-- match the new shape (sizes/amount_paid/amount_due remain; payment
-- status moved to family_balances).

alter table public.roster_members
  drop column if exists payment_status;

-- Refresh the table comment to drop the payment_status mention.
comment on table public.roster_members is
  'CANONICAL: registration + sizes (jersey_size, shorts_size, amount_paid, amount_due). App code reads from here ONLY for sizes and historical date-window eligibility (registered_at, left_at) used in 5 attendance/RSVP views. payment_status was dropped 2026-06-02; payment status now lives in family_balances (per §11.5). NEVER read jersey_number from here in new code; team_players.jersey_number is canonical.';

-- Verification: column is gone.
do $$
declare
  col_count int;
begin
  select count(*) into col_count
    from information_schema.columns
   where table_schema = 'public' and table_name = 'roster_members' and column_name = 'payment_status';
  if col_count <> 0 then
    raise exception 'roster_members.payment_status drop failed';
  end if;
end $$;
