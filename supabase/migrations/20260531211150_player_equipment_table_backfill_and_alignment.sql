-- Migration #8 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 8): player_equipment + backfill + alignment.
-- Per-player kit, scoped (player_id, season_id, sport_id) per spec line 226-227:
-- jersey_size, shorts_size, jersey_number, status. CASCADE from players per §4.4 (line 260).
--
-- §11.5 reconciliation (Frank GO 2026-05-31, "build + migrate + repoint now"): roster_members has
-- been the canonical sizes home; player_equipment becomes the new canonical home (multi-sport-ready).
-- This migration (a) creates the table, (b) backfills from roster_members→teams→programs (63 LH rows,
-- one sport=Basketball, 0 players on >1 team/season so the (player,season,sport) key is unique), and
-- (c) adds an alignment trigger so any future roster_members size/number write propagates to
-- player_equipment — mirroring the established roster_members↔team_players alignment-lock pattern
-- (migration 20260505201932), preventing the drift §11.5 warns about. The useRoster SIZE READ repoint
-- + §11.5 doctrine rewrite ship in the same PR (code half). Applied via Supabase MCP 2026-05-31
-- (version 20260531211150).

CREATE TYPE public.player_equipment_status AS ENUM ('needed','ordered','distributed');

CREATE TABLE public.player_equipment (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  player_id      uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season_id      uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,  -- programs is the seasons home post-#3
  sport_id       uuid REFERENCES public.sports(id) ON DELETE SET NULL,
  jersey_size    text,
  shorts_size    text,
  jersey_number  text,   -- text to match roster_members/team_players jersey_number typing
  status         public.player_equipment_status NOT NULL DEFAULT 'needed',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_equipment_player_season_sport_uniq UNIQUE (player_id, season_id, sport_id)
);

CREATE INDEX idx_player_equipment_player_id ON public.player_equipment(player_id);
CREATE INDEX idx_player_equipment_season_id ON public.player_equipment(season_id);
CREATE INDEX idx_player_equipment_org_id    ON public.player_equipment(org_id);

CREATE TRIGGER trg_player_equipment_updated_at BEFORE UPDATE ON public.player_equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.player_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY player_equipment_select ON public.player_equipment
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());
CREATE POLICY player_equipment_insert ON public.player_equipment
  FOR INSERT WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY player_equipment_update ON public.player_equipment
  FOR UPDATE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
            WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY player_equipment_delete ON public.player_equipment
  FOR DELETE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_equipment TO anon, authenticated, service_role;

-- (b) Backfill from roster_members → teams → programs(season).sport_id. One row per
-- (player, season, sport). jersey_number cast to text. status='distributed' where any kit data
-- exists (these are live rostered players with assigned kit), else 'needed'.
INSERT INTO public.player_equipment (org_id, player_id, season_id, sport_id, jersey_size, shorts_size, jersey_number, status)
SELECT DISTINCT ON (rm.player_id, t.season_id, p.sport_id)
  pl.org_id, rm.player_id, t.season_id, p.sport_id,
  rm.jersey_size, rm.shorts_size, rm.jersey_number::text,
  CASE WHEN rm.jersey_size IS NOT NULL OR rm.shorts_size IS NOT NULL OR rm.jersey_number IS NOT NULL
       THEN 'distributed'::public.player_equipment_status ELSE 'needed'::public.player_equipment_status END
FROM public.roster_members rm
JOIN public.teams t    ON t.id = rm.team_id
JOIN public.programs p ON p.id = t.season_id
JOIN public.players pl ON pl.id = rm.player_id
ORDER BY rm.player_id, t.season_id, p.sport_id, rm.registered_at DESC NULLS LAST
ON CONFLICT (player_id, season_id, sport_id) DO NOTHING;

-- (c) Alignment trigger: roster_members size/number writes propagate to player_equipment, keeping
-- the new canonical home in sync with the legacy membership table (which still owns left_at /
-- registered_at / historical windows per §11.5). SECURITY DEFINER so it writes regardless of the
-- writing role's player_equipment grants; pinned search_path per the RLS-helper hygiene rule.
CREATE OR REPLACE FUNCTION public.align_player_equipment_from_roster_member()
RETURNS trigger AS $$
DECLARE v_season_id uuid; v_sport_id uuid; v_org_id uuid;
BEGIN
  SELECT t.season_id, p.sport_id INTO v_season_id, v_sport_id
    FROM public.teams t JOIN public.programs p ON p.id = t.season_id
    WHERE t.id = NEW.team_id;
  IF v_season_id IS NULL THEN RETURN NEW; END IF;  -- team has no season → nothing to align
  SELECT org_id INTO v_org_id FROM public.players WHERE id = NEW.player_id;
  INSERT INTO public.player_equipment (org_id, player_id, season_id, sport_id, jersey_size, shorts_size, jersey_number, status)
  VALUES (v_org_id, NEW.player_id, v_season_id, v_sport_id, NEW.jersey_size, NEW.shorts_size, NEW.jersey_number::text,
          CASE WHEN NEW.jersey_size IS NOT NULL OR NEW.shorts_size IS NOT NULL OR NEW.jersey_number IS NOT NULL
               THEN 'distributed'::public.player_equipment_status ELSE 'needed'::public.player_equipment_status END)
  ON CONFLICT (player_id, season_id, sport_id) DO UPDATE
    SET jersey_size = EXCLUDED.jersey_size,
        shorts_size = EXCLUDED.shorts_size,
        jersey_number = EXCLUDED.jersey_number,
        updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function — not an RPC. Revoke EXECUTE from all client roles (AP #23/#57: PUBLIC, then
-- anon, then authenticated). The trigger still fires (it runs as the function owner regardless of
-- the writing role's grants); this only closes the get_advisors
-- authenticated_security_definer_function_executable surface. service_role retains EXECUTE.
REVOKE EXECUTE ON FUNCTION public.align_player_equipment_from_roster_member() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.align_player_equipment_from_roster_member() FROM anon;
REVOKE EXECUTE ON FUNCTION public.align_player_equipment_from_roster_member() FROM authenticated;

CREATE TRIGGER trg_align_player_equipment
  AFTER INSERT OR UPDATE OF jersey_size, shorts_size, jersey_number ON public.roster_members
  FOR EACH ROW EXECUTE FUNCTION public.align_player_equipment_from_roster_member();

-- Verify.
DO $$
DECLARE v_pe int; v_rm_distinct int;
BEGIN
  IF (SELECT relkind FROM pg_class WHERE oid='public.player_equipment'::regclass) <> 'r' THEN
    RAISE EXCEPTION 'verify failed: not a base table';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.player_equipment'::regclass) <> 4 THEN
    RAISE EXCEPTION 'verify failed: expected 4 RLS policies';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='player_equipment_player_id_fkey' AND confrelid='public.players'::regclass AND confdeltype='c') THEN
    RAISE EXCEPTION 'verify failed: player_id FK not CASCADE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='player_equipment_player_season_sport_uniq' AND contype='u') THEN
    RAISE EXCEPTION 'verify failed: missing (player,season,sport) unique';
  END IF;
  SELECT count(*) INTO v_pe FROM public.player_equipment;
  SELECT count(*) INTO v_rm_distinct FROM (
    SELECT DISTINCT rm.player_id, t.season_id, p.sport_id
    FROM public.roster_members rm JOIN public.teams t ON t.id=rm.team_id JOIN public.programs p ON p.id=t.season_id
  ) d;
  IF v_pe <> v_rm_distinct THEN
    RAISE EXCEPTION 'verify failed: backfill % rows != % distinct roster combos', v_pe, v_rm_distinct;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_align_player_equipment' AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'verify failed: alignment trigger missing';
  END IF;
  RAISE NOTICE 'player_equipment verified: table+RLS(4)+CASCADE+unique, backfilled % rows (= distinct roster combos), alignment trigger live.', v_pe;
END $$;
