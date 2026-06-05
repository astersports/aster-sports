// games_recap (G1) — pure helpers for the multi-game digest resolver.
// Extracted to keep gamesRecap.js under the 150-line cap. Reuses
// fetchKidNames from the single-game gameRecap helpers.

import { fetchKidNames, trim } from './gameRecapHelpers';

export { trim };

const NY_TZ = 'America/New_York';
const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short', month: 'short', day: 'numeric' });
const rangeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });
const cellDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short' });
const cellDateFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });

export function dayLabel(startAt) {
  return startAt ? dayFmt.format(new Date(startAt)) : 'Date TBD';
}

// Date eyebrow for a recap game cell — "Mon · May 18" (matches the mock).
export function cellDateLabel(startAt) {
  if (!startAt) return 'Date TBD';
  const d = new Date(startAt);
  return `${cellDayFmt.format(d)} · ${cellDateFmt.format(d)}`;
}

// Build one `recap_game_cell` section from a recap game. The cell carries
// THIS GAME'S OWN team_color as the left rail (per-cell color — a
// multi-team recap puts each team's color on its own cell). Pure: same
// input -> deeply-equal output (AP #27); null opponent/venue omit
// gracefully (never "undefined").
//   team_color — per-game rail color (read by the renderer)
//   date_label — "Mon · May 18"
//   matchup    — "{team} vs {opponent}" (omits "vs ..." on null opp)
//   context    — venue when present, else omitted
//   our_score / opponent_score / result — score + W/L pill
export function buildGameCell(g) {
  const opp = g.opponent ? String(g.opponent).trim() : '';
  const matchup = opp ? `${g.team_name} vs ${opp}` : g.team_name;
  const venue = g.venue ? String(g.venue).trim() : '';
  const section = {
    kind: 'recap_game_cell',
    team_color: g.team_color || null,
    date_label: cellDateLabel(g.start_at),
    matchup,
    our_score: g.our_score,
    opponent_score: g.opponent_score,
    result: g.result,
  };
  if (venue) section.context = venue;
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
  // Header-band record pill: "0–2 RECORD · MAY 18 – MAY 20" (en-dash in
  // the record, uppercased range). Falls back to "{record} RECORD" with
  // no date range when no dated games are present.
  const recordDashed = record.replace(/-/g, '–');
  const recordPill = range
    ? `${recordDashed} RECORD · ${range.replace('–', ' – ').toUpperCase()}`
    : `${recordDashed} RECORD`;
  return { record, label: range ? `${record} · ${range}` : record, recordPill };
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
