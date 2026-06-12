-- P0 lane STEP 1 (SD-10 ruling, operator GO 2026-06-12): anon grant lockdown.
-- DB-4: anon held INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on all 12
-- schedule-domain tables (fail-closed only by RLS) plus full-column SELECT on
-- 10 of them, including teams.team_feed_token (the calendar-subscribe bearer
-- secret) and locations.admin_notes. This MUST land before the STEP 2 org-gate
-- RLS repair: fixing the gate first would make feed-token enumeration live.
-- PUBLIC revoked first per AP #23 (PUBLIC grants cascade); explicit per-role
-- revokes per AP #57. authenticated/service_role hold their own direct grants
-- (verified via role_table_grants) and are untouched.

-- 1a. Write-class privileges: anon loses all of them on the 12 tables.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON
  public.events, public.teams, public.locations, public.event_rsvps,
  public.player_activations, public.game_results, public.roster_members,
  public.event_ride_offers, public.event_ride_claims, public.event_ride_requests,
  public.event_duties, public.user_preferences
FROM PUBLIC;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON
  public.events, public.teams, public.locations, public.event_rsvps,
  public.player_activations, public.game_results, public.roster_members,
  public.event_ride_offers, public.event_ride_claims, public.event_ride_requests,
  public.event_duties, public.user_preferences
FROM anon;

-- 1b. SELECT lockdown on the 8 tables with NO anon-facing policy (verified in
-- pg_policies): the grant was pure latent surface; nothing anon-side reads them.
REVOKE SELECT ON
  public.event_rsvps, public.player_activations, public.roster_members,
  public.event_ride_offers, public.event_ride_claims, public.event_ride_requests,
  public.event_duties, public.user_preferences
FROM PUBLIC;

REVOKE SELECT ON
  public.event_rsvps, public.player_activations, public.roster_members,
  public.event_ride_offers, public.event_ride_claims, public.event_ride_requests,
  public.event_duties, public.user_preferences
FROM anon;

-- 1c. teams: column-narrow anon SELECT to the public-render set. Drops
-- team_feed_token / team_feed_token_issued_at (now served per-team via the
-- gated SECDEF get_public_subscribe_info(), STEP 2), jersey/alias/admin fields,
-- and timestamps.
REVOKE SELECT ON public.teams FROM PUBLIC;
REVOKE SELECT ON public.teams FROM anon;
GRANT SELECT (id, org_id, season_id, name, age_group, division, circuit,
  circuit_name, gender, sort_order, team_color, practice_day, practice_location)
ON public.teams TO anon;

-- 1d. locations: column-narrow anon SELECT to the public/family-facing set.
-- Drops admin_notes, notes, archived_at, sub_locations, the dead
-- latitude/longitude pair (DB-10), and timestamps.
REVOKE SELECT ON public.locations FROM PUBLIC;
REVOKE SELECT ON public.locations FROM anon;
GRANT SELECT (id, org_id, name, address, lat, lon, google_maps_url,
  parking_notes, entry_instructions)
ON public.locations TO anon;
