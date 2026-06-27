// AAU §2.D candidate — Layer-2 SEMANTIC game identity (the architect's
// matchup + structure key) + the re-seed PROOF harness. PURE; vitest-only for now.
//
// NOT yet wired into the ingest. This is (1) the deterministic key proven against
// live data before the §2.D Layer-1 index migration, and (2) the future consumer-
// facing reference + re-seed reconciler. The AP #30 Deno mirror is created when
// §2.D wires this into aau-ingest-tournament — until then there is one source.
//
// Architect ruling 2026-06-27: identity = division + unordered resolved_key pair +
// structural role + intra-context sequence; start_at/court/status/score/slot-label
// are MUTABLE attributes, never part of the key. Layer-1 (TM data-gameid) is the
// primary stored id; this Layer-2 key is the semantic reference and the reconciler
// for the regeneration tail where data-gameid churns.

/** Unordered, case-insensitive team-pair key from two resolved_keys. */
export function teamPairKey(homeKey, awayKey) {
  return [String(homeKey || '').toLowerCase(), String(awayKey || '').toLowerCase()].sort().join('~');
}

/**
 * Structural role — the time-free discriminator.
 *   bracket -> `b:<round>:<slotIndex>` (round/slotIndex from bracket_slots, §2.B)
 *   pool    -> `p:<poolKey>`           (the pool the matchup sits in)
 *   generic -> `g`
 * Pre-bracket_slots a caller may pass round/slotIndex undefined; the kind ('B'/'P'/'G',
 * from the slot-label prefix) alone already separates the 53/55 cross-kind collisions.
 */
export function structuralRole({ kind, round, slotIndex, poolKey }) {
  if (kind === 'B') return `b:${round ?? '?'}:${slotIndex ?? '?'}`;
  if (kind === 'P') return `p:${poolKey ?? '-'}`;
  return 'g';
}

/**
 * Compose the Layer-2 key. `seq` defaults 0; only a genuine same-(division, pair,
 * role, day) rematch carries seq>0 (assigned by assignSequences). Deterministic,
 * contains no mutable attribute.
 */
export function stableGameKey({ divisionId, homeKey, awayKey, role, seq = 0 }) {
  return [divisionId, teamPairKey(homeKey, awayKey), role, seq].join('|');
}

/**
 * Assign the intra-context SEQUENCE for rematches. Group by (division, pair, role)
 * — GLOBALLY, no date qualifier (architect refinement 1, L99 2026-06-27): the key
 * string omits date (date is mutable — a reschedule moves a game across days), so
 * the seq must too, or a pool that spans two days with a repeated pairing would mint
 * two seq-0 games → same key → collision. Grouping globally gives every repeat in a
 * role a distinct seq and still keeps date out of the key (proof (a) holds: moving a
 * game across days changes neither (div,pair,role) membership nor data-gameid order).
 * Within a group, order by the DURABLE source game id (data-gameid — embeds creation
 * time, stable across reschedule) and number 0,1,2... Singleton groups get seq 0.
 *
 * Ordering by sourceGameId, not start_at, is what makes proof (c) hold: reordering
 * two rematches' times does NOT swap their keys. The residual risk is a full
 * REGENERATION (data-gameid itself churns) — the bounded tail Option A's matcher covers.
 * @returns {Map<any, number>} game id -> seq
 */
export function assignSequences(games) {
  const groups = new Map();
  for (const g of games || []) {
    const gk = [g.divisionId, teamPairKey(g.homeKey, g.awayKey), g.role].join('|');
    if (!groups.has(gk)) groups.set(gk, []);
    groups.get(gk).push(g);
  }
  const out = new Map();
  for (const arr of groups.values()) {
    arr.sort((a, b) => String(a.sourceGameId).localeCompare(String(b.sourceGameId)));
    arr.forEach((g, i) => out.set(g.id, arr.length > 1 ? i : 0));
  }
  return out;
}

/** Convenience: compute every game's full Layer-2 key (id -> key). Pure. */
export function keyAll(games) {
  const seqById = assignSequences(games);
  const out = new Map();
  for (const g of games || []) {
    out.set(g.id, stableGameKey({ divisionId: g.divisionId, homeKey: g.homeKey, awayKey: g.awayKey, role: g.role, seq: seqById.get(g.id) || 0 }));
  }
  return out;
}
