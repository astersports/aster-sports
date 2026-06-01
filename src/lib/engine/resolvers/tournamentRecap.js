// Wave 4.2-A-4 — tournament_recap resolver pair.
//
// Two-stage contract:
//   resolveTournamentRecap({ tournamentId, pilotOnly }, options)
//     -> { context, slices }
//   composeTournamentRecap(context, slice, overrides)
//     -> { subject, content_sections }
//
// Per-team recap of a completed tournament. Walks the calendar from
// tournament_id, joins game_results to events, looks up POG names,
// and builds final placement + game_log per team. Mirrors 4.2-A-3
// (same anchor + slice shape); shared helpers imported.
//
// Hallucination guard:
//   - tournament_teams empty -> slices = [].
//   - tournament_teams.final_place null -> placement_block omitted.
//   - wins+losses both 0 with final_place set -> placement renders
//     without record field.
//   - per-game: published_at null -> row renders "Result not published".
//   - per-game: null POG -> row's player_of_game key omitted.
//   - per-game: empty coach_highlight -> row's coach_highlight omitted.
//   - Empty events_by_team[team] -> "No games played" structure.
//   - Override sections render iff override present.
//   - Override beats data (consistent with 4.2-A-3).

import { ORG_CONTACT_DEFAULT, ORG_LOGO_DEFAULT, ORG_NAME_DEFAULT, ORG_WEBSITE_DEFAULT } from '../../constants';
import {
  buildSubContext, buildTeamSlices, fetchRecipientGuardians, trim,
} from './tournamentPrelimHelpers';
import {
  buildGameLogSection, buildPlacementBlock, buildSubject,
} from './tournamentRecapHelpers';


export async function resolveTournamentRecap({ tournamentId, pilotOnly }, { supabase, now = new Date() } = {}) {
  if (!tournamentId) throw new Error('Missing tournamentId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  void now;

  const { data: tournament, error: tErr } = await supabase.from('tournaments').select('id, name, circuit, start_date, end_date, primary_venue, primary_venue_address, tourney_url, hotel_url, survival_notes, coach_theme, schedule_status, status').eq('id', tournamentId).maybeSingle();
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
  const { data: eventsData, error: eventsErr } = await supabase.from('events').select('id, team_id, event_type, start_at, end_at, location, sub_location, location_id, opponent, tournament_id, is_bracket_placeholder, status').eq('tournament_id', tournamentId);
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
  const { data: org, error: orgErr } = orgId ? await supabase.from('organizations').select('id, name, brand_colors, voice_config').eq('id', orgId).maybeSingle() : { data: null, error: null };
  if (orgErr) throw orgErr;
  const allRecipients = orgId ? await fetchRecipientGuardians(supabase, orgId, teamIds, effectivePilotOnly) : [];
  const slices = buildTeamSlices(tournament_teams, allRecipients);

  return {
    context: {
      org: {
        id: orgId, name: ORG_NAME_DEFAULT,
        branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
        voice_config: org?.voice_config || null, brand_colors: org?.brand_colors || null,
        coaches: coaches || [],
      },
      tournament, tournament_teams, events_by_team, game_results_by_event, players_by_id, locations,
    },
    slices,
  };
}

export function composeTournamentRecap(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { tournament, tournament_teams, events_by_team, locations, players_by_id, game_results_by_event, org } = context;
  const tt = tournament_teams.find((t) => t.team_id === slice.team_id);
  const sections = [];
  sections.push({ kind: 'header', eyebrow: `${slice.team_name.toUpperCase()} · TOURNAMENT RECAP`, eyebrow_link: org.branding.eyebrowLink, headline: 'TOURNAMENT RECAP', sub_context: buildSubContext(tournament), goldStripe: true, team_color: slice.team_color });
  const placement = buildPlacementBlock(tt, slice.team_color);
  if (placement) sections.push(placement);
  sections.push(buildGameLogSection(events_by_team[slice.team_id] || [], game_results_by_event, locations, players_by_id, slice.team_color));
  if (trim(overrides.standout_moments)) sections.push({ kind: 'standout_moments', text: trim(overrides.standout_moments) });
  if (trim(overrides.coach_reflection)) sections.push({ kind: 'coach_reflection', text: trim(overrides.coach_reflection) });
  for (const key of ['coach_note', 'parent_shoutout']) {
    const v = trim(overrides[key]);
    if (v) sections.push({ kind: 'stats_narrative', body: v });
  }
  const validCoaches = (org.coaches || []).filter((c) => c.display_name && c.phone).map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  const signoffProse = trim(overrides.signoff_message);
  if (signoffProse || validCoaches.length) sections.push({ kind: 'signoff', prose: signoffProse, coaches: validCoaches });
  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail });
  return { subject: buildSubject(slice, tournament), content_sections: sections };
}
