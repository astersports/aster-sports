// Wave 4.2-A-3 — tournament_prelim resolver pair.
// Wave 5 (cutover wave PR 1, 2026-05-16) — compose() aligned to Frank's
// hand-composed pattern. Emits header + RSVP callout + venue list +
// day-grouped game_card rows + bracket + standings + weather + rules +
// logistics + tagline + brand footer. Gold-standard showcase sections
// (standings/weather/rules) added per the §2 reference render.
//
// Two-stage contract (locked across wave 4.2-A):
//   resolveTournamentPrelim({ tournamentId, pilotOnly }, options)
//     -> { context, slices }
//   composeTournamentPrelim(context, slice, overrides)
//     -> { subject, content_sections }
//
// Section builders live in tournamentPrelimSections.js +
// tournamentPrelimGoldSections.js to keep this file under the 150-line cap.

import {
  buildBracketSections, buildBrandFooter, buildHeaderSection, buildLogisticsLine,
  buildRsvpCalloutSection, buildScheduleSections, buildTaglineFooter,
  buildVenueListSection, buildVenueNotesSection,
} from './tournamentPrelimSections';
import { buildGoldSections } from './tournamentPrelimGoldSections';
import { buildSubject, buildTeamSlices, fetchParticipantGuardiansByTeam, fetchRecipientGuardians, trim } from './tournamentPrelimHelpers';
import { fetchTournamentWeather, weatherLocationFrom } from './tournamentWeather';
import { buildOrgContext } from '../buildOrgContext';

export async function resolveTournamentPrelim({ tournamentId, pilotOnly }, { supabase, now = new Date(), fetchWeather = fetchTournamentWeather } = {}) {
  if (!tournamentId) throw new Error('Missing tournamentId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  void now;

  const { data: tournament, error: tErr } = await supabase.from('tournaments').select('id, name, circuit, start_date, end_date, primary_venue, primary_venue_address, tourney_url, hotel_url, survival_notes, coach_theme, game_day_guide, hotel_block_info, hotel_block_deadline, rsvp_deadline_at, pool_label, schedule_status').eq('id', tournamentId).maybeSingle();
  if (tErr) throw tErr;
  if (!tournament) throw new Error(`Tournament ${tournamentId} not found`);

  const { data: ttRowsRaw, error: ttErr } = await supabase.from('tournament_teams').select('id, tournament_id, team_id, final_record_wins, final_record_losses, final_place, teams ( id, name, team_color, sort_order, org_id )').eq('tournament_id', tournamentId);
  if (ttErr) throw ttErr;
  const ttRows = ttRowsRaw || [];
  const tournament_teams = ttRows.map((r) => ({
    team_id: r.team_id, team_name: r.teams?.name || r.team_name || 'Team',
    team_color: r.teams?.team_color || r.team_color || '#4a8fd4',
    sort_order: r.teams?.sort_order ?? r.sort_order ?? 0,
    final_place: r.final_place, wins: r.final_record_wins ?? 0, losses: r.final_record_losses ?? 0,
  }));
  const orgId = (ttRows[0]?.teams?.org_id) || null;

  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined && orgId) {
    const { data: settings, error: settingsErr } = await supabase.from('organization_settings').select('pilot_mode_enabled').eq('organization_id', orgId).maybeSingle();
    if (settingsErr) throw settingsErr;
    effectivePilotOnly = settings?.pilot_mode_enabled ?? true; // FORK-D fail-closed default
  } else if (effectivePilotOnly === undefined) effectivePilotOnly = true; // FORK-D fail-closed (no orgId)

  const teamIds = tournament_teams.map((t) => t.team_id);
  const { data: eventsRaw, error: evErr } = await supabase.from('events').select('id, team_id, event_type, start_at, end_at, location, sub_location, location_id, opponent, tournament_id, tournament_name, is_bracket_placeholder, bracket_placeholder_label, bracket_label, is_bonus_game, is_championship_final, status').eq('tournament_id', tournamentId);
  if (evErr) throw evErr;
  const events = eventsRaw || [];
  const events_by_team = {};
  for (const tid of teamIds) events_by_team[tid] = [];
  for (const ev of events.slice().sort((a, b) => new Date(a.start_at) - new Date(b.start_at))) {
    if (events_by_team[ev.team_id]) events_by_team[ev.team_id].push(ev);
  }

  const locationIds = [...new Set(events.map((e) => e.location_id).filter(Boolean))];
  const locations = {};
  if (locationIds.length) {
    const { data: locRows, error: locErr } = await supabase.from('locations').select('id, name, address, google_maps_url, notes, parking_notes, entry_instructions, lat, lon').in('id', locationIds);
    if (locErr) throw locErr;
    for (const l of locRows || []) locations[l.id] = { id: l.id, name: l.name, address: l.address, google_maps_url: l.google_maps_url, notes: l.notes, parking_notes: l.parking_notes, entry_instructions: l.entry_instructions, lat: l.lat, lon: l.lon };
  }

  // Weather strip (AP #27: IO injected via fetchWeather). Anchor on the
  // first event-location with coords; empty array when none -> compose
  // omits the section (NEVER fabricates).
  const wxLoc = weatherLocationFrom(events.slice().sort((a, b) => new Date(a.start_at) - new Date(b.start_at)), locations);
  const weather = wxLoc
    ? await fetchWeather({ lat: wxLoc.lat, lon: wxLoc.lon, startDate: tournament.start_date, endDate: tournament.end_date })
    : [];
  const weather_city = wxLoc?.city || null;

  const coachesRes = orgId ? await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null) : { data: [], error: null };
  if (coachesRes.error) throw coachesRes.error;
  const coaches = coachesRes.data || [];
  const { data: org, error: orgErr } = orgId ? await supabase.from('organizations').select('id, name, display_name, brand_colors, voice_config').eq('id', orgId).maybeSingle() : { data: null, error: null };
  if (orgErr) throw orgErr;
  const allRecipients = orgId ? await fetchRecipientGuardians(supabase, orgId, teamIds, effectivePilotOnly) : [];
  // Q3: scope prelim to tournament-roster participants (null = no roster -> whole team).
  const participantsByTeam = await fetchParticipantGuardiansByTeam(supabase, tournamentId);
  const slices = buildTeamSlices(tournament_teams, allRecipients, participantsByTeam);

  return {
    context: {
      org: buildOrgContext({ orgId, org, coaches }),
      tournament, tournament_teams, events_by_team, locations,
      weather, weather_city,
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
  const venueNotes = buildVenueNotesSection(events, locations);
  if (venueNotes) sections.push(venueNotes);

  const sched = buildScheduleSections(events, locations);
  if (sched.schedule?.length) sections.push(...sched.schedule);
  else sections.push({ kind: 'day_header', label: 'Schedule TBD', venue_suffix: null });
  if (sched.brackets?.length) sections.push(...buildBracketSections(sched.brackets, locations));

  // Gold-standard showcase sections, reference order standings ->
  // weather -> rules (after bracket). Each omitted when data absent (AP #27).
  sections.push(...buildGoldSections(context, slice, overrides));

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
  // tournament_prelim is a PARENT broadcast (scoped to tournament-roster
  // guardians), so it needs the compliance footer (contact email per §13#5
  // + CAN-SPAM {{UNSUBSCRIBE_URL}}). The brand_footer is tagline-only and
  // carries neither, so it alone is not compliant for a broadcast. Emit the
  // full footer first, then the brand band as the closing flourish.
  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail });
  sections.push(buildBrandFooter(org.name));

  return { subject: buildSubject(slice, tournament), content_sections: sections };
}
