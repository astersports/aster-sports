// AI-2 (option i): extracts the GIVEN facts from a kind's resolver context into
// a flat {Label: value} object for the AI-draft fn + the facts panel, and maps
// which body override field the AI voice narrative fills. The structured stat
// block / game log render the facts; the AI writes the prose around them.
//
// Add an anchored kind by adding its EXTRACT entry + AI_DRAFT_FIELD entry, then
// surfacing it in StepBodySignoff's supported set.

export const AI_DRAFT_FIELD = {
  game_recap: 'coach_note',
};

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
};

export function anchoredFacts(kind, context) {
  const fn = EXTRACT[kind];
  return fn && context ? fn(context) : {};
}
