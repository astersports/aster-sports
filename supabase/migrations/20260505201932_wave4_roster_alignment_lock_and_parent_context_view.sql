-- Wave 4: Roster alignment lock + parent_context_v
-- Applied: 2026-05-05 20:19:32 UTC via Supabase MCP apply_migration
-- Project: vrwwpsbfbnveawqwbdmj (Legacy Hoopers / Skyfire / Ember)
--
-- Documents canonical sources via comments + creates the parent_context_v
-- helper view + locks team_players ↔ roster_members alignment via trigger.
--
-- Design decisions:
--   - Trigger (not CHECK): Postgres CHECK can't reference other tables.
--     ~1ms overhead per INSERT to team_players; invisible at 63 rows.
--   - One-direction only: fires on team_players writes, not roster_members.
--     roster_members.jersey_number is documented as LEGACY.
--   - parent_context_v uses SECURITY INVOKER so RLS on underlying tables applies.

-- 1. Canonical source documentation (lives in pg_description, queryable by tooling)
COMMENT ON TABLE public.team_players IS
  'CANONICAL: current team membership, jersey, roster_type (rostered/futures), and active/inactive status. App code reads from here for "who is on which team right now" questions. Aligned with roster_members via tg_team_players_alignment_check trigger.';

COMMENT ON TABLE public.roster_members IS
  'CANONICAL: registration / payment / sizes (jersey_size, shorts_size, payment_status, amount_paid, amount_due). App code reads from here ONLY for sizes and historical date-window eligibility (registered_at, left_at) used in 5 attendance/RSVP views. NEVER read jersey_number from here in new code; team_players.jersey_number is canonical.';

COMMENT ON COLUMN public.roster_members.jersey_number IS
  'LEGACY. Kept in sync with team_players.jersey_number via alignment trigger. New code must read team_players.jersey_number instead.';

COMMENT ON COLUMN public.team_players.jersey_number IS
  'CANONICAL jersey number. Type: text (handles "00", letters, etc.). Aligned with roster_members.jersey_number::text via trigger.';

-- 2. parent_context_v: canonical source for AuthContext.parentContext
-- Returns one row per (user, child, team) tuple.
-- Replaces the inline JOIN in parentContext.js.
CREATE OR REPLACE VIEW public.parent_context_v
  WITH (security_invoker = true)
AS
SELECT
  g.user_id,
  g.id         AS guardian_id,
  p.id         AS player_id,
  p.first_name AS player_first_name,
  p.last_name  AS player_last_name,
  p.dob        AS player_dob,
  tp.team_id,
  t.name       AS team_name,
  t.team_color,
  tp.jersey_number,
  tp.roster_type,
  tp.status    AS roster_status
FROM public.guardians g
JOIN public.player_guardians pg ON pg.guardian_id = g.id
JOIN public.players p           ON p.id = pg.player_id
JOIN public.team_players tp     ON tp.player_id = p.id AND tp.status = 'active'
JOIN public.teams t             ON t.id = tp.team_id
WHERE g.user_id IS NOT NULL;

GRANT SELECT ON public.parent_context_v TO authenticated;

COMMENT ON VIEW public.parent_context_v IS
  'CANONICAL: parent app context. AuthContext.parentContext reads this view to populate myChildren + myTeamIds. SECURITY INVOKER, so RLS on guardians/players/team_players/teams applies. Filters team_players.status=active so old roster rows do not appear. Returns one row per (user, child, team).';

-- 3. Alignment trigger: prevent team_players inserts without matching roster_members
CREATE OR REPLACE FUNCTION public.tg_team_players_alignment_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $function$
BEGIN
  -- On INSERT or UPDATE: every active team_players row must have a matching roster_members row
  IF NEW.status = 'active' AND NOT EXISTS (
    SELECT 1 FROM public.roster_members
    WHERE team_id = NEW.team_id AND player_id = NEW.player_id
  ) THEN
    RAISE EXCEPTION 'team_players (% / %) requires a matching roster_members row before activation. Insert into roster_members first.', NEW.team_id, NEW.player_id;
  END IF;

  -- Jersey alignment: must match roster_members.jersey_number::text when both have a value
  IF NEW.jersey_number IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.roster_members rm
    WHERE rm.team_id = NEW.team_id AND rm.player_id = NEW.player_id
      AND rm.jersey_number IS NOT NULL
      AND rm.jersey_number::text IS DISTINCT FROM NEW.jersey_number
  ) THEN
    RAISE EXCEPTION 'team_players.jersey_number (%) does not match roster_members.jersey_number for (% / %). Update both or pick one as truth.', NEW.jersey_number, NEW.team_id, NEW.player_id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS team_players_alignment_check ON public.team_players;
CREATE TRIGGER team_players_alignment_check
  BEFORE INSERT OR UPDATE ON public.team_players
  FOR EACH ROW EXECUTE FUNCTION public.tg_team_players_alignment_check();

-- 4. Verification
DO $$
DECLARE
  view_row_count int;
  trigger_count int;
BEGIN
  -- View returns rows for current production data
  SELECT COUNT(*) INTO view_row_count FROM public.parent_context_v;
  IF view_row_count = 0 THEN
    RAISE EXCEPTION 'parent_context_v returned 0 rows; expected guardians-with-active-team-players';
  END IF;

  -- Alignment trigger exists
  SELECT COUNT(*) INTO trigger_count FROM pg_trigger
    WHERE tgname = 'team_players_alignment_check' AND NOT tgisinternal;
  IF trigger_count <> 1 THEN
    RAISE EXCEPTION 'alignment trigger missing';
  END IF;

  -- Comments exist
  IF (SELECT obj_description('public.team_players'::regclass)) NOT LIKE 'CANONICAL%' THEN
    RAISE EXCEPTION 'team_players canonical comment missing';
  END IF;
END $$;
