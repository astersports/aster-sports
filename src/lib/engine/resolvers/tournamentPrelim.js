// Wave 4.2-A-3 — tournament_prelim resolver pair.
//
// Two-stage contract (locked across wave 4.2-A):
//   resolveTournamentPrelim({ tournamentId, pilotOnly }, options)
//     -> { context, slices }
//   composeTournamentPrelim(context, slice, overrides)
//     -> { subject, content_sections }
//
// Calendar walk: tournaments + tournament_teams + events (filtered by
// tournament_id) + locations + team_players + player_guardians +
// guardians + staff_profiles + organizations.
//
// Slice is per-team: each participating team gets its own
// content_sections (their own schedule). Recipient guardians are
// embedded in the slice for downstream send pipeline.
//
// Hallucination guard:
//   - Empty tournament_teams -> slices = [].
//   - Empty events for a team -> "Schedule TBD" structure (no
//     fabricated rows).
//   - Map link omitted per row when location.google_maps_url is null.
//   - Sparse tournament metadata (null/empty hotel_url, survival_notes,
//     coach_theme, etc.) -> corresponding sections omitted entirely.
//   - Override beats data when both present.
//   - Coaches with null phone omitted from signoff (matches wave).

import {
  buildSubContext, buildSubject, buildTeamSlices,
  fetchRecipientGuardians, formatDayLabel, formatTime, trim,
} from './tournamentPrelimHelpers';

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
  const { data: events = [] } = await supabase.from('events').select('id, team_id, event_type, start_at, end_at, location, sub_location, location_id, opponent, tournament_id, tournament_name, is_bracket_placeholder, bracket_placeholder_label, status').eq('tournament_id', tournamentId);
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
        id: orgId, name: ORG_NAME_DEFAULT,
        branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
        voice_config: org?.voice_config || null, brand_colors: org?.brand_colors || null,
        coaches: coaches || [],
      },
      tournament,
      tournament_teams,
      events_by_team,
      locations,
    },
    slices,
  };
}

function buildTeamScheduleSection(events, locations, teamColor) {
  if (!events || !events.length) return { kind: 'team_schedule_table', team_color: teamColor, days: [], placeholder: 'Schedule TBD' };
  const dayMap = new Map();
  for (const ev of events) {
    const label = formatDayLabel(ev.start_at);
    if (!dayMap.has(label)) dayMap.set(label, []);
    const loc = locations[ev.location_id] || null;
    const isBracket = !ev.opponent && !ev.is_bracket_placeholder;
    dayMap.get(label).push({
      time: formatTime(ev.start_at),
      opponent: ev.opponent || (isBracket ? 'Bracket TBD' : 'TBD'),
      location_name: loc?.name || ev.location || 'Location TBD',
      location_map_url: loc?.google_maps_url || null,
    });
  }
  const days = Array.from(dayMap.entries()).map(([day_label, rows]) => ({ day_label, rows }));
  return { kind: 'team_schedule_table', team_color: teamColor, days };
}

export function composeTournamentPrelim(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { tournament, events_by_team, locations, org } = context;
  const sections = [];
  sections.push({ kind: 'header', eyebrow: `${slice.team_name.toUpperCase()} · TOURNAMENT WEEK`, eyebrow_link: org.branding.eyebrowLink, headline: 'TOURNAMENT BRIEFING', sub_context: buildSubContext(tournament), goldStripe: true, team_color: slice.team_color });
  sections.push(buildTeamScheduleSection(events_by_team[slice.team_id] || [], locations, slice.team_color));

  const hotelText = trim(overrides.hotel_block) || trim(tournament.hotel_block_info) || (tournament.hotel_url ? `Hotel info: ${tournament.hotel_url}` : '');
  if (hotelText) sections.push({ kind: 'hotel_block', text: hotelText });

  const survival = trim(overrides.survival_guide) || trim(tournament.survival_notes);
  if (survival) sections.push({ kind: 'survival_guide', text: survival });

  const coachKeys = trim(overrides.coach_keys) || trim(tournament.coach_theme);
  if (coachKeys) sections.push({ kind: 'coach_keys', text: coachKeys });

  const linkLabel = trim(overrides.tourney_url_label);
  if (tournament.tourney_url && linkLabel) sections.push({ kind: 'tourney_url_link', label: linkLabel, url: tournament.tourney_url });

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
