// games_recap (G1) — pure helpers for the multi-game digest resolver.
// Extracted to keep gamesRecap.js under the 150-line cap. Reuses
// fetchKidNames from the single-game gameRecap helpers.

import { fetchKidNames, trim } from './gameRecapHelpers';

export { trim };

const NY_TZ = 'America/New_York';
const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short', month: 'short', day: 'numeric' });
const rangeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });

export function dayLabel(startAt) {
  return startAt ? dayFmt.format(new Date(startAt)) : 'Date TBD';
}

// W-L(-T) record across the games + a date-range label for the hero.
export function summarizeGames(games) {
  let w = 0; let l = 0; let t = 0;
  for (const g of games) {
    if (g.result === 'W') w += 1; else if (g.result === 'L') l += 1; else if (g.result === 'T') t += 1;
  }
  const record = t ? `${w}-${l}-${t}` : `${w}-${l}`;
  const dates = games.map((g) => g.start_at).filter(Boolean).sort();
  let range = '';
  if (dates.length) {
    const first = rangeFmt.format(new Date(dates[0]));
    const last = rangeFmt.format(new Date(dates[dates.length - 1]));
    range = first === last ? first : `${first}–${last}`;
  }
  return { record, label: range ? `${record} · ${range}` : record };
}

export function buildGamesSubject(games, record) {
  return `Games recap — ${games.length} game${games.length === 1 ? '' : 's'} (${record})`;
}

// Recipients across the UNION of the selected events' teams, deduped by
// guardian so a family on two of the teams gets one recap. Mirrors
// gameRecapHelpers.fetchSlices but for a team-id set.
export async function fetchSlicesForTeams(supabase, orgId, teamIds, pilotOnly) {
  const { data: rpcRows = [], error } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: pilotOnly });
  if (error) throw error;
  const idSet = new Set(teamIds);
  const matched = (rpcRows || []).filter((r) => (r.team_ids || []).some((t) => idSet.has(t)));
  const byGuardian = new Map();
  for (const r of matched) if (!byGuardian.has(r.guardian_id)) byGuardian.set(r.guardian_id, r);
  const rows = [...byGuardian.values()];
  if (!rows.length) return [];
  const kidsByGuardian = await fetchKidNames(supabase, rows.map((r) => r.guardian_id));
  return rows
    .map((r) => ({
      kind: 'family', guardian_id: r.guardian_id, email: r.email,
      kid_first_names: (kidsByGuardian.get(r.guardian_id) || []).slice().sort(),
      team_ids: (r.team_ids || []).filter((t) => idSet.has(t)),
    }))
    .sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
}
