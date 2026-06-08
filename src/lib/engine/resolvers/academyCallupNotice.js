// Wave 4.2-A-7 — academy_callup_notice resolver pair.
//
// Two-stage contract:
//   resolveAcademyCallupNotice({ eventId, playerId, pilotOnly }, options)
//     -> { context, slices }
//   composeAcademyCallupNotice(context, slice, overrides)
//     -> { subject, content_sections }
//
// Two-ID anchor (first in the wave). Notifies a futures_academy
// player's family that the player has been called up to play with
// a regular team for a specific event. Slices are the called-up
// player's guardians ONLY -- not the receiving team's families.
//
// Production data model:
//   - players.member_type ∈ {'roster', 'futures_academy'}
//   - team_players.roster_type ∈ {'rostered', 'futures'}
//   - events.academy_callup_player_ids: uuid[] of called-up players
//   - No callup_responses table; callup token mint is downstream.
//
// Token URLs are NOT minted in resolver or compose. Compose emits
// literal {{callup_accept_url}} / {{callup_decline_url}} placeholders.

import {
  buildNarrative, computeResponseWindow, computeUrgency,
  EventAlreadyStartedError, EventHasNoTeamError, EventNotFoundError,
  PlayerNotAcademyError, PlayerNotCalledUpError, PlayerNotFoundError, trim,
} from './academyCallupNoticeHelpers';
import { deriveEventLabel } from './rsvpNudgeHelpers';
import { buildOrgContext } from '../buildOrgContext';
import { EVENT_SELECT, fetchHomeTeam, fetchSlices } from './academyCallupNoticeData';


export async function resolveAcademyCallupNotice({ eventId, playerId, pilotOnly }, { supabase, now = new Date() } = {}) {
  if (!eventId) throw new Error('Missing eventId');
  if (!playerId) throw new Error('Missing playerId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');

  const { data: event, error: eventErr } = await supabase.from('events').select(EVENT_SELECT).eq('id', eventId).maybeSingle();
  if (eventErr) throw eventErr;
  if (!event) throw new EventNotFoundError(eventId);
  const { data: player, error: playerErr } = await supabase.from('players').select('id, first_name, last_name, grade, member_type, is_active, org_id').eq('id', playerId).maybeSingle();
  if (playerErr) throw playerErr;
  if (!player) throw new PlayerNotFoundError(playerId);
  if (player.member_type !== 'futures_academy') throw new PlayerNotAcademyError(playerId);
  if (!event.team_id) throw new EventHasNoTeamError(eventId);
  if (new Date(event.start_at).getTime() <= now.getTime()) throw new EventAlreadyStartedError(eventId);
  const callupIds = event.academy_callup_player_ids || [];
  if (!callupIds.includes(playerId)) throw new PlayerNotCalledUpError(eventId, playerId);

  const orgId = event.teams?.org_id || player.org_id;
  if (!orgId) throw new Error(`Event ${eventId} has no team org_id`);

  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined) {
    const { data: settings, error: settingsErr } = await supabase.from('organization_settings').select('pilot_mode_enabled').eq('organization_id', orgId).maybeSingle();
    if (settingsErr) throw settingsErr;
    effectivePilotOnly = settings?.pilot_mode_enabled ?? false;
  }

  const homeTpRow = await fetchHomeTeam(supabase, playerId);
  const home_team = homeTpRow?.teams ? { id: homeTpRow.teams.id, name: homeTpRow.teams.name, team_color: homeTpRow.teams.team_color, sort_order: homeTpRow.teams.sort_order } : null;
  const receiving_team = event.teams ? { id: event.teams.id, name: event.teams.name, team_color: event.teams.team_color, sort_order: event.teams.sort_order } : null;

  let location = null;
  if (event.location_id) {
    const { data: l, error: lErr } = await supabase.from('locations').select('id, name, address, google_maps_url').eq('id', event.location_id).maybeSingle();
    if (lErr) throw lErr;
    location = l || null;
  }
  // Beta B6 audit — anti-pattern #36.
  const { data: coachesData, error: coachesErr } = await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null);
  if (coachesErr) throw coachesErr;
  const coaches = coachesData || [];
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id, name, display_name, brand_colors, voice_config, mailing_address').eq('id', orgId).maybeSingle();
  if (orgErr) throw orgErr;
  const slices = await fetchSlices(supabase, orgId, playerId, player.first_name, event.team_id, effectivePilotOnly);

  return {
    context: {
      org: buildOrgContext({ orgId, org, coaches }),
      event: { id: event.id, title: event.title, team_id: event.team_id, event_type: event.event_type, start_at: event.start_at, end_at: event.end_at, location_id: event.location_id, opponent: event.opponent, academy_callup_player_ids: callupIds, status: event.status, publish_status: event.publish_status },
      receiving_team, home_team, location,
      player: { id: player.id, first_name: player.first_name, last_name: player.last_name, grade: player.grade, member_type: player.member_type },
      urgency: computeUrgency(event.start_at, event.end_at, now),
      response: computeResponseWindow(event.start_at, now),
    },
    slices,
  };
}

export function composeAcademyCallupNotice(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { event, receiving_team, home_team, location, player, urgency, response, org } = context;
  const eventLabel = deriveEventLabel(event);
  const subjectLabel = event.title || `${receiving_team?.name || ''} ${eventLabel}`.trim();
  const isSameTeam = !!(home_team && receiving_team && home_team.id === receiving_team.id);
  const sections = [];
  sections.push({ kind: 'header', eyebrow: 'FUTURES ACADEMY · CALL-UP', eyebrow_link: org.branding.eyebrowLink, headline: 'CALL-UP', urgency_label: (urgency.day_label || '').toUpperCase(), goldStripe: true });
  sections.push({ kind: 'callup_card', kid_first_name: player.first_name, home_team_name: home_team?.name || '', home_team_color: home_team?.team_color || null, receiving_team_name: receiving_team?.name || '', receiving_team_color: receiving_team?.team_color || null, is_same_team: isSameTeam, event_label: eventLabel, urgency_phrase: `${urgency.day_label} at ${urgency.time_label}`, narrative: buildNarrative({ kid_first_name: player.first_name, home_team_name: home_team?.name || '', receiving_team_name: receiving_team?.name || '', is_same_team: isSameTeam, event_label: eventLabel, day_label: urgency.day_label, opponent: event.opponent }) });
  sections.push({ kind: 'event_card', team_color: receiving_team?.team_color || '#4a8fd4', date: ((iso) => iso ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(iso)) : '')(event.start_at), time: urgency.time_range_label, location_name: location?.name || null, location_map_url: location?.google_maps_url || null, opponent: event.opponent || null });
  sections.push({ kind: 'callup_response', player_id: player.id, callup_token_placeholders: { accept: '{{callup_accept_url}}', decline: '{{callup_decline_url}}' }, window_label: response.window_label, deadline_at: response.deadline_at });
  for (const key of ['coach_note', 'parent_shoutout']) {
    const v = trim(overrides[key]); if (v) sections.push({ kind: 'stats_narrative', body: v });
  }
  const validCoaches = (org.coaches || []).filter((c) => c.display_name && c.phone).map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  const signoffProse = trim(overrides.signoff_message);
  if (signoffProse || validCoaches.length) sections.push({ kind: 'signoff', prose: signoffProse, coaches: validCoaches });
  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail, mailingAddress: org.branding.mailingAddress });
  const subject = `Call-up: ${player.first_name} for ${subjectLabel}`;
  return { subject, content_sections: sections };
}

export {
  EventAlreadyStartedError, EventHasNoTeamError, EventNotFoundError,
  PlayerNotAcademyError, PlayerNotCalledUpError, PlayerNotFoundError,
} from './academyCallupNoticeHelpers';
