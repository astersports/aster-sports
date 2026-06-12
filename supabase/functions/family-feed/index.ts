// family-feed edge function (SD-16 phase 1, SCHEDULE_L99_BUILD_SPEC §2
// PR-F' + ratification §5).
//
// Guardian-scoped ICS calendar feed: ONE subscription carrying every
// event for every team the guardian's kids are on — the Skylight /
// fridge-calendar rail. Token identified, anonymous access — the token
// IS the auth (bearer secret), minted ONLY via the authed
// get_or_create_family_feed_token() RPC (never anon-readable, never
// derivable from a team id).
//
// URL shape: /functions/v1/family-feed?token=<opaque>
// Returns: 200 text/calendar, 404 unknown token, 400 missing token.
//
// ICS generation lives in ./_helpers.ts — a Deno mirror of
// src/lib/icsCore.js per CLAUDE.md anti-pattern #30 (registered in
// edgeFunctionMirrorAudit alongside team-feed's copy). Event UIDs keep
// the shared `<event_id>@ember` key, so a calendar app holding BOTH a
// team feed and the family feed dedups instead of double-booking.
//
// Per CLAUDE.md anti-pattern #31 (+ the P0-lane D7 corollary):
// verify_jwt=false is declared in supabase/config.toml AND passed
// explicitly on every MCP deploy — the deploy default is true and
// silently overrides config.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateTeamIcs } from './_helpers.ts';

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: guardian, error: gErr } = await supabase
    .from('guardians')
    .select('id, last_name')
    .eq('feed_token', token)
    .maybeSingle();
  if (gErr) {
    console.error('family-feed guardian:', gErr.message);
    return new Response('Lookup error', { status: 500 });
  }
  if (!guardian) {
    return new Response('Not found', { status: 404 });
  }
  const { data: links, error: pgErr } = await supabase
    .from('player_guardians')
    .select('player_id')
    .eq('guardian_id', guardian.id);
  if (pgErr) {
    console.error('family-feed players:', pgErr.message);
    return new Response('Players error', { status: 500 });
  }
  const playerIds = (links || []).map((l) => l.player_id);
  if (playerIds.length === 0) {
    return icsResponse(generateTeamIcs(`${guardian.last_name} Family`, []));
  }
  const { data: memberships, error: tpErr } = await supabase
    .from('team_players')
    .select('team_id')
    .in('player_id', playerIds)
    .eq('status', 'active');
  if (tpErr) {
    console.error('family-feed teams:', tpErr.message);
    return new Response('Teams error', { status: 500 });
  }
  const teamIds = [...new Set((memberships || []).map((m) => m.team_id))];
  if (teamIds.length === 0) {
    return icsResponse(generateTeamIcs(`${guardian.last_name} Family`, []));
  }
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  // location_name is a SELECT alias of the real `location` column (same
  // contract as team-feed; the events table has no location_name column).
  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('id, title, event_type, start_at, end_at, location_name:location, opponent, updated_at, created_at')
    .in('team_id', teamIds)
    .neq('status', 'cancelled')
    .gte('start_at', twoYearsAgo.toISOString())
    .order('start_at', { ascending: true })
    .limit(500);
  if (eventsErr) {
    console.error('family-feed events:', eventsErr.message);
    return new Response('Events error', { status: 500 });
  }
  const ics = generateTeamIcs(`${guardian.last_name} Family`, events || []);
  return icsResponse(ics);
});

function icsResponse(ics: string): Response {
  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
