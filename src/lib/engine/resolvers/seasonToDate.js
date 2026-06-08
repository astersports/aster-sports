// Season-to-date record for a single team in a single competition scope, as of
// a date. Used by game_recap / games_recap to give the AI true season position
// (fix B) + the F3b header pill, so a single mid-season game is not read as a
// season opener. Reuses teamRecords.computeSummary (AP#42) — one source for the
// W/L math across the Records page and briefings.
//
// Scope = events.event_type ('game' = League Play, 'tournament' = Tournament).
// "Season-to-date" v1 = ALL published results for the team in that scope with
// start_at <= asOf (CURRENT standing, includes the recapped game). No season_id
// filter — LH has one season of data and 7+ rows carry NULL season_id; the
// season_id backfill + season-window scoping is a v2 concern (architect plan).

import { computeSummary } from '../../teamRecords';

export const SCOPE_LABEL = { game: 'League Play', tournament: 'Tournament' };

// Pure: header pill string for the single-team season case. Renderer uppercases.
// e.g. seasonPillText('3-5', 'game') -> "3–5 League Play · Season" -> rendered
// "3–5 LEAGUE PLAY · SEASON".
export function seasonPillText(record, scope) {
  const dashed = String(record || '').replace(/-/g, '–');
  const label = SCOPE_LABEL[scope] || '';
  return `${dashed} ${label} · Season`.replace(/\s+/g, ' ').trim();
}

// Fetches the team's published results in `scope` up to `asOf` and returns
// { record, gamesPlayed, scope, scopeLabel } via computeSummary, or null when
// there are no qualifying games. Throws on query error (AP#36) — callers
// degrade gracefully so a season-fetch failure never breaks the recap.
export async function fetchSeasonToDate(supabase, { teamId, scope, asOf } = {}) {
  if (!supabase) throw new Error('Missing supabase client');
  if (!teamId || !scope) return null;
  const { data, error } = await supabase
    .from('game_results')
    .select('result, our_score, opponent_score, events!inner(team_id, event_type, start_at)')
    .eq('events.team_id', teamId)
    .eq('events.event_type', scope)
    .lte('events.start_at', asOf)
    .not('published_at', 'is', null);
  if (error) throw error;
  const rows = (data || []).map((r) => ({
    result: r.result,
    our_score: r.our_score,
    opponent_score: r.opponent_score,
    start_at: r.events?.start_at,
  }));
  if (!rows.length) return null;
  const s = computeSummary(rows);
  return { record: s.record, gamesPlayed: s.gamesPlayed, scope, scopeLabel: SCOPE_LABEL[scope] || '' };
}
