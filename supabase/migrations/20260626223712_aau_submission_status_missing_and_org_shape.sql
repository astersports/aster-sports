-- AAU Screen 01 follow-up (PR #1110 review):
-- (1) Re-assert the directory org with ALL intended fields on conflict, so the fixed-id
--     org is consistently shaped across envs (not just public_listing_enabled).
-- (2) get_aau_ingest_status returns a deterministic {status:'missing'} payload for an
--     unknown id, so the anon poller can distinguish "still pending" from "bad id".
--
-- Mirror of the prod-applied migration (AP #21 — version string matches production).

INSERT INTO public.organizations (id, name, slug, sport, display_name, public_listing_enabled)
VALUES ('a51e2a00-aa17-4d12-9e00-000000000001', 'AAU Tournaments', 'aster-aau-directory',
        'basketball', 'AAU Tournaments', true)
ON CONFLICT (id) DO UPDATE SET
  name                   = EXCLUDED.name,
  slug                   = EXCLUDED.slug,
  sport                  = EXCLUDED.sport,
  display_name           = EXCLUDED.display_name,
  public_listing_enabled = EXCLUDED.public_listing_enabled;

CREATE OR REPLACE FUNCTION public.get_aau_ingest_status(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
       'status',         s.status,
       'tournamentId',   s.tournament_id,
       'tournamentName', t.name,
       'divisionCount',  COALESCE((SELECT count(*) FROM public.tournament_divisions d
                                   WHERE d.tournament_id = s.tournament_id), 0),
       'error',          CASE WHEN s.status = 'error' THEN 'ingest failed' ELSE NULL END
     )
     FROM public.aau_ingest_submissions s
     LEFT JOIN public.tournaments t ON t.id = s.tournament_id
     WHERE s.id = p_id),
    jsonb_build_object('status','missing','tournamentId',NULL,'tournamentName',NULL,
                       'divisionCount',0,'error',NULL)
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.get_aau_ingest_status(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_aau_ingest_status(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_aau_ingest_status(uuid) TO anon, authenticated;
