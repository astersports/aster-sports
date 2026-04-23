-- ============================================================
-- 018_team_achievements.sql
--
-- NEW TABLE: team_achievements. Tracks team-level badges earned
-- via tournaments or regular-season play. Powers team detail,
-- tournament detail, parent home cards, and the admin pending-
-- review queue.
--
-- Design targets 95% satisfaction per role:
--   PARENT:  shareable moment with opponent + location + photo
--   COACH:   20-second sideline capture via is_pending_confirmation
--   ADMIN:   pending queue + audit trail (confirmed_at/by)
--
-- Supported achievement types:
--   - champions, nationals_qualified, finalists, semifinalists,
--     undefeated_season, custom (requires custom_title)
--
-- Achievement sources:
--   - Tournament-earned:  tournament_id + season_id populated
--   - Season-earned:      tournament_id NULL, season_id populated
--   - Ad-hoc/custom:      either can be NULL
--
-- No uniqueness constraint: a team can legitimately earn the same
-- type multiple times in a season (multiple tournament champions).
--
-- Player-level awards (MVP, All-Tournament) deferred to separate
-- player_awards table (Phase 2+). Game-level highlights already
-- covered by game_results.player_of_game_id + coach_highlight from
-- Migration 014.
--
-- RLS (defense-in-depth for data trust):
--   - Parents: SELECT only rows where is_pending_confirmation=false
--     AND archived_at IS NULL AND org scoped
--   - Coaches: INSERT only with is_pending_confirmation=true (cannot
--     publish directly); SELECT all org rows; UPDATE/DELETE blocked
--   - Admins: full access (INSERT, UPDATE, DELETE, confirm pending)
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Create team_achievements table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL,
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,

  achievement_type text NOT NULL,
  custom_title text,
  description text,

  -- Context for shareable moments
  rank integer,
  opponent_team_name text,
  event_location text,

  -- Visual customization
  badge_emoji text,
  badge_color text,
  photo_url text,

  -- Pending/confirmation workflow
  is_pending_confirmation boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Dates
  earned_at timestamptz NOT NULL,
  archived_at timestamptz,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.team_achievements IS
  'Team-level badges earned via tournaments or regular-season play. Displayed on team detail, tournament detail, and parent home pages. Coaches create with is_pending_confirmation=true; admins confirm/edit/reject via confirmed_at/confirmed_by audit trail. Soft-deleted via archived_at.';

COMMENT ON COLUMN public.team_achievements.achievement_type IS
  'Enum: champions, nationals_qualified, finalists, semifinalists, undefeated_season, custom. For custom, custom_title is required.';

COMMENT ON COLUMN public.team_achievements.custom_title IS
  'Required when achievement_type=custom. Null for all other types (title derives from type + tournament/season context).';

COMMENT ON COLUMN public.team_achievements.tournament_id IS
  'Nullable FK. Set for tournament-earned achievements. NULL for season-level (undefeated_season) or ad-hoc achievements.';

COMMENT ON COLUMN public.team_achievements.season_id IS
  'Nullable FK. Set when achievement ties to a specific season. Null only for unscoped custom achievements.';

COMMENT ON COLUMN public.team_achievements.rank IS
  'Final position (1=champions, 2=finalists, 4=semifinalists, etc.). Optional but powers parent-facing context ("finished 2nd"). Range 1-100 enforced by CHECK.';

COMMENT ON COLUMN public.team_achievements.opponent_team_name IS
  'Opposing team name for context (e.g., "NY Blaze" → "Lost to NY Blaze in the final"). Free text since opponents cross orgs and may not exist as records locally.';

COMMENT ON COLUMN public.team_achievements.event_location IS
  'Human-readable location (e.g., "Massachusetts", "Bergen County NJ", "Westchester County Center"). Powers "Nationals Qualified · MA" style rendering.';

COMMENT ON COLUMN public.team_achievements.photo_url IS
  'Trophy photo, team photo, or podium shot. Supabase Storage URL. Primary emotional artifact for parent share moments. Null = no photo yet (admin can add later).';

COMMENT ON COLUMN public.team_achievements.is_pending_confirmation IS
  'true = coach-submitted, not yet visible to parents. false = confirmed/admin-created, visible. Parents filter WHERE is_pending_confirmation=false in RLS.';

COMMENT ON COLUMN public.team_achievements.confirmed_at IS
  'Timestamp when admin confirmed the pending submission. Null = never pending (admin created directly) OR still pending. Paired with confirmed_by for audit.';

COMMENT ON COLUMN public.team_achievements.confirmed_by IS
  'Admin user who confirmed the pending submission. Null matches confirmed_at null state.';

COMMENT ON COLUMN public.team_achievements.earned_at IS
  'Date the achievement was earned (tournament final date, season close, etc.). Distinct from created_at which is record-insert time.';

COMMENT ON COLUMN public.team_achievements.archived_at IS
  'Soft-delete marker. App filters WHERE archived_at IS NULL by default. Admins archive mistakes via UI rather than hard DELETE, preserving audit.';

-- ============================================================
-- 2. CHECK constraints
-- ============================================================

-- achievement_type enum
ALTER TABLE public.team_achievements
  DROP CONSTRAINT IF EXISTS team_achievements_type_enum;
ALTER TABLE public.team_achievements
  ADD CONSTRAINT team_achievements_type_enum
  CHECK (achievement_type IN ('champions', 'nationals_qualified', 'finalists', 'semifinalists', 'undefeated_season', 'custom'));

-- custom_title required when type=custom
ALTER TABLE public.team_achievements
  DROP CONSTRAINT IF EXISTS team_achievements_custom_title_required;
ALTER TABLE public.team_achievements
  ADD CONSTRAINT team_achievements_custom_title_required
  CHECK (
    (achievement_type = 'custom' AND custom_title IS NOT NULL)
    OR achievement_type != 'custom'
  );

-- rank must be sane (1-100) when present
ALTER TABLE public.team_achievements
  DROP CONSTRAINT IF EXISTS team_achievements_rank_range;
ALTER TABLE public.team_achievements
  ADD CONSTRAINT team_achievements_rank_range
  CHECK (rank IS NULL OR (rank >= 1 AND rank <= 100));

-- confirmed_at and confirmed_by stay in sync (both set or both null)
ALTER TABLE public.team_achievements
  DROP CONSTRAINT IF EXISTS team_achievements_confirmed_pair;
ALTER TABLE public.team_achievements
  ADD CONSTRAINT team_achievements_confirmed_pair
  CHECK (
    (confirmed_at IS NULL AND confirmed_by IS NULL)
    OR (confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL)
  );

-- ============================================================
-- 3. Indexes
-- ============================================================

-- team_id (every team detail page fetch)
CREATE INDEX IF NOT EXISTS idx_team_achievements_team_id
  ON public.team_achievements (team_id, earned_at DESC)
  WHERE archived_at IS NULL;

-- tournament_id (tournament detail fetches)
CREATE INDEX IF NOT EXISTS idx_team_achievements_tournament_id
  ON public.team_achievements (tournament_id)
  WHERE tournament_id IS NOT NULL AND archived_at IS NULL;

-- season_id (season recaps)
CREATE INDEX IF NOT EXISTS idx_team_achievements_season_id
  ON public.team_achievements (season_id)
  WHERE season_id IS NOT NULL AND archived_at IS NULL;

-- (org_id, season_id, achievement_type) composite for admin season-filtered queries
CREATE INDEX IF NOT EXISTS idx_team_achievements_org_season_type
  ON public.team_achievements (org_id, season_id, achievement_type)
  WHERE archived_at IS NULL;

-- Pending confirmation queue (admin approval list, hot path)
CREATE INDEX IF NOT EXISTS idx_team_achievements_pending_queue
  ON public.team_achievements (org_id, created_at DESC)
  WHERE is_pending_confirmation = true AND archived_at IS NULL;

-- ============================================================
-- 4. updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.team_achievements_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_team_achievements_updated_at ON public.team_achievements;

CREATE TRIGGER trg_team_achievements_updated_at
  BEFORE UPDATE ON public.team_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.team_achievements_set_updated_at();

-- ============================================================
-- 5. RLS (parent/coach/admin split, defense-in-depth)
-- ============================================================
ALTER TABLE public.team_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_achievements_select_parent" ON public.team_achievements;
DROP POLICY IF EXISTS "team_achievements_select_staff" ON public.team_achievements;
DROP POLICY IF EXISTS "team_achievements_insert_coach" ON public.team_achievements;
DROP POLICY IF EXISTS "team_achievements_write_admin" ON public.team_achievements;
DROP POLICY IF EXISTS "team_achievements_select_org_members" ON public.team_achievements;
DROP POLICY IF EXISTS "team_achievements_write_staff" ON public.team_achievements;

-- Parent SELECT: only confirmed, non-archived, in their org
CREATE POLICY "team_achievements_select_parent" ON public.team_achievements
  FOR SELECT
  TO authenticated
  USING (
    is_pending_confirmation = false
    AND archived_at IS NULL
    AND org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- Staff SELECT: all rows (including pending + archived) in their org
CREATE POLICY "team_achievements_select_staff" ON public.team_achievements
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'coach')
    )
  );

-- Coach INSERT: only pending (cannot publish directly)
CREATE POLICY "team_achievements_insert_coach" ON public.team_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
    AND is_pending_confirmation = true
    AND confirmed_at IS NULL
    AND confirmed_by IS NULL
  );

-- Admin full access (INSERT/UPDATE/DELETE any row)
CREATE POLICY "team_achievements_write_admin" ON public.team_achievements
  FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 6. Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
