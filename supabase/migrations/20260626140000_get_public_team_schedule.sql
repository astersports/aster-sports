-- AAU hub build spec §5 — get_public_team_schedule  (D5 · D6 · D7)
-- ONE org-gated public read shared by the AAU hub, the Legacy Hoopers site, and
-- the app: live + upcoming events (game | tournament | practice) with the score
-- (published only) and the location for Apple/Google map deep-links. Companion
-- to get_public_team_records (20260625120000_aau_ingest_phase1.sql).
--
-- Privacy boundary = the display-column projection below. NEVER selected:
-- coach_notes / notes / coach_checklist / locked_roster / academy_callup /
-- rsvp; location admin_notes / entry_instructions / parking_notes; no PII.
-- D6 (operator-ratified 2026-06-26): practices ARE public — already published
-- on the team/league sites, so surfacing them here is not a new exposure.
-- Gate = publish_status='published' AND org_is_public_listed(org). Score is
-- gated on game_results.published_at (same contract as get_public_team_records).

create or replace function public.get_public_team_schedule(p_team_id uuid)
returns table(
  event_id uuid,
  kind text,                      -- events.event_type: game | tournament | practice
  title text,
  start_at timestamptz,
  end_at timestamptz,
  status text,                    -- scheduled | cancelled
  opponent text,
  home_away text,
  tournament_name text,
  our_score integer,              -- published game_results only; null otherwise
  opponent_score integer,
  result text,
  location_name text,
  location_address text,
  location_lat double precision,
  location_lon double precision,
  location_maps_url text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    e.id,
    e.event_type,
    e.title,
    e.start_at,
    e.end_at,
    e.status,
    e.opponent,
    e.home_away,
    e.tournament_name,
    gr.our_score,
    gr.opponent_score,
    gr.result,
    coalesce(l.name, e.location),
    coalesce(l.address, e.location_address),
    coalesce(l.lat, l.latitude::double precision),
    coalesce(l.lon, l.longitude::double precision),
    l.google_maps_url
  from public.events e
  join public.teams t on t.id = e.team_id
  left join public.locations l on l.id = e.location_id
  left join public.game_results gr
         on gr.event_id = e.id and gr.published_at is not null
  where e.team_id = p_team_id
    and e.publish_status = 'published'
    and e.start_at >= (now() - interval '6 hours')   -- include in-progress / just-finished as "live"
    and public.org_is_public_listed(t.org_id)
  order by e.start_at asc;
$function$;

-- Deliberately public read (the portals). REVOKE PUBLIC + anon first to clear
-- the Supabase default-privilege grant (AP #23/#57), then GRANT explicitly.
revoke execute on function public.get_public_team_schedule(uuid) from public;
revoke execute on function public.get_public_team_schedule(uuid) from anon;
grant execute on function public.get_public_team_schedule(uuid) to anon, authenticated;
