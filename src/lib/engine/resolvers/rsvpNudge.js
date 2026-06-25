// Wave 4.2-A-6 — rsvp_nudge resolver pair.
//
// Two-stage contract:
//   resolveRsvpNudge({ eventId, pilotOnly }, options)
//     -> { context, slices }
//   composeRsvpNudge(context, slice, overrides)
//     -> { subject, content_sections }
//
// Recipient query: NOT EXISTS against event_rsvps. Filter slices to
// guardians with at least one unresponded kid on the event's team.
// Slice ordering: guardian_id ASC. kid_first_names sorted ASC.
//
// RSVP token URLs are NOT minted in resolver or compose. Compose
// emits literal {{rsvp_going_url}} / {{rsvp_maybe_url}} /
// {{rsvp_not_going_url}} placeholders. The send-time renderer mints
// tokens via the rsvp-token-handler infrastructure and substitutes
// URLs. Maintains wave-locked purity contract.
//
// Hallucination guards:
//   - event.team_id null -> EventHasNoTeamError
//   - event.start_at <= options.now -> EventAlreadyStartedError
//   - All roster responded / empty roster -> slices = []

import { buildOrgContext } from '../buildOrgContext';
import { computeUrgency, EventAlreadyStartedError, EventHasNoTeamError } from './rsvpNudgeHelpers';
import { fetchUnrespondedSlices } from './rsvpNudgeSlices';


const EVENT_SELECT = 'id, title, team_id, event_type, start_at, end_at, location, location_id, opponent, status, publish_status, teams ( id, name, team_color, sort_order, org_id )';

export async function resolveRsvpNudge({ eventId, pilotOnly }, { supabase, now = new Date() } = {}) {
  if (!eventId) throw new Error('Missing eventId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');

  const { data: event, error: eventErr } = await supabase.from('events').select(EVENT_SELECT).eq('id', eventId).maybeSingle();
  if (eventErr) throw eventErr;
  if (!event) throw new Error(`Event ${eventId} not found`);
  if (!event.team_id) throw new EventHasNoTeamError(eventId);
  if (new Date(event.start_at).getTime() <= now.getTime()) throw new EventAlreadyStartedError(eventId);
  const orgId = event.teams?.org_id;
  if (!orgId) throw new Error(`Event ${eventId} has no team org_id`);

  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined) {
    const { data: settings, error: settingsErr } = await supabase.from('organization_settings').select('pilot_mode_enabled').eq('organization_id', orgId).maybeSingle();
    if (settingsErr) throw settingsErr;
    effectivePilotOnly = settings?.pilot_mode_enabled ?? true; // FORK-D fail-closed default
  }

  const { slices, totalRoster, respondedCount, unrespondedCount, redirectMode, redirectEmail } = await fetchUnrespondedSlices(supabase, event, now, effectivePilotOnly);

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
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id, name, display_name, brand_colors, voice_config').eq('id', orgId).maybeSingle();
  if (orgErr) throw orgErr;

  return {
    context: {
      org: buildOrgContext({ orgId, org, coaches }),
      event: { id: event.id, title: event.title, team_id: event.team_id, event_type: event.event_type, start_at: event.start_at, end_at: event.end_at, location_id: event.location_id, opponent: event.opponent, status: event.status, publish_status: event.publish_status },
      team: event.teams ? { id: event.teams.id, name: event.teams.name, team_color: event.teams.team_color, sort_order: event.teams.sort_order } : null,
      location,
      urgency: computeUrgency(event.start_at, event.end_at, now),
      rsvp_summary: { total_roster: totalRoster, responded_count: respondedCount, unresponded_count: unrespondedCount },
      // BRIEF-3 — pilot redirect signal for the send pipeline. redirectMode
      // true ⇒ queue the pilot row shape (null guardian + redirectEmail).
      pilot: { redirectMode: !!redirectMode, redirectEmail: redirectEmail || null },
    },
    slices,
  };
}

export { composeRsvpNudge } from './rsvpNudgeCompose';
export { EventAlreadyStartedError, EventHasNoTeamError } from './rsvpNudgeHelpers';
