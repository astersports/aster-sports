// Wave 5 PR 2 — Levenshtein-based opponent matching for the parser's
// bonus opponent_id enrichment + dedup natural-key match. Per scope
// read flagged-item #1: opponent storage is text-PRIMARY (events.opponent
// column); opponent_id is BONUS, never blocks commit. Threshold = 3
// per Frank's pressure-test (no Jaro-Winkler hedge).

const FUZZY_THRESHOLD = 3;

export function levenshtein(a, b) {
  const s = String(a || '').toLowerCase();
  const t = String(b || '').toLowerCase();
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  let prev = Array(t.length + 1).fill(0).map((_, i) => i);
  for (let i = 0; i < s.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < t.length; j++) {
      const cost = s[i] === t[j] ? 0 : 1;
      curr.push(Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost));
    }
    prev = curr;
  }
  return prev[t.length];
}

export function fuzzyOpponentMatch(parsedString, candidateString) {
  if (!parsedString || !candidateString) return false;
  // Length-relative tolerance: short names (<6 chars) must match exactly so a
  // 3-edit budget can't false-match them; longer names allow up to
  // min(FUZZY_THRESHOLD, floor(len/4)) edits. Length is the shorter of the two.
  const len = Math.min(String(parsedString).length, String(candidateString).length);
  const tolerance = len < 6 ? 0 : Math.min(FUZZY_THRESHOLD, Math.floor(len / 4));
  return levenshtein(parsedString, candidateString) <= tolerance;
}
