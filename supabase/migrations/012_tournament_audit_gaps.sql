-- ============================================================
-- 012_tournament_audit_gaps.sql
--
-- Retrospective: captures FK on events.tournament_id (Gap 7 from pre-2A
-- audit) and locations table extensions (archived_at, notes) from Cleanup A-1.
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- Events FK to tournaments (pre-2A Gap 7)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_tournament_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_tournament_id_fkey
  FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_tournament_id
  ON public.events (tournament_id)
  WHERE tournament_id IS NOT NULL;

-- Locations extensions (Cleanup A-1)
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_locations_archived_at
  ON public.locations (archived_at)
  WHERE archived_at IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
