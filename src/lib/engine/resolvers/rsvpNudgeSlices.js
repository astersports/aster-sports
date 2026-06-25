// Unresponded-guardian slice builder for rsvp_nudge, extracted from
// rsvpNudge.js to keep the resolver under the 150-line cap (CLAUDE.md §6).
// Pure with injected supabase (AP #27); every query checks error (AP #36).

import { resolvePilotRedirect } from './pilotRedirect';
import { eligibleRoster, isGameType } from '../../rsvpEligibility';

export async function fetchUnrespondedSlices(supabase, event, now, pilotOnly) {
  // Beta B6 audit — anti-pattern #36.
  const { data: tpData, error: tpErr } = await supabase.from('team_players').select('player_id, joined_at, left_at, status, players ( first_name, member_type )').eq('team_id', event.team_id).eq('status', 'active');
  if (tpErr) throw tpErr;
  const tpRows = tpData || [];
  const nowMs = now.getTime();
  const windowed = tpRows.filter((r) => (!r.left_at || new Date(r.left_at).getTime() > nowMs) && (!r.joined_at || new Date(r.joined_at).getTime() <= nowMs));

  // Audit 2026-06-12 F-4: the SD-6 eligibility contract applies to the
  // EMAIL lane too — a game nudge must never prompt a family whose kid
  // has no RSVP control in the app (unactivated academy). Shared module
  // (lib/rsvpEligibility) so this lane can't drift from the surfaces;
  // practices keep ALL academy kids, so the activations read is
  // game/tournament-only. totalRoster shrinks with it (the denominator
  // in nudge copy matches denominatorFor everywhere else).
  let activatedSet = null;
  if (isGameType(event.event_type)) {
    const { data: actData, error: actErr } = await supabase.from('player_activations').select('player_id').eq('event_id', event.id);
    if (actErr) throw actErr;
    activatedSet = new Set((actData || []).map((a) => a.player_id));
  }
  const eligibleIds = new Set(eligibleRoster(windowed.map((r) => ({ id: r.player_id, member_type: r.players?.member_type })), event.event_type, activatedSet).map((p) => p.id));
  const active = windowed.filter((r) => eligibleIds.has(r.player_id));
  const totalRoster = active.length;

  // Beta B6 audit — anti-pattern #36.
  const { data: rsvpData, error: rsvpErr } = await supabase.from('event_rsvps').select('player_id').eq('event_id', event.id);
  if (rsvpErr) throw rsvpErr;
  const rsvpRows = rsvpData || [];
  const respondedSet = new Set((rsvpRows || []).map((r) => r.player_id));

  const unresponded = active.filter((r) => !respondedSet.has(r.player_id));
  const playerNameById = new Map(unresponded.map((r) => [r.player_id, r.players?.first_name || '']));

  // D-5(a) / BRIEF-3 — pilot gate via the shared resolvePilotRedirect helper
  // (get_digest_recipients RPC, called once). FILTER mode narrows to the real
  // pilot-family allowlist; REDIRECT mode (synthetic null-guardian rows) skips
  // the per-guardian filter so the resolver still builds the REAL slices and
  // surfaces redirectEmail — the send pipeline then queues the pilot row shape
  // (null guardian + pilot email) while minting keeps the real ids. AP #36:
  // the helper surfaces RPC errors (no false-empty allowlist).
  const orgId = event.teams?.org_id || null;
  const { allowedGuardianIds, redirectMode, redirectEmail } = await resolvePilotRedirect(supabase, orgId, pilotOnly);

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

  return { slices, totalRoster, respondedCount: respondedSet.size, unrespondedCount: unresponded.length, redirectMode, redirectEmail };
}
