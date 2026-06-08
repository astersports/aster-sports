// Wave 4.2-A-4 — tournament_recap resolver pair.
//
// Two-stage contract:
//   resolveTournamentRecap({ tournamentId, pilotOnly }, options)
//     -> { context, slices }
//   composeTournamentRecap(context, slice, overrides)
//     -> { subject, content_sections }
//
// Per-team recap of a completed tournament. Walks the calendar from
// tournament_id, joins game_results to events, and builds the FULL-DEPTH
// framed render (2026-06-05): cobalt_band header(+record pill) →
// placement → framed recap_game_cell "The Run" → bracket path taken →
// final pool standings → sideline narrative → signoff. Section assembly
// lives in tournamentRecapHelpers.buildRecapSections. Mirrors the sibling
// recaps (games_recap/game_recap) + tournament_prelim bracket/standings;
// shared helpers imported. (Retired: the flat game_log list + POG names.)
//
// Hallucination guard (AP #27 — no fabrication):
//   - tournament_teams empty -> slices = [].
//   - tournament_teams.final_place null -> placement_block omitted.
//   - wins+losses both 0 with final_place set -> placement renders
//     without record field.
//   - per-game: unpublished game_result -> cell omitted (not faked).
//   - no published pool games -> "The Run" bar + cells omitted.
//   - no played bracket games -> bracket path omitted (pool-only).
//   - empty standings_paste -> pool_standings omitted.
//   - Override sections render iff override present.
//   - Override beats data (consistent with 4.2-A-3).

import { buildOrgContext } from '../buildOrgContext';
import { fetchSignatureCoaches } from './signatureCoaches';
import { buildTeamSlices, fetchRecipientGuardians } from './tournamentPrelimHelpers';
import { buildRecapSections, buildSubject } from './tournamentRecapHelpers';


export async function resolveTournamentRecap({ tournamentId, pilotOnly }, { supabase, now = new Date() } = {}) {
  if (!tournamentId) throw new Error('Missing tournamentId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  void now;

  const { data: tournament, error: tErr } = await supabase.from('tournaments').select('id, name, circuit, start_date, end_date, primary_venue, primary_venue_address, tourney_url, hotel_url, survival_notes, coach_theme, pool_label, schedule_status, status').eq('id', tournamentId).maybeSingle();
  if (tErr) throw tErr;
  if (!tournament) throw new Error(`Tournament ${tournamentId} not found`);

  // Beta B6 audit — anti-pattern #36.
  const { data: ttData, error: ttErr } = await supabase.from('tournament_teams').select('id, tournament_id, team_id, final_record_wins, final_record_losses, final_place, teams ( id, name, team_color, sort_order, org_id )').eq('tournament_id', tournamentId);
  if (ttErr) throw ttErr;
  const ttRows = ttData || [];
  const tournament_teams = ttRows.map((r) => ({
    team_id: r.team_id, team_name: r.teams?.name || 'Team',
    team_color: r.teams?.team_color || '#4a8fd4',
    sort_order: r.teams?.sort_order ?? 0,
    final_place: r.final_place, wins: r.final_record_wins ?? 0, losses: r.final_record_losses ?? 0,
  }));
  const orgId = (ttRows[0]?.teams?.org_id) || null;

  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined && orgId) {
    const { data: settings, error: settingsErr } = await supabase.from('organization_settings').select('pilot_mode_enabled').eq('organization_id', orgId).maybeSingle();
    if (settingsErr) throw settingsErr;
    effectivePilotOnly = settings?.pilot_mode_enabled ?? false;
  } else if (effectivePilotOnly === undefined) effectivePilotOnly = false;

  const teamIds = tournament_teams.map((t) => t.team_id);
  // Beta B6 audit — anti-pattern #36.
  const { data: eventsData, error: eventsErr } = await supabase.from('events').select('id, team_id, event_type, start_at, end_at, location, sub_location, location_id, opponent, tournament_id, is_bracket_placeholder, bracket_label, is_championship_final, status').eq('tournament_id', tournamentId);
  if (eventsErr) throw eventsErr;
  const events = eventsData || [];
  const events_by_team = {};
  for (const tid of teamIds) events_by_team[tid] = [];
  for (const ev of events.slice().sort((a, b) => new Date(a.start_at) - new Date(b.start_at))) {
    if (events_by_team[ev.team_id]) events_by_team[ev.team_id].push(ev);
  }

  const eventIds = events.map((e) => e.id);
  const game_results_by_event = {};
  if (eventIds.length) {
    const { data: grData, error: grErr } = await supabase.from('game_results').select('event_id, our_score, opponent_score, result, quarter_scores, player_of_game_id, coach_highlight, published_at').in('event_id', eventIds);
    if (grErr) throw grErr;
    for (const r of grData || []) game_results_by_event[r.event_id] = r;
  }

  const playerIds = [...new Set(Object.values(game_results_by_event).map((r) => r.player_of_game_id).filter(Boolean))];
  const players_by_id = {};
  if (playerIds.length) {
    const { data: pData, error: pErr } = await supabase.from('players').select('id, first_name').in('id', playerIds);
    if (pErr) throw pErr;
    for (const p of pData || []) players_by_id[p.id] = p;
  }

  const locationIds = [...new Set(events.map((e) => e.location_id).filter(Boolean))];
  const locations = {};
  if (locationIds.length) {
    const { data: locData, error: locErr } = await supabase.from('locations').select('id, name, address, google_maps_url').in('id', locationIds);
    if (locErr) throw locErr;
    for (const l of locData || []) locations[l.id] = l;
  }

  let coaches = [];
  if (orgId) {
    const { data: coachesData, error: coachesErr } = await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null);
    if (coachesErr) throw coachesErr;
    coaches = coachesData || [];
  }
  const { data: org, error: orgErr } = orgId ? await supabase.from('organizations').select('id, name, display_name, brand_colors, voice_config, mailing_address').eq('id', orgId).maybeSingle() : { data: null, error: null };
  if (orgErr) throw orgErr;
  const allRecipients = orgId ? await fetchRecipientGuardians(supabase, orgId, teamIds, effectivePilotOnly) : [];
  const slices = buildTeamSlices(tournament_teams, allRecipients);

  // tournament_recap is per-team (one slice per team), so the voice signature
  // is per-team: each team signs with the org Program Director + ITS OWN
  // team_staff coaches. Resolve a team_id → coaches map; the per-slice
  // compose (buildRecapSections) reads its slice.team_id entry.
  const signature_coaches_by_team = {};
  if (orgId) {
    for (const tid of teamIds) {
      signature_coaches_by_team[tid] = await fetchSignatureCoaches(supabase, orgId, tid);
    }
  }

  return {
    context: {
      org: buildOrgContext({ orgId, org, coaches }),
      signature_coaches_by_team,
      tournament, tournament_teams, events_by_team, game_results_by_event, players_by_id, locations,
    },
    slices,
  };
}

// Full-depth framed shell (2026-06-05) — matches the sibling recaps
// (games_recap/game_recap) plus the tournament_prelim bracket + standings
// sections. The section-assembly lives in buildRecapSections (helpers,
// keeps this file under the 150-line cap). Pure: same context+slice+
// overrides -> deeply-equal output (AP #27).
export function composeTournamentRecap(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  return {
    subject: buildSubject(slice, context.tournament),
    content_sections: buildRecapSections(context, slice, overrides),
  };
}
