// Wave 4.2-A-2 — pure helpers for the game_recap resolver pair.
// Extracted to keep gameRecap.js under the 150-line cap.

const NY_TZ = 'America/New_York';
const dayLabelFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'long', month: 'long', day: 'numeric' });

export const RESULT_VERB = { W: 'beat', L: 'fell to', T: 'tied' };

export class GameRecapNotPublishedError extends Error {
  constructor(eventId) {
    super(`Game result for event ${eventId} is not yet published.`);
    this.name = 'GameRecapNotPublishedError';
    this.eventId = eventId;
  }
}

export function formatSubContext(startAt, locationName) {
  const date = startAt ? dayLabelFmt.format(new Date(startAt)) : 'Date TBD';
  const loc = locationName || 'Location TBD';
  return `${date} · ${loc}`;
}

export function buildSubject(team, event, gr) {
  const teamName = team?.name || 'Legacy Hoopers';
  const opp = event?.opponent ? String(event.opponent).trim() : '';
  if (!opp) return `Recap — ${teamName} ${gr.our_score}-${gr.opponent_score}`;
  const verb = RESULT_VERB[gr.result] || 'played';
  return `Recap — ${teamName} ${verb} ${opp}, ${gr.our_score}-${gr.opponent_score}`;
}

export function trim(s) { return (s || '').trim(); }

export async function fetchKidNames(supabase, guardianIds) {
  if (!guardianIds.length) return new Map();
  const { data: rows = [], error } = await supabase
    .from('player_guardians').select('guardian_id, players ( first_name )').in('guardian_id', guardianIds);
  if (error) throw error;
  const m = new Map();
  for (const row of rows || []) {
    const fn = row.players?.first_name || row.first_name;
    if (!fn) continue;
    const arr = m.get(row.guardian_id) || [];
    arr.push(fn); m.set(row.guardian_id, arr);
  }
  return m;
}

export async function fetchSlices(supabase, orgId, teamId, pilotOnly) {
  const { data: rpcRows = [], error: rpcErr } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: pilotOnly });
  if (rpcErr) throw rpcErr;
  const onTeam = (rpcRows || []).filter((r) => (r.team_ids || []).includes(teamId));
  if (!onTeam.length) return [];
  const kidsByGuardian = await fetchKidNames(supabase, onTeam.map((r) => r.guardian_id));
  return onTeam
    .map((r) => ({
      kind: 'family', guardian_id: r.guardian_id, email: r.email,
      kid_first_names: (kidsByGuardian.get(r.guardian_id) || []).slice().sort(),
      team_id: teamId,
    }))
    .sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
}
