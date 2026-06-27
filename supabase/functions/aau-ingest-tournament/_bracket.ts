// AAU §2.B — pure bracket-structure derivation (DENO mirror).
// VITEST source of truth: src/lib/aau/bracketStructure.js (AP #30 — keep
// byte-near-identical apart from TS annotations; change both in one commit).
// Standard ES only so the two stay in sync under vitest (Node) + the edge runtime.
// See the source file for the full contract; this mirror adds only TS types.

export interface SeedSource {
  kind: 'winner' | 'loser' | 'pool_finish' | 'team' | 'unknown';
  fromSlot?: string;
  poolGroup?: string | null;
  rank?: number;
}
export interface BracketSlot {
  gameCode: string;
  side: 'home' | 'away';
  round: string;
  slotIndex: number;
  seedSourceRaw: string | null;
  seedSource: SeedSource;
  teamRef: string | null;
  isResolved: boolean;
  championship: boolean;
  isFinal: boolean;
  advancesTo: { round: string; slotIndex: number } | null;
}

export function parseSeedSource(text: string, isPlaceholder: boolean): SeedSource {
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

function normalizeSlot(tok: string): string {
  const m = (tok || '').match(/(\d+)/);
  return m ? 'B' + m[1] : (tok || '').toUpperCase();
}

const NAME_BY_DEPTH: Record<number, string> = { 0: 'Final', 1: 'Semifinal', 2: 'Quarterfinal', 3: 'Round of 16', 4: 'Round of 32', 5: 'Round of 64' };

export function deriveBracketStructure(bracketGames: any[]): BracketSlot[] {
  const games = (bracketGames || []).filter((g) => /^B\d+/i.test(g.externalGameId || ''));
  if (!games.length) return [];

  // GROUNDING (2026-06-27): TM erases the seed-source text once a bracket game
  // RESOLVES, so the advancement topology is only derivable while games are still
  // UNSEEDED/in-progress. If THIS snapshot carries no bracket structure, return []
  // so a late resolved-state ingest never overwrites earlier-captured structure.
  const structural = (name: string, ph: boolean): boolean => { const s = parseSeedSource(name, ph); return s.kind === 'winner' || s.kind === 'loser' || s.kind === 'pool_finish'; };
  const hasStructure = games.some((g) => structural(g.homeName, g.homePlaceholder) || structural(g.awayName, g.awayPlaceholder));
  if (!hasStructure) return [];

  const byCode = new Map<string, any>();
  for (const g of games) {
    const code = (g.externalGameId.match(/^B\d+/i) || [g.externalGameId])[0].toUpperCase();
    byCode.set(code, {
      code,
      game: g,
      home: { raw: g.homeName || '', seed: parseSeedSource(g.homeName, g.homePlaceholder), ref: g.homeTeamRef || '', placeholder: g.homePlaceholder },
      away: { raw: g.awayName || '', seed: parseSeedSource(g.awayName, g.awayPlaceholder), ref: g.awayTeamRef || '', placeholder: g.awayPlaceholder },
    });
  }

  const consumedByWinner = new Set<string>();
  const hasLoserEdge = new Map<string, boolean>();
  for (const node of byCode.values()) {
    let loser = false;
    for (const side of [node.home, node.away]) {
      if (side.seed.kind === 'winner' && byCode.has(side.seed.fromSlot)) consumedByWinner.add(side.seed.fromSlot);
      if (side.seed.kind === 'loser') loser = true;
    }
    hasLoserEdge.set(node.code, loser);
  }

  const terminals = [...byCode.keys()].filter((c) => !consumedByWinner.has(c) && !hasLoserEdge.get(c));
  // depthFromFinal: walk DOWN from the terminal along its own winner-edges to its
  // feeders (a game's feeders are the fromSlots of its winner-sides).
  const depth = new Map<string, number>();
  function assignDepth(code: string, d: number): void {
    if (depth.has(code) && (depth.get(code) as number) >= d) return;
    depth.set(code, d);
    const node = byCode.get(code);
    if (!node) return;
    for (const side of [node.home, node.away]) {
      if (side.seed.kind === 'winner' && byCode.has(side.seed.fromSlot)) assignDepth(side.seed.fromSlot, d + 1);
    }
  }
  let finalCode: string | null = null;
  if (terminals.length) {
    let best = -1;
    for (const t of terminals) {
      const probe = new Map<string, number>();
      const stack: Array<[string, number]> = [[t, 0]];
      while (stack.length) {
        const [c, d] = stack.pop() as [string, number];
        if (probe.has(c) && (probe.get(c) as number) >= d) continue;
        probe.set(c, d);
        const node = byCode.get(c);
        if (node) for (const side of [node.home, node.away])
          if (side.seed.kind === 'winner' && byCode.has(side.seed.fromSlot)) stack.push([side.seed.fromSlot, d + 1]);
      }
      const md = Math.max(...probe.values());
      if (md > best) { best = md; finalCode = t; }
    }
    assignDepth(finalCode as string, 0);
  }

  const championship = new Set<string>(depth.keys());
  const maxDepth = championship.size ? Math.max(...depth.values()) : 0;

  const countAtDepth = new Map<number, number>();
  for (const d of depth.values()) countAtDepth.set(d, (countAtDepth.get(d) || 0) + 1);
  let complete = championship.size > 0;
  for (let d = 0; d <= maxDepth; d++) if ((countAtDepth.get(d) || 0) !== Math.pow(2, d)) complete = false;

  function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function roundLabel(code: string): string {
    if (championship.has(code)) {
      const d = depth.get(code) as number;
      if (d === 0) return 'Final';
      if (complete && NAME_BY_DEPTH[d]) return NAME_BY_DEPTH[d];
      return 'Round -' + d;
    }
    const node = byCode.get(code);
    for (const side of [node.home, node.away]) {
      if (side.seed.kind === 'pool_finish' && side.seed.rank > 2) return ordinal(side.seed.rank) + ' Place';
      const pm = (side.raw || '').match(/\b(\d+)(?:st|nd|rd|th)\s+place\b/i);
      if (pm) return ordinal(parseInt(pm[1], 10)) + ' Place';
    }
    return 'Consolation';
  }

  const order = [...byCode.keys()].sort((a, b) => codeNum(a) - codeNum(b));
  const idxByRound = new Map<string, number>();
  const slots: BracketSlot[] = [];
  const slotIndexFor = new Map<string, { round: string; slotIndex: number }>();
  for (const code of order) {
    const round = roundLabel(code);
    const base = idxByRound.get(round) || 0;
    slotIndexFor.set(code + ':home', { round, slotIndex: base });
    slotIndexFor.set(code + ':away', { round, slotIndex: base + 1 });
    idxByRound.set(round, base + 2);
  }
  for (const code of order) {
    const node = byCode.get(code);
    const isFinal = championship.has(code) && depth.get(code) === 0;
    let advancesTo: { round: string; slotIndex: number } | null = null;
    for (const other of byCode.values()) {
      for (const sideName of ['home', 'away']) {
        const s = other[sideName];
        if (s.seed.kind === 'winner' && s.seed.fromSlot === code) advancesTo = slotIndexFor.get(other.code + ':' + sideName) as any;
      }
    }
    for (const sideName of ['home', 'away'] as const) {
      const side = node[sideName];
      const pos = slotIndexFor.get(code + ':' + sideName) as { round: string; slotIndex: number };
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
        advancesTo,
      });
    }
  }
  return slots;
}

function codeNum(code: string): number { const m = (code || '').match(/(\d+)/); return m ? parseInt(m[1], 10) : 0; }
