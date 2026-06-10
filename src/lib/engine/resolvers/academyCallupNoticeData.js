// Wave 4.2-A-7 — data-access helpers for the academyCallupNotice
// resolver. Extracted from academyCallupNotice.js to keep that file
// under the 150-line cap (CLAUDE.md §6 / §0 rule 4). Behavior is
// unchanged — these are the same two fetch functions, moved verbatim.
//
// Purity note (AP #27): these accept the Supabase client as a parameter
// (injected by the resolver, which itself receives it via
// options.supabase). No top-level supabase import — safe under vitest.

import { resolvePilotRedirect } from './pilotRedirect';

export const EVENT_SELECT = 'id, title, team_id, event_type, start_at, end_at, location_id, opponent, status, publish_status, academy_callup_player_ids, teams ( id, name, team_color, sort_order, org_id )';

export async function fetchHomeTeam(supabase, playerId) {
  // Beta B6 audit — anti-pattern #36. Surface errors explicitly.
  const { data: rows, error } = await supabase.from('team_players').select('id, team_id, roster_type, status, teams ( id, name, team_color, sort_order )').eq('player_id', playerId).eq('roster_type', 'futures').eq('status', 'active');
  if (error) throw error;
  const sorted = (rows || []).slice().sort((a, b) => (a.id < b.id ? -1 : 1));
  return sorted[0] || null;
}

export async function fetchSlices(supabase, orgId, playerId, kidFirstName, receivingTeamId, pilotOnly) {
  // D-5(a) / BRIEF-3 — pilot gate via the shared resolvePilotRedirect helper
  // (get_digest_recipients RPC, called once). FILTER mode narrows to the real
  // pilot-family allowlist; REDIRECT mode (synthetic null-guardian rows) skips
  // the per-guardian filter so the resolver still builds the REAL slices and
  // surfaces redirectEmail for the send pipeline's pilot row shape. AP #36:
  // the helper surfaces RPC errors (no false-empty allowlist).
  const { allowedGuardianIds, redirectMode, redirectEmail } = await resolvePilotRedirect(supabase, orgId, pilotOnly);

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
  const slices = out.sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
  return { slices, redirectMode, redirectEmail };
}
