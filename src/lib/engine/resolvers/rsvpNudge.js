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


const EVENT_SELECT = 'id, title, team_id, event_type, start_at, end_at, location, location_id, opponent, status, publish_status, teams ( id, name, team_color, sort_order, org_id )';

async function fetchUnrespondedSlices(supabase, event, now, pilotOnly) {
  // Beta B6 audit — anti-pattern #36.
  const { data: tpData, error: tpErr } = await supabase.from('team_players').select('player_id, joined_at, left_at, status, players ( first_name )').eq('team_id', event.team_id).eq('status', 'active');
  if (tpErr) throw tpErr;
  const tpRows = tpData || [];
  const nowMs = now.getTime();
  const active = tpRows.filter((r) => (!r.left_at || new Date(r.left_at).getTime() > nowMs) && (!r.joined_at || new Date(r.joined_at).getTime() <= nowMs));
  const totalRoster = active.length;

  // Beta B6 audit — anti-pattern #36.
  const { data: rsvpData, error: rsvpErr } = await supabase.from('event_rsvps').select('player_id').eq('event_id', event.id);
  if (rsvpErr) throw rsvpErr;
  const rsvpRows = rsvpData || [];
  const respondedSet = new Set((rsvpRows || []).map((r) => r.player_id));

  const unresponded = active.filter((r) => !respondedSet.has(r.player_id));
  const playerNameById = new Map(unresponded.map((r) => [r.player_id, r.players?.first_name || '']));

  // D-5(a) — pilot mode: use get_digest_recipients RPC for the pilot
  // gate instead of the bare is_pilot_family field. Aligns this resolver
  // with tournamentPrelimHelpers.js Wave 4.3-I pattern. Post-cutover
  // (D-4 a) this picks up real pilot families (RPC FILTER branch). In
  // pre-cutover REDIRECT verification mode, synthetic rows (guardian_id
  // null) are dropped by the player_guardians intersection by design —
  // verification-mode sample renders for per-player kinds are out of
  // D-5 scope and tracked separately.
  let allowedGuardianIds = null;
  let redirectMode = false;
  if (pilotOnly) {
    const orgId = event.teams?.org_id || null;
    if (orgId) {
      // AP #36 — destructure error alongside data so a failed RPC doesn't
      // silently produce a false-empty allowlist (which would drop every
      // recipient and look like a normal 0-recipient result).
      const { data: rpcRows = [], error: rpcErr } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: true });
      if (rpcErr) throw rpcErr;
      // REDIRECT mode: synthetic per-team rows (guardian_id null) and no real
      // guardians → empty allowlist by construction. Skipping the per-guardian
      // filter below lets the resolver still build a real sample (the
      // "No recipients" bug otherwise). TEST send delivers it to the pilot
      // inbox; a real send stays gated by decidePilotGate. FILTER mode keeps
      // the narrow allowlist behavior (redirectMode false).
      redirectMode = (rpcRows || []).some((r) => r.guardian_id == null && r.email);
      allowedGuardianIds = new Set((rpcRows || []).filter((r) => r.guardian_id).map((r) => r.guardian_id));
    } else {
      allowedGuardianIds = new Set();
    }
  }

  let pgRows = [];
  if (unresponded.length) {
    // AP #36 — guard error so RLS/transient failure doesn't silently yield 0 recipients.
    const { data, error: pgErr } = await supabase.from('player_guardians').select('guardian_id, player_id, players ( first_name ), guardians ( id, email )').in('player_id', unresponded.map((r) => r.player_id));
    if (pgErr) throw pgErr;
    pgRows = data || [];
  }

  const slicesMap = new Map();
  for (const row of pgRows) {
    const g = row.guardians;
    if (!g?.id || !g.email) continue;
    if (pilotOnly && !redirectMode && !allowedGuardianIds.has(g.id)) continue;
    if (!playerNameById.has(row.player_id)) continue;
    if (!slicesMap.has(g.id)) slicesMap.set(g.id, { kind: 'family', guardian_id: g.id, email: g.email, team_id: event.team_id, _kids: new Map() });
    const s = slicesMap.get(g.id);
    const fn = row.players?.first_name || playerNameById.get(row.player_id);
    if (!s._kids.has(row.player_id)) s._kids.set(row.player_id, { player_id: row.player_id, first_name: fn || '' });
  }
  const slices = Array.from(slicesMap.values()).map((s) => ({ kind: s.kind, guardian_id: s.guardian_id, email: s.email, team_id: s.team_id, unresponded_kids: Array.from(s._kids.values()).sort((a, b) => (a.first_name < b.first_name ? -1 : a.first_name > b.first_name ? 1 : 0)) })).sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));

  return { slices, totalRoster, respondedCount: respondedSet.size, unrespondedCount: unresponded.length };
}

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

  const { slices, totalRoster, respondedCount, unrespondedCount } = await fetchUnrespondedSlices(supabase, event, now, effectivePilotOnly);

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
    },
    slices,
  };
}

export { composeRsvpNudge } from './rsvpNudgeCompose';
export { EventAlreadyStartedError, EventHasNoTeamError } from './rsvpNudgeHelpers';
