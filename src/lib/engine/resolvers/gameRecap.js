// Wave 4.2-A-2 — game_recap resolver pair.
//
// Two-stage contract (locked across wave 4.2-A):
//   resolveGameRecap({ eventId, pilotOnly }, options)
//     -> { context, slices }
//   composeGameRecap(context, slice, overrides)
//     -> { subject, content_sections }
//
// Calendar walk: events + game_results + players + locations +
// tournaments + team rosters. Hallucination guard:
//   - GameRecapNotPublishedError if game_result.published_at IS NULL
//   - POG section omitted when player_of_game_id is null
//   - coach_highlight section omitted when blank
//   - "Location TBD" on null location.name; coaches with null phone
//     omitted from signoff (matches 4.2-A-1)
//
// Tournament context is fetched for completeness but composeGameRecap
// ignores it. game_recap never renders tournament framing — that is
// the domain of tournament_recap (4.2-A-4) and tournament_prelim
// (4.2-A-3).

import {
  buildSubject, fetchSlices, formatSubContext,
  GameRecapNotPublishedError, trim,
} from './gameRecapHelpers';

export { GameRecapNotPublishedError } from './gameRecapHelpers';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

const EVENT_SELECT = 'id, team_id, event_type, start_at, end_at, location, sub_location, location_id, opponent, tournament_id, tournament_name, status, teams ( id, name, team_color, sort_order, org_id ), locations ( id, name, google_maps_url )';

export async function resolveGameRecap({ eventId, pilotOnly }, { supabase, now = new Date() } = {}) {
  if (!eventId) throw new Error('Missing eventId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  void now;

  const { data: event, error: eventErr } = await supabase.from('events').select(EVENT_SELECT).eq('id', eventId).maybeSingle();
  if (eventErr) throw eventErr;
  if (!event) throw new Error(`Event ${eventId} not found`);
  const orgId = event.teams?.org_id;
  if (!orgId) throw new Error(`Event ${eventId} has no team org_id`);

  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined) {
    const { data: settings } = await supabase.from('organization_settings').select('pilot_mode_enabled').eq('organization_id', orgId).maybeSingle();
    effectivePilotOnly = settings?.pilot_mode_enabled ?? false;
  }

  const { data: gameResult, error: grErr } = await supabase.from('game_results').select('our_score, opponent_score, result, quarter_scores, player_of_game_id, coach_highlight, published_at').eq('event_id', eventId).maybeSingle();
  if (grErr) throw grErr;
  if (!gameResult || !gameResult.published_at) throw new GameRecapNotPublishedError(eventId);

  let playerOfGame = null;
  if (gameResult.player_of_game_id) {
    const { data: p } = await supabase.from('players').select('id, first_name').eq('id', gameResult.player_of_game_id).maybeSingle();
    playerOfGame = p || null;
  }

  let tournament = null;
  if (event.tournament_id) {
    const { data: t } = await supabase.from('tournaments').select('id, name, start_date, end_date, tourney_url, schedule_status').eq('id', event.tournament_id).maybeSingle();
    tournament = t || null;
  }

  // Beta B6 audit — anti-pattern #36.
  const { data: coachesData, error: coachesErr } = await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null);
  if (coachesErr) throw coachesErr;
  const coaches = coachesData || [];
  const { data: org } = await supabase.from('organizations').select('id, name, brand_colors, voice_config').eq('id', orgId).maybeSingle();
  const slices = await fetchSlices(supabase, orgId, event.team_id, effectivePilotOnly);

  return {
    context: {
      org: {
        id: orgId, name: ORG_NAME_DEFAULT,
        branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
        voice_config: org?.voice_config || null, brand_colors: org?.brand_colors || null,
        coaches: coaches || [],
      },
      event: { id: event.id, start_at: event.start_at, opponent: event.opponent, location_id: event.location_id, tournament_id: event.tournament_id, team_id: event.team_id },
      team: event.teams ? { id: event.teams.id, name: event.teams.name, team_color: event.teams.team_color, sort_order: event.teams.sort_order } : null,
      game_result: gameResult,
      player_of_game: playerOfGame,
      location: event.locations ? { id: event.locations.id, name: event.locations.name, map_link: event.locations.google_maps_url } : null,
      tournament,
    },
    slices,
  };
}

export function composeGameRecap(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { team, event, game_result: gr, player_of_game: pog, location, org } = context;
  const sections = [];
  sections.push({ kind: 'header', eyebrow: `${org.name} · GAME RECAP`, eyebrow_link: org.branding.eyebrowLink, headline: 'GAME RECAP', sub_context: formatSubContext(event.start_at, location?.name), goldStripe: true });

  const teamName = team?.name || org.name;
  const opp = event?.opponent ? String(event.opponent).trim() : '';
  const finalLine = opp
    ? `Final: ${teamName} ${gr.our_score} – ${opp} ${gr.opponent_score} (${gr.result})`
    : `Final: ${teamName} ${gr.our_score}-${gr.opponent_score} (${gr.result})`;
  sections.push({ kind: 'stats_narrative', body: finalLine });

  if (pog?.first_name) sections.push({ kind: 'stats_narrative', body: `Player of the game: ${pog.first_name}` });
  if (trim(gr.coach_highlight)) sections.push({ kind: 'stats_narrative', body: trim(gr.coach_highlight) });

  for (const key of ['our_highlights', 'opp_highlights', 'coach_note', 'parent_shoutout']) {
    const v = trim(overrides[key]);
    if (v) sections.push({ kind: 'stats_narrative', body: v });
  }

  const validCoaches = (org.coaches || []).filter((c) => c.display_name && c.phone).map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  const signoffProse = trim(overrides.signoff_message);
  if (signoffProse || validCoaches.length) sections.push({ kind: 'signoff', prose: signoffProse, coaches: validCoaches });

  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail });

  return { subject: buildSubject(team, event, gr), content_sections: sections };
}
