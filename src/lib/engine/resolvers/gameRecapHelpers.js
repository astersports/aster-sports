// Wave 4.2-A-2 — pure helpers for the game_recap resolver pair.
// Extracted to keep gameRecap.js under the 150-line cap.

const NY_TZ = 'America/New_York';
const dayLabelFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'long', month: 'long', day: 'numeric' });
const cellDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short' });
const cellDateFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });
const pillDateFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });

export const RESULT_VERB = { W: 'beat', L: 'fell to', T: 'tied' };

const RESULT_WORD = { W: 'WIN', L: 'LOSS', T: 'TIE' };

// Date eyebrow for a recap game cell — "Mon · May 18" (matches the mock).
export function cellDateLabel(startAt) {
  if (!startAt) return 'Date TBD';
  const d = new Date(startAt);
  return `${cellDayFmt.format(d)} · ${cellDateFmt.format(d)}`;
}

// Header-band record pill for a single game — "WIN · MAY 2" (single-game
// recap has no W-L tally, so the result word stands in for the record).
export function buildGameRecapPill(event, gr) {
  const word = RESULT_WORD[gr?.result] || (gr?.result ? String(gr.result).toUpperCase() : '');
  const date = event?.start_at ? pillDateFmt.format(new Date(event.start_at)).toUpperCase() : '';
  return [word, date].filter(Boolean).join(' · ');
}

// Build the single `recap_game_cell` section for a game_recap. The cell
// carries the team's color as the left rail. Pure: same input ->
// deeply-equal output (AP #27); null opponent/venue omit gracefully.
// Mirrors buildGameCell in gamesRecapHelpers.js but reads the single-game
// game_recap context shape (team / event / location / game_result).
//   team_color — rail color
//   date_label — "Mon · May 2"
//   matchup    — "{team} vs {opponent}" (omits "vs ..." on null opp)
//   context    — venue (location.name) when present, else omitted
//   our_score / opponent_score / result — score + W/L pill
export function buildGameRecapCard(team, event, location, gr) {
  const teamName = team?.name || 'Aster AAU';
  const opp = event?.opponent ? String(event.opponent).trim() : '';
  const matchup = opp ? `${teamName} vs ${opp}` : teamName;
  const venue = location?.name ? String(location.name).trim() : '';
  const section = {
    kind: 'recap_game_cell',
    team_color: team?.team_color || null,
    date_label: cellDateLabel(event?.start_at),
    matchup,
    our_score: gr.our_score,
    opponent_score: gr.opponent_score,
    result: gr.result,
  };
  if (venue) section.context = venue;
  return section;
}

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
  const teamName = team?.name || 'Aster AAU';
  const opp = event?.opponent ? String(event.opponent).trim() : '';
  if (!opp) return `Recap: ${teamName} ${gr.our_score}-${gr.opponent_score}`;
  const verb = RESULT_VERB[gr.result] || 'played';
  return `Recap: ${teamName} ${verb} ${opp}, ${gr.our_score}-${gr.opponent_score}`;
}

export function trim(s) { return (s || '').trim(); }

export async function fetchKidNames(supabase, guardianIds) {
  // Filter out null/undefined guardianIds — the pilot test rows from
  // get_digest_recipients return guardian_id=null (admin@ stands in
  // for each team with no real guardian backing). Without this filter,
  // .in('guardian_id', [null]) serializes as ?guardian_id=in.(null)
  // which Postgres reads as the literal string "null" and rejects with
  // 22P02 (invalid input syntax for type uuid: "null"). Frank-reported
  // 2026-05-20 via test-send on the schedule_change Notify families
  // flow. Sibling fetchKidNames in tournamentPrelimHelpers.js already
  // filters (line 68); this version was missed.
  const validIds = (guardianIds || []).filter(Boolean);
  if (!validIds.length) return new Map();
  const { data: rows = [], error } = await supabase
    .from('player_guardians').select('guardian_id, players ( first_name )').in('guardian_id', validIds);
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
