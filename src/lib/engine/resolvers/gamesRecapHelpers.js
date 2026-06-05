// games_recap (G1) — pure helpers for the multi-game digest resolver.
// Extracted to keep gamesRecap.js under the 150-line cap. Reuses
// fetchKidNames from the single-game gameRecap helpers.

import { fetchKidNames, trim } from './gameRecapHelpers';

export { trim };

const NY_TZ = 'America/New_York';
const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short', month: 'short', day: 'numeric' });
const rangeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });
const railDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short' });
const railDateFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'numeric', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true });

export function dayLabel(startAt) {
  return startAt ? dayFmt.format(new Date(startAt)) : 'Date TBD';
}

const RESULT_TONE = { W: 'green', L: 'red', T: 'amber' };
const RESULT_WORD = { W: 'Win', L: 'Loss', T: 'Tie' };

// Build one `game_card` section from a recap game. Reuses the existing
// game_card renderer (registered in SECTION_RENDERERS, used by
// tournament_prelim) — no new renderer, no SECTION_RENDERERS orphan risk
// (AP #38). Pure: same input -> deeply-equal output (AP #27).
//   rail   — day (e.g. "Sat 5/3") as label + tip time as timePrimary
//   primary — "{team} vs {opponent}" (omits "vs ..." gracefully on null opp)
//   secondary — venue when present, else omitted
//   stakeLine — "{us}–{them} · {Win|Loss|Tie}" toned green/red/amber
// team_color is carried for parity with the resolver fetch + future use;
// the game_card renderer owns its own variant colors (it does not read it).
export function buildGameCard(g) {
  const label = g.start_at ? `${railDayFmt.format(new Date(g.start_at))} ${railDateFmt.format(new Date(g.start_at))}` : 'TBD';
  const opp = g.opponent ? String(g.opponent).trim() : '';
  const primary = opp ? `${g.team_name} vs ${opp}` : g.team_name;
  const venue = g.venue ? String(g.venue).trim() : '';
  const tone = RESULT_TONE[g.result] || 'muted';
  const word = RESULT_WORD[g.result] || g.result || '';
  const stakeText = word ? `${g.our_score}–${g.opponent_score} · ${word}` : `${g.our_score}–${g.opponent_score}`;
  const section = {
    kind: 'game_card', variant: 'regular',
    rail: { label, timePrimary: g.start_at ? timeFmt.format(new Date(g.start_at)) : '' },
    primary,
    stakeLine: { text: stakeText, tone },
    team_color: g.team_color || null,
  };
  if (venue) section.secondary = { text: venue, link: null };
  return section;
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
  return `Games recap: ${games.length} game${games.length === 1 ? '' : 's'} (${record})`;
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
