-- AAU hub Screen 01 — self-serve paste-to-track substrate.
-- (1) A dedicated public-listed directory org that hosts parent-submitted tournaments.
--     Empty (no teams) so the assert_division_game_external trigger keeps every scraped
--     game external → tournaments ingest in full. Keeps public submissions out of the
--     pilot tenant's data. Fixed UUID so the edge function references it as a constant.
-- (2) aau_ingest_submissions — the submit edge function's job log + dedup source.
-- (3) get_aau_ingest_status — anon-readable poll RPC for the paste flow.
--
-- Mirror of the prod-applied migration (AP #21 — version string matches production).

-- ── (1) directory org ──────────────────────────────────────────────────────────
INSERT INTO public.organizations (id, name, slug, sport, display_name, public_listing_enabled)
VALUES ('a51e2a00-aa17-4d12-9e00-000000000001', 'AAU Tournaments', 'aster-aau-directory',
        'basketball', 'AAU Tournaments', true)
ON CONFLICT (id) DO UPDATE SET public_listing_enabled = true;

-- ── (2) submissions log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aau_ingest_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tournament text NOT NULL,
  source_url    text,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','ok','error','duplicate')),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aau_ingest_submissions_id_created
  ON public.aau_ingest_submissions (id_tournament, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aau_ingest_submissions_created
  ON public.aau_ingest_submissions (created_at DESC);

-- RLS on; NO anon/authenticated policies. Service role (edge function) bypasses RLS;
-- reads for the UI go exclusively through the SECDEF status RPC below.
ALTER TABLE public.aau_ingest_submissions ENABLE ROW LEVEL SECURITY;

-- ── (3) status poll RPC ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_aau_ingest_status(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'status',          s.status,
    'tournamentId',    s.tournament_id,
    'tournamentName',  t.name,
    'divisionCount',   COALESCE((SELECT count(*) FROM public.tournament_divisions d
                                 WHERE d.tournament_id = s.tournament_id), 0),
    'error',           CASE WHEN s.status = 'error' THEN 'ingest failed' ELSE NULL END
  )
  FROM public.aau_ingest_submissions s
  LEFT JOIN public.tournaments t ON t.id = s.tournament_id
  WHERE s.id = p_id;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_aau_ingest_status(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_aau_ingest_status(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_aau_ingest_status(uuid) TO anon, authenticated;
