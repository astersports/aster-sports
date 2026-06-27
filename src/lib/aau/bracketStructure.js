// AAU §2.B — pure bracket-structure derivation (VITEST source of truth).
// DENO mirror: supabase/functions/aau-ingest-tournament/_bracket.ts (AP #30 —
// keep byte-near-identical apart from TS annotations; change both in one commit).
// Standard ES only so the two stay in sync under vitest (Node) + the edge runtime.
//
// Input: the parsed B-prefix bracket games of one division (the DivisionGame shape
// from parseTournament.js). Output: one slot descriptor PER GAME SIDE (2 per game),
// carrying the topology-derived round label, a deterministic slot_index, the parsed
// seed_source, and the advancement edge (the slot the game's WINNER fills). Pure —
// no IO, no fabrication: round depth is read from the "Bracket Winner B<n>" edges,
// never guessed; a human round NAME is emitted ONLY when the bracket size proves it
// (architect ruling D3, 2026-06-27), otherwise a neutral depth token.

/**
 * Parse a TM bracket seed-source placeholder string into structure.
 *   "Bracket Winner B1"        -> { kind:'winner',      fromSlot:'B1' }
 *   "Bracket Loser B3"         -> { kind:'loser',       fromSlot:'B3' }
 *   "National Orange 1st Place" -> { kind:'pool_finish', poolGroup:'National Orange', rank:1 }
 *   <a real, resolved team name> -> { kind:'team' }
 *   anything else               -> { kind:'unknown' }
 * `isPlaceholder` is the parser's isPlaceholderTeam verdict for the side; a side
 * that is NOT a placeholder is a concrete team regardless of its text.
 */
export function parseSeedSource(text, isPlaceholder) {
  const t = (text || '').trim();
  if (!isPlaceholder) return { kind: 'team' };
  let m = t.match(/\bwinner\s+(?:of\s+)?(B?\d+|[A-Z]?\d+)\b/i);
  if (/\bwinner\b/i.test(t) && m) return { kind: 'winner', fromSlot: normalizeSlot(m[1]) };
  m = t.match(/\bloser\s+(?:of\s+)?(B?\d+|[A-Z]?\d+)\b/i);
  if (/\bloser\b/i.test(t) && m) return { kind: 'loser', fromSlot: normalizeSlot(m[1]) };
  m = t.match(/^(.*?)\s+(\d+)(?:st|nd|rd|th)\s+place\b/i);
  if (m) return { kind: 'pool_finish', poolGroup: m[1].trim() || null, rank: parseInt(m[2], 10) };
  m = t.match(/\b(\d+)(?:st|nd|rd|th)\s+place\b/i);
  if (m) return { kind: 'pool_finish', poolGroup: null, rank: parseInt(m[1], 10) };
  return { kind: 'unknown' };
}

/** Normalize a referenced slot token to the B<n> game-code form used as the key. */
function normalizeSlot(tok) {
  const m = (tok || '').match(/(\d+)/);
  return m ? 'B' + m[1] : (tok || '').toUpperCase();
}

/** Standard single-elimination round NAME by depth-from-final, used ONLY when the
 * bracket is a proven-complete binary tree (size makes it unambiguous). */
const NAME_BY_DEPTH = { 0: 'Final', 1: 'Semifinal', 2: 'Quarterfinal', 3: 'Round of 16', 4: 'Round of 32', 5: 'Round of 64' };

/**
 * Derive bracket slot descriptors for a division's B-prefix games.
 * @param {Array} bracketGames - parsed DivisionGame objects whose externalGameId starts with 'B'.
 * @returns {Array} slot descriptors:
 *   { gameCode, side:'home'|'away', round, slotIndex, seedSourceRaw, seedSource,
 *     teamRef, isResolved, championship, advancesTo:{round,slotIndex}|null, isFinal }
 */
export function deriveBracketStructure(bracketGames) {
  const games = (bracketGames || []).filter((g) => /^B\d+/i.test(g.externalGameId || ''));
  if (!games.length) return [];

  // GROUNDING (2026-06-27): TM erases the seed-source text once a bracket game
  // RESOLVES — a completed bracket's schedule rows hold real team names, not
  // "Bracket Winner B<n>"/"Pool 1st", so the advancement topology is only
  // derivable while games are still UNSEEDED/in-progress. If THIS snapshot carries
  // no bracket structure (every side resolved to a team, no winner/loser/pool
  // seeds), return [] so a late resolved-state ingest never OVERWRITES the
  // structure captured by earlier (seeded) ingests with degraded labels. The
  // structure is captured during the seeding window; the result lives in
  // division_games regardless.
  const structural = (g, name, ph) => { const s = parseSeedSource(name, ph); return s.kind === 'winner' || s.kind === 'loser' || s.kind === 'pool_finish'; };
  const hasStructure = games.some((g) => structural(g, g.homeName, g.homePlaceholder) || structural(g, g.awayName, g.awayPlaceholder));
  if (!hasStructure) return [];

  // Per game: parse both sides' seed sources.
  const byCode = new Map();
  for (const g of games) {
    const code = (g.externalGameId.match(/^B\d+/i) || [g.externalGameId])[0].toUpperCase();
    byCode.set(code, {
      code,
      game: g,
      home: { raw: g.homeName || '', seed: parseSeedSource(g.homeName, g.homePlaceholder), ref: g.homeTeamRef || '', placeholder: g.homePlaceholder },
      away: { raw: g.awayName || '', seed: parseSeedSource(g.awayName, g.awayPlaceholder), ref: g.awayTeamRef || '', placeholder: g.awayPlaceholder },
    });
  }

  // Winner-feed edges: game F feeds game G when a side of G is { winner, fromSlot:F }.
  // fedByWinner[G] = set of F; consumedByWinner = set of F that feed SOME winner slot.
  const consumedByWinner = new Set();
  const hasLoserEdge = new Map();
  for (const node of byCode.values()) {
    let loser = false;
    for (const side of [node.home, node.away]) {
      if (side.seed.kind === 'winner' && byCode.has(side.seed.fromSlot)) consumedByWinner.add(side.seed.fromSlot);
      if (side.seed.kind === 'loser') loser = true;
    }
    hasLoserEdge.set(node.code, loser);
  }

  // Championship terminal = a game whose winner nobody consumes AND which is itself
  // fed by winner/pool edges (not a loser/consolation game). Pick the one with the
  // deepest winner-feed chain as the Final if several qualify.
  const terminals = [...byCode.keys()].filter((c) => !consumedByWinner.has(c) && !hasLoserEdge.get(c));
  // depthFromFinal via reverse walk along winner edges from the terminal.
  // depthFromFinal: the Final is 0; a game whose WINNER feeds a depth-d game is
  // d+1. Walk DOWN from the terminal along its own winner-edges to its feeders
  // (a game's feeders are the fromSlots of its winner-sides).
  const depth = new Map();
  function assignDepth(code, d) {
    if (depth.has(code) && depth.get(code) >= d) return; // keep the deepest
    depth.set(code, d);
    const node = byCode.get(code);
    if (!node) return;
    for (const side of [node.home, node.away]) {
      if (side.seed.kind === 'winner' && byCode.has(side.seed.fromSlot)) assignDepth(side.seed.fromSlot, d + 1);
    }
  }
  // Prefer the terminal that yields the deepest tree as the Final.
  let finalCode = null;
  if (terminals.length) {
    let best = -1;
    for (const t of terminals) {
      const probe = new Map();
      const stack = [[t, 0]];
      while (stack.length) {
        const [c, d] = stack.pop();
        if (probe.has(c) && probe.get(c) >= d) continue;
        probe.set(c, d);
        const node = byCode.get(c);
        if (node) for (const side of [node.home, node.away])
          if (side.seed.kind === 'winner' && byCode.has(side.seed.fromSlot)) stack.push([side.seed.fromSlot, d + 1]);
      }
      const md = Math.max(...probe.values());
      if (md > best) { best = md; finalCode = t; }
    }
    assignDepth(finalCode, 0);
  }

  const championship = new Set(depth.keys());
  const maxDepth = championship.size ? Math.max(...depth.values()) : 0;

  // "Size proves the name" = the championship path is a complete binary tree:
  // exactly one game at depth 0, two at 1, four at 2, ... (no byes, no gaps).
  const countAtDepth = new Map();
  for (const d of depth.values()) countAtDepth.set(d, (countAtDepth.get(d) || 0) + 1);
  let complete = championship.size > 0;
  for (let d = 0; d <= maxDepth; d++) if ((countAtDepth.get(d) || 0) !== Math.pow(2, d)) complete = false;

  function roundLabel(code) {
    if (championship.has(code)) {
      const d = depth.get(code);
      if (d === 0) return 'Final';
      if (complete && NAME_BY_DEPTH[d]) return NAME_BY_DEPTH[d];
      return 'Round -' + d; // neutral: d rounds before the Final (no fabrication)
    }
    // Consolation / placement branch — labeled off its own seed-source, never the
    // championship depth. Prefer an explicit "Nth Place" from either side.
    const node = byCode.get(code);
    for (const side of [node.home, node.away]) {
      if (side.seed.kind === 'pool_finish' && side.seed.rank > 2) return ordinal(side.seed.rank) + ' Place';
      const pm = (side.raw || '').match(/\b(\d+)(?:st|nd|rd|th)\s+place\b/i);
      if (pm) return ordinal(parseInt(pm[1], 10)) + ' Place';
    }
    return 'Consolation';
  }

  // Deterministic slot ordering: group games by round label, order by game-code
  // number within the round, two slots each (home=even, away=odd).
  const order = [...byCode.keys()].sort((a, b) => codeNum(a) - codeNum(b));
  const idxByRound = new Map();
  const slots = [];
  // Pre-compute, per game-code, the downstream winner slot (round,slotIndex). We
  // need slot_index of the consuming game's winner-source side, so do a first pass
  // assigning slot_index, then resolve advancesTo.
  const slotIndexFor = new Map(); // `${code}:${side}` -> {round, slotIndex}
  for (const code of order) {
    const round = roundLabel(code);
    let base = idxByRound.get(round) || 0;
    slotIndexFor.set(code + ':home', { round, slotIndex: base });
    slotIndexFor.set(code + ':away', { round, slotIndex: base + 1 });
    idxByRound.set(round, base + 2);
  }
  for (const code of order) {
    const node = byCode.get(code);
    const isFinal = championship.has(code) && depth.get(code) === 0;
    // The slot a side resolves into when its game's WINNER advances: find the game
    // whose winner-edge references `code`, and point at its winner-source side.
    let advancesTo = null;
    for (const other of byCode.values()) {
      for (const sideName of ['home', 'away']) {
        const s = other[sideName];
        if (s.seed.kind === 'winner' && s.seed.fromSlot === code) advancesTo = slotIndexFor.get(other.code + ':' + sideName);
      }
    }
    for (const sideName of ['home', 'away']) {
      const side = node[sideName];
      const pos = slotIndexFor.get(code + ':' + sideName);
      slots.push({
        gameCode: code,
        side: sideName,
        round: pos.round,
        slotIndex: pos.slotIndex,
        seedSourceRaw: side.raw || null,
        seedSource: side.seed,
        teamRef: side.ref || null,
        isResolved: !side.placeholder,
        championship: championship.has(code),
        isFinal,
        advancesTo, // winner destination (same for both sides of a game), or null at the Final
      });
    }
  }
  return slots;
}

function codeNum(code) { const m = (code || '').match(/(\d+)/); return m ? parseInt(m[1], 10) : 0; }
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
