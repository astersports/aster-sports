// team-feed edge function.
//
// V-23 iCal subscription URL handler. Renders an ICS calendar feed
// for a given team identified by an opaque team_feed_token (stored
// on the teams table per migration 20260520093701). Anonymous
// access — the token IS the auth (treat as bearer secret).
//
// URL shape: /functions/v1/team-feed?token=<uuid>
// Returns: 200 text/calendar with the team's published events ICS,
//          404 if token doesn't resolve, 400 if token is missing.
//
// ICS generation lives in ./_helpers.ts — the Deno mirror of
// src/lib/icsCore.js per CLAUDE.md anti-pattern #30. When changing
// one, change both in the same commit (mirror audit enforces).
//
// Per CLAUDE.md anti-pattern #31: verify_jwt=false matches the
// existing token-handler functions (rsvp-token-handler,
// callup-token-handler, unsubscribe-handler) — custom auth via
// URL-param token, not JWT.

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
  const { data: teamRows, error: teamErr } = await supabase.rpc('get_team_by_feed_token', { p_token: token });
  if (teamErr) {
    console.error('team-feed lookup:', teamErr.message);
    return new Response('Lookup error', { status: 500 });
  }
  const team = teamRows && teamRows.length > 0 ? teamRows[0] : null;
  if (!team) {
    return new Response('Not found', { status: 404 });
  }
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  // location_name is a SELECT alias of the real `location` column — the
  // events table has no location_name column (P0 lane STEP 4 fix,
  // 2026-06-12; the prior select 42703'd and every feed request 500'd).
  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('id, title, event_type, start_at, end_at, location_name:location, opponent, updated_at, created_at')
    .eq('team_id', team.id)
    .neq('status', 'cancelled')
    .gte('start_at', twoYearsAgo.toISOString())
    .order('start_at', { ascending: true })
    .limit(500);
  if (eventsErr) {
    console.error('team-feed events:', eventsErr.message);
    return new Response('Events error', { status: 500 });
  }
  const ics = generateTeamIcs(team.name, events || []);
  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
});
