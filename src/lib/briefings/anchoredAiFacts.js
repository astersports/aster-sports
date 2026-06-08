// AI-2 (option i): extracts the GIVEN facts from a kind's resolver context into
// a flat {Label: value} object for the AI-draft fn + the facts panel, and maps
// which body override field the AI voice narrative fills. The structured stat
// block / game log render the facts; the AI writes the prose around them.
//
// Add an anchored kind by adding its EXTRACT entry + AI_DRAFT_FIELD entry, then
// (if its anchor isn't eventId/tournamentId/eventIds) widening the readiness
// check in AiDraftAnchored.

export const AI_DRAFT_FIELD = {
  game_recap: 'coach_note',
  games_recap: 'coach_note',
  tournament_recap: 'coach_reflection',
};

function ordinal(n) {
  const v = Number(n);
  if (!v) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const m = v % 100;
  return `${v}${s[(m - 20) % 10] || s[m] || s[0]}`;
}

const EXTRACT = {
  game_recap: (ctx) => {
    const gr = ctx.game_result || {};
    const out = {};
    if (ctx.team?.name) out.Team = ctx.team.name;
    if (ctx.event?.opponent) out.Opponent = String(ctx.event.opponent).trim();
    if (gr.our_score != null && gr.opponent_score != null) {
      out.Final = `${gr.our_score}-${gr.opponent_score}${gr.result ? ` (${gr.result})` : ''}`;
    }
    if (ctx.player_of_game?.first_name) out['Player of the game'] = ctx.player_of_game.first_name;
    if (ctx.location?.name) out.Venue = ctx.location.name;
    return out;
  },
  games_recap: (ctx) => {
    const out = {};
    const games = Array.isArray(ctx.games) ? ctx.games : [];
    // Only surface an aggregate record when it spans MULTIPLE games, and label
    // its scope. For a single game the "record" just restates the game line and
    // reads like a SEASON record (the "0-1 RECORD" that made the AI infer a
    // season opener / write a season-wrap). Single game -> let the game line
    // carry it; the prompt scope rule keeps the AI from implying season position.
    if (ctx.summary?.record && games.length > 1) out['Record across these games'] = ctx.summary.record;
    if (games.length) {
      out.Games = games.map((g) => {
        const opp = g.opponent ? String(g.opponent).trim() : 'opponent';
        return `${g.day_label ? `${g.day_label} ` : ''}${g.team_name} ${g.our_score}-${g.opponent_score} vs ${opp}${g.result ? ` (${g.result})` : ''}`.trim();
      }).join('; ');
    }
    return out;
  },
  tournament_recap: (ctx) => {
    const out = {};
    if (ctx.tournament?.name) out.Tournament = ctx.tournament.name;
    const teams = Array.isArray(ctx.tournament_teams) ? ctx.tournament_teams : [];
    const results = teams.map((t) => `${t.team_name} ${t.wins ?? 0}-${t.losses ?? 0}${t.final_place ? ` (${ordinal(t.final_place)})` : ''}`);
    if (results.length) out.Results = results.join('; ');
    return out;
  },
};

export function anchoredFacts(kind, context) {
  const fn = EXTRACT[kind];
  return fn && context ? fn(context) : {};
}
