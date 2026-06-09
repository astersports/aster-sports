// Wave 4.2-A-7 — data-access helpers for the academyCallupNotice
// resolver. Extracted from academyCallupNotice.js to keep that file
// under the 150-line cap (CLAUDE.md §6 / §0 rule 4). Behavior is
// unchanged — these are the same two fetch functions, moved verbatim.
//
// Purity note (AP #27): these accept the Supabase client as a parameter
// (injected by the resolver, which itself receives it via
// options.supabase). No top-level supabase import — safe under vitest.

export const EVENT_SELECT = 'id, title, team_id, event_type, start_at, end_at, location_id, opponent, status, publish_status, academy_callup_player_ids, teams ( id, name, team_color, sort_order, org_id )';

export async function fetchHomeTeam(supabase, playerId) {
  // Beta B6 audit — anti-pattern #36. Surface errors explicitly.
  const { data: rows, error } = await supabase.from('team_players').select('id, team_id, roster_type, status, teams ( id, name, team_color, sort_order )').eq('player_id', playerId).eq('roster_type', 'futures').eq('status', 'active');
  if (error) throw error;
  const sorted = (rows || []).slice().sort((a, b) => (a.id < b.id ? -1 : 1));
  return sorted[0] || null;
}

export async function fetchSlices(supabase, orgId, playerId, kidFirstName, receivingTeamId, pilotOnly) {
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
    // AP #36 — destructure error alongside data so a failed RPC doesn't
    // silently produce a false-empty allowlist (which would drop every
    // recipient and look like a normal 0-recipient result).
    const { data: rpcRows = [], error: rpcErr } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: true });
    if (rpcErr) throw rpcErr;
    // REDIRECT mode: synthetic per-team rows (guardian_id null) and no real
    // guardians → empty allowlist by construction. Skip the per-guardian filter
    // so the resolver still builds a real sample (otherwise "No recipients").
    // TEST send delivers it to the pilot inbox; a real send stays gated by
    // decidePilotGate. FILTER mode keeps the narrow allowlist (redirectMode false).
    redirectMode = (rpcRows || []).some((r) => r.guardian_id == null && r.email);
    allowedGuardianIds = new Set((rpcRows || []).filter((r) => r.guardian_id).map((r) => r.guardian_id));
  }

  // Beta B6 audit — anti-pattern #36.
  const { data: rows, error } = await supabase.from('player_guardians').select('guardian_id, player_id, guardians ( id, email, org_id )').eq('player_id', playerId);
  if (error) throw error;
  const seen = new Set();
  const out = [];
  for (const row of rows || []) {
    const g = row.guardians;
    if (!g?.id || !g.email) continue;
    if (g.org_id && g.org_id !== orgId) continue;
    if (pilotOnly && !redirectMode && !allowedGuardianIds.has(g.id)) continue;
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    out.push({ kind: 'family', guardian_id: g.id, email: g.email, player_id: playerId, kid_first_name: kidFirstName, team_id: receivingTeamId });
  }
  return out.sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
}
