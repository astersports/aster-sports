// Wave 4.2-A-3 — tournament_prelim resolver pair.
// Wave 5 (cutover wave PR 1, 2026-05-16) — compose() rewritten to
// align with Frank's hand-composed pattern per
// docs/CUTOVER_WAVE_GAP_AUDIT.md. Previously emitted an orphaned
// `team_schedule_table` section (no registered renderer → silent
// empty render). Now emits cobalt-band header + RSVP callout +
// venue list + day-grouped game_card rows + bracket section +
// logistics line + tagline footer + brand footer.
//
// Two-stage contract (locked across wave 4.2-A):
//   resolveTournamentPrelim({ tournamentId, pilotOnly }, options)
//     -> { context, slices }
//   composeTournamentPrelim(context, slice, overrides)
//     -> { subject, content_sections }
//
// Section builders extracted to tournamentPrelimSections.js to keep
// this file under the 150-line cap.

import {
  buildBracketSections, buildBrandFooter, buildHeaderSection, buildLogisticsLine,
  buildRsvpCalloutSection, buildScheduleSections, buildTaglineFooter, buildVenueListSection,
} from './tournamentPrelimSections';
import { buildSubject, buildTeamSlices, fetchRecipientGuardians, trim } from './tournamentPrelimHelpers';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

export async function resolveTournamentPrelim({ tournamentId, pilotOnly }, { supabase, now = new Date() } = {}) {
  if (!tournamentId) throw new Error('Missing tournamentId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  void now;

  const { data: tournament, error: tErr } = await supabase.from('tournaments').select('id, name, circuit, start_date, end_date, primary_venue, primary_venue_address, tourney_url, hotel_url, survival_notes, coach_theme, game_day_guide, hotel_block_info, hotel_block_deadline, rsvp_deadline_at, pool_label, schedule_status').eq('id', tournamentId).maybeSingle();
  if (tErr) throw tErr;
  if (!tournament) throw new Error(`Tournament ${tournamentId} not found`);

  const { data: ttRows = [] } = await supabase.from('tournament_teams').select('id, tournament_id, team_id, final_record_wins, final_record_losses, final_place, teams ( id, name, team_color, sort_order, org_id )').eq('tournament_id', tournamentId);
  const tournament_teams = (ttRows || []).map((r) => ({
    team_id: r.team_id, team_name: r.teams?.name || r.team_name || 'Team',
    team_color: r.teams?.team_color || r.team_color || '#4a8fd4',
    sort_order: r.teams?.sort_order ?? r.sort_order ?? 0,
    final_place: r.final_place, wins: r.final_record_wins ?? 0, losses: r.final_record_losses ?? 0,
  }));
  const orgId = (ttRows[0]?.teams?.org_id) || null;

  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined && orgId) {
    const { data: settings } = await supabase.from('organization_settings').select('pilot_mode_enabled').eq('organization_id', orgId).maybeSingle();
    effectivePilotOnly = settings?.pilot_mode_enabled ?? false;
  } else if (effectivePilotOnly === undefined) effectivePilotOnly = false;

  const teamIds = tournament_teams.map((t) => t.team_id);
  const { data: events = [] } = await supabase.from('events').select('id, team_id, event_type, start_at, end_at, location, sub_location, location_id, opponent, tournament_id, tournament_name, is_bracket_placeholder, bracket_placeholder_label, bracket_label, is_bonus_game, is_championship_final, status').eq('tournament_id', tournamentId);
  const events_by_team = {};
  for (const tid of teamIds) events_by_team[tid] = [];
  for (const ev of (events || []).slice().sort((a, b) => new Date(a.start_at) - new Date(b.start_at))) {
    if (events_by_team[ev.team_id]) events_by_team[ev.team_id].push(ev);
  }

  const locationIds = [...new Set((events || []).map((e) => e.location_id).filter(Boolean))];
  const locations = {};
  if (locationIds.length) {
    const { data: locRows = [] } = await supabase.from('locations').select('id, name, address, google_maps_url').in('id', locationIds);
    for (const l of locRows || []) locations[l.id] = { id: l.id, name: l.name, address: l.address, google_maps_url: l.google_maps_url };
  }

  const { data: coaches = [] } = orgId ? await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null) : { data: [] };
  const { data: org } = orgId ? await supabase.from('organizations').select('id, name, brand_colors, voice_config').eq('id', orgId).maybeSingle() : { data: null };
  const allRecipients = orgId ? await fetchRecipientGuardians(supabase, orgId, teamIds, effectivePilotOnly) : [];
  const slices = buildTeamSlices(tournament_teams, allRecipients);

  return {
    context: {
      org: {
        id: orgId, name: org?.name || ORG_NAME_DEFAULT,
        branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
        voice_config: org?.voice_config || null, brand_colors: org?.brand_colors || null,
        coaches: coaches || [],
      },
      tournament, tournament_teams, events_by_team, locations,
    },
    slices,
  };
}

function defaultCoachFirstName(coaches) {
  const first = (coaches || []).find((c) => c.display_name);
  return first ? String(first.display_name).split(/\s+/)[0] : null;
}

export function composeTournamentPrelim(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { tournament, events_by_team, locations, org } = context;
  const events = events_by_team[slice.team_id] || [];
  const sections = [];

  sections.push(buildHeaderSection(slice, tournament, overrides));
  sections.push(buildRsvpCalloutSection(overrides, defaultCoachFirstName(org.coaches)));
  const venueList = buildVenueListSection(events, locations);
  if (venueList) sections.push(venueList);

  const sched = buildScheduleSections(events, locations);
  if (sched.schedule?.length) sections.push(...sched.schedule);
  else sections.push({ kind: 'day_header', label: 'Schedule TBD', venue_suffix: null });
  if (sched.brackets?.length) sections.push(...buildBracketSections(sched.brackets, locations));

  // Wave 5 PR 1 — hotel_block preserved from prior resolver for
  // tournaments with hotel info (override OR tournament.hotel_block_info).
  const hotelText = trim(overrides.hotel_block) || trim(tournament.hotel_block_info) || (tournament.hotel_url ? `Hotel info: ${tournament.hotel_url}` : '');
  if (hotelText) sections.push({ kind: 'hotel_block', text: hotelText });

  sections.push(buildLogisticsLine(overrides));

  const signoffProse = trim(overrides.signoff_message);
  const validCoaches = (org.coaches || []).filter((c) => c.display_name && c.phone).map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  if (signoffProse || validCoaches.length) sections.push({ kind: 'signoff', prose: signoffProse, coaches: validCoaches });

  const tagline = buildTaglineFooter(overrides);
  if (tagline) sections.push(tagline);
  sections.push(buildBrandFooter(org.name));

  return { subject: buildSubject(slice, tournament), content_sections: sections };
}
