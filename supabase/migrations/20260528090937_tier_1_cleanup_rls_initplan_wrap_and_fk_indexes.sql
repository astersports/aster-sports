-- TIER 1 cleanup (gap-analysis morning, 2026-05-28). All changes are
-- functionally equivalent or additive — zero behavior change.
--   (1) Wrap bare auth.uid() in (SELECT auth.uid()) across 26 policies on
--       11 tables (CLAUDE.md §5 "RLS Pattern: auth.uid() subselect wrapper").
--       Pure query-planner optimization — initplan vs per-row evaluation.
--   (2) Drop the legacy duplicate index from the tournament_messages ->
--       comms_messages rename (foundation migration 20260508234920).
--   (3) Add covering indexes for 21 hot FKs on event/comms/financial/
--       tournament/invitation tables.

-- (1) RLS init-plan wrap sweep. Idempotent: any auth.uid() already wrapped
-- in (SELECT auth.uid()) is protected via placeholder swap before the
-- general rewrite. DROP + CREATE pair is atomic in this transaction; no
-- external observer sees a policy-less window.
DO $sweep$
DECLARE
  r RECORD;
  new_qual TEXT;
  new_check TEXT;
  to_clause TEXT;
  using_clause TEXT;
  check_clause TEXT;
  permissive_word TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'briefing_reminders','briefing_templates','briefing_triggers',
        'guardian_email_preferences','org_briefing_contacts','staff_profiles',
        'event_change_audit','rsvp_token_uses','callup_token_uses',
        'pii_audit_log','invitations'
      ])
      AND (coalesce(qual,'') || coalesce(with_check,'')) ~ 'auth\.uid\(\)'
  LOOP
    new_qual := r.qual;
    new_check := r.with_check;
    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, '\(\s*SELECT\s+auth\.uid\(\)\s*\)', '__SF_WRAPPED_UID__', 'g');
      new_qual := regexp_replace(new_qual, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, '__SF_WRAPPED_UID__', '(SELECT auth.uid())', 'g');
    END IF;
    IF new_check IS NOT NULL THEN
      new_check := regexp_replace(new_check, '\(\s*SELECT\s+auth\.uid\(\)\s*\)', '__SF_WRAPPED_UID__', 'g');
      new_check := regexp_replace(new_check, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
      new_check := regexp_replace(new_check, '__SF_WRAPPED_UID__', '(SELECT auth.uid())', 'g');
    END IF;
    permissive_word := CASE WHEN r.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;
    to_clause := (SELECT string_agg(quote_ident(unrole::text), ', ') FROM unnest(r.roles) AS unrole);
    using_clause := CASE WHEN new_qual IS NOT NULL THEN format(' USING (%s)', new_qual) ELSE '' END;
    check_clause := CASE WHEN new_check IS NOT NULL THEN format(' WITH CHECK (%s)', new_check) ELSE '' END;

    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s',
      r.policyname, r.tablename, permissive_word, r.cmd, to_clause, using_clause, check_clause
    );
  END LOOP;
END $sweep$;

-- (2) Legacy duplicate index from the tournament_messages -> comms_messages
-- rename (the comms_message_recipients_message_id_idx is the canonical one).
DROP INDEX IF EXISTS public.idx_tmr_message_id;

-- (3) Covering indexes for 21 hot FKs. All IF NOT EXISTS so the migration
-- is idempotent if any partial state already exists.
CREATE INDEX IF NOT EXISTS check_ins_checked_in_by_idx ON public.check_ins (checked_in_by);
CREATE INDEX IF NOT EXISTS check_ins_player_id_idx ON public.check_ins (player_id);
CREATE INDEX IF NOT EXISTS comms_messages_last_edited_by_idx ON public.comms_messages (last_edited_by);
CREATE INDEX IF NOT EXISTS comms_messages_sent_by_idx ON public.comms_messages (sent_by);
CREATE INDEX IF NOT EXISTS comms_messages_team_id_idx ON public.comms_messages (team_id);
CREATE INDEX IF NOT EXISTS event_arrivals_guardian_id_idx ON public.event_arrivals (guardian_id);
CREATE INDEX IF NOT EXISTS event_comments_author_user_id_idx ON public.event_comments (author_user_id);
CREATE INDEX IF NOT EXISTS event_ride_requests_for_child_id_idx ON public.event_ride_requests (for_child_id);
CREATE INDEX IF NOT EXISTS event_ride_requests_fulfilled_by_offer_id_idx ON public.event_ride_requests (fulfilled_by_offer_id);
CREATE INDEX IF NOT EXISTS event_ride_requests_org_id_idx ON public.event_ride_requests (org_id);
CREATE INDEX IF NOT EXISTS financial_transactions_applied_to_player_id_idx ON public.financial_transactions (applied_to_player_id);
CREATE INDEX IF NOT EXISTS financial_transactions_recorded_by_idx ON public.financial_transactions (recorded_by);
CREATE INDEX IF NOT EXISTS game_results_entered_by_idx ON public.game_results (entered_by);
CREATE INDEX IF NOT EXISTS game_results_player_of_game_id_idx ON public.game_results (player_of_game_id);
CREATE INDEX IF NOT EXISTS game_results_published_by_idx ON public.game_results (published_by);
CREATE INDEX IF NOT EXISTS invitations_accepted_by_idx ON public.invitations (accepted_by);
CREATE INDEX IF NOT EXISTS invitations_cancelled_by_idx ON public.invitations (cancelled_by);
CREATE INDEX IF NOT EXISTS invitations_invited_by_idx ON public.invitations (invited_by);
CREATE INDEX IF NOT EXISTS invitations_team_id_idx ON public.invitations (team_id);
CREATE INDEX IF NOT EXISTS tournament_rosters_player_id_idx ON public.tournament_rosters (player_id);
CREATE INDEX IF NOT EXISTS tournament_rosters_team_id_idx ON public.tournament_rosters (team_id);
