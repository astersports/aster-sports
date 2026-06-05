// Wave 4.2-A-2 — pure helpers for the game_recap resolver pair.
// Extracted to keep gameRecap.js under the 150-line cap.

const NY_TZ = 'America/New_York';
const dayLabelFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'long', month: 'long', day: 'numeric' });
const railDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short' });
const railDateFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'numeric', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true });

export const RESULT_VERB = { W: 'beat', L: 'fell to', T: 'tied' };

const RESULT_TONE = { W: 'green', L: 'red', T: 'amber' };
const RESULT_WORD = { W: 'Win', L: 'Loss', T: 'Tie' };

// Build the single `game_card` section for a game_recap. Reuses the
// existing game_card renderer (registered in SECTION_RENDERERS, used by
// tournament_prelim) — no new renderer, no SECTION_RENDERERS orphan risk
// (AP #38). Pure: same input -> deeply-equal output (AP #27). Mirrors
// buildGameCard in gamesRecapHelpers.js but reads the single-game
// game_recap context shape (team / event / location / game_result).
//   rail   — day (e.g. "Sat 5/2") as label + tip time as timePrimary
//   primary — "{team} vs {opponent}" (omits "vs ..." gracefully on null opp)
//   secondary — venue (location.name) when present, else omitted
//   stakeLine — "{us}–{them} · {Win|Loss|Tie}" toned green/red/amber
// team_color is carried for parity with tournament_prelim + future use;
// the game_card renderer owns its own variant colors (it does not read it).
export function buildGameRecapCard(team, event, location, gr) {
  const startAt = event?.start_at;
  const label = startAt ? `${railDayFmt.format(new Date(startAt))} ${railDateFmt.format(new Date(startAt))}` : 'TBD';
  const teamName = team?.name || 'Legacy Hoopers';
  const opp = event?.opponent ? String(event.opponent).trim() : '';
  const primary = opp ? `${teamName} vs ${opp}` : teamName;
  const venue = location?.name ? String(location.name).trim() : '';
  const tone = RESULT_TONE[gr.result] || 'muted';
  const word = RESULT_WORD[gr.result] || gr.result || '';
  const stakeText = word ? `${gr.our_score}–${gr.opponent_score} · ${word}` : `${gr.our_score}–${gr.opponent_score}`;
  const section = {
    kind: 'game_card', variant: 'regular',
    rail: { label, timePrimary: startAt ? timeFmt.format(new Date(startAt)) : '' },
    primary,
    stakeLine: { text: stakeText, tone },
    team_color: team?.team_color || null,
  };
  if (venue) section.secondary = { text: venue, link: null };
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
  const teamName = team?.name || 'Legacy Hoopers';
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
