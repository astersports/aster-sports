// Golden set for the AI-draft eval harness (scouting candidate A5).
// Synthetic facts only — no real family data. Underscore prefix keeps vitest
// from picking this up as a test file. Each case carries the violation codes
// the eval is expected to surface (empty = a clean draft).

// One realistic game_recap fact set. The eval grounds every number + claim in
// the prose against these values.
export const RECAP_FACTS = {
  opponent: 'Rye Tigers',
  result: 'Win',
  final_score: '42-38',
  point_differential: '4',
  venue: 'Westchester Community College',
  date: 'May 17',
  player_of_the_game: 'Jordan',
  season_so_far: '6-2',
};

const out = (o) => JSON.stringify(o);

// A clean, fact-faithful recap: every number (42, 38, 4, 6, 2, 17) is grounded,
// no em dash, no within-game timeline or season-position invention.
const CLEAN = out({
  body: 'Big team win over the Rye Tigers, 42 to 38. The effort on the glass carried it, and Jordan set the tone. That puts the group at 6 wins and 2 losses on the year. Proud of this crew. Keep it rolling.',
  card_summary: 'Tigers handled, 42 to 38. Jordan led the way.',
  facts_used: [{ k: 'final_score', v: '42-38' }, { k: 'player_of_the_game', v: 'Jordan' }],
  warnings: [],
});

export const GOLDEN_CASES = [
  { name: 'clean recap (all facts grounded)', facts: RECAP_FACTS, raw: CLEAN, expect: [] },

  { name: 'fenced clean recap (strip fences then pass)', facts: RECAP_FACTS,
    raw: '```json\n' + CLEAN + '\n```', expect: [] },

  { name: 'fabricated score (50 not in facts)', facts: RECAP_FACTS,
    raw: out({ body: 'Huge win, 50 to 38, never in doubt.', card_summary: 'Win 50 to 38.', facts_used: [], warnings: [] }),
    expect: ['fabricated_number'] },

  { name: 'invented within-game timeline (halftime)', facts: RECAP_FACTS,
    raw: out({ body: 'Down at halftime, the team roared back to beat the Rye Tigers 42 to 38.', card_summary: 'Comeback win.', facts_used: [], warnings: [] }),
    // "halftime" + "comeback" are both banned-context; "roared back" is fine.
    expect: ['unsupported_context'] },

  { name: 'invented season-position (playoff opener)', facts: RECAP_FACTS,
    raw: out({ body: 'A statement win in the playoff opener over the Rye Tigers, 42 to 38.', card_summary: 'Playoff opener win.', facts_used: [], warnings: [] }),
    expect: ['unsupported_context'] },

  { name: 'em dash present', facts: RECAP_FACTS,
    raw: out({ body: 'A strong win over the Rye Tigers — 42 to 38. Jordan led it.', card_summary: 'Win.', facts_used: [], warnings: [] }),
    expect: ['em_dash'] },

  { name: 'invented fact in facts_used', facts: RECAP_FACTS,
    raw: out({ body: 'Win over the Rye Tigers, 42 to 38.', card_summary: 'Win.', facts_used: [{ k: 'venue', v: 'Madison Square Garden' }], warnings: [] }),
    expect: ['invented_fact'] },

  { name: 'malformed json (not parseable)', facts: RECAP_FACTS,
    raw: '{ body: "missing quotes and a trailing comma", }', expect: ['malformed_json'] },

  { name: 'missing body + bad shape', facts: RECAP_FACTS,
    raw: out({ body: '', card_summary: 7, facts_used: 'nope', warnings: null }),
    expect: ['missing_body', 'bad_shape'] },

  { name: 'compound: fabricated number AND em dash', facts: RECAP_FACTS,
    raw: out({ body: 'Win by 19 — a blowout over the Rye Tigers.', card_summary: 'Blowout.', facts_used: [], warnings: [] }),
    expect: ['em_dash', 'fabricated_number'] },
];
