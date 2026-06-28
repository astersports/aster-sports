// Offline eval harness for the AI briefing drafter (scouting candidate A5).
// Locks the fact-fidelity + voice checker against a synthetic golden set. This
// is the enabling control the gated AI changes (A1 structured outputs, A2 model
// upgrade, A3 ingest fallback) must clear before promotion. Pure + deterministic
// — no model call, no IO.

import { describe, expect, it } from 'vitest';
import { BANNED_CONTEXT_TERMS, evaluateAiDraft, factsIndex, scoreGoldenSet } from '../aiDraftEval';
import { GOLDEN_CASES, RECAP_FACTS } from './_aiDraftEvalFixtures';

describe('aiDraftEval — golden set', () => {
  it('every golden case yields exactly its expected violation codes', () => {
    const results = scoreGoldenSet(GOLDEN_CASES);
    const failures = results.filter((r) => !r.pass)
      .map((r) => `  ${r.name}: got [${r.got}] want [${r.want}]`);
    expect(failures, `\n${failures.join('\n')}`).toEqual([]);
  });

  it('the clean recap passes with zero violations', () => {
    const clean = GOLDEN_CASES.find((c) => c.expect.length === 0);
    expect(evaluateAiDraft(clean.raw, clean.facts).ok).toBe(true);
  });
});

describe('aiDraftEval — factsIndex', () => {
  it('collects every number in the facts and lowercases the blob', () => {
    const idx = factsIndex(RECAP_FACTS);
    expect(idx.numbers).toEqual(new Set(['42', '38', '4', '17', '6', '2']));
    expect(idx.text).toContain('rye tigers');
  });

  it('accepts pre-built "label: value" lines too', () => {
    const idx = factsIndex(['final_score: 42-38', 'opponent: Rye Tigers']);
    expect(idx.numbers).toEqual(new Set(['42', '38']));
  });

  it('ignores null/empty fact values', () => {
    const idx = factsIndex({ a: 'venue 5', b: null, c: '   ' });
    expect(idx.numbers).toEqual(new Set(['5']));
  });
});

describe('aiDraftEval — evaluateAiDraft units', () => {
  it('grounded number passes, ungrounded number is flagged', () => {
    const facts = { final_score: '42-38' };
    const ok = JSON.stringify({ body: 'Won 42 to 38.', card_summary: '', facts_used: [], warnings: [] });
    const bad = JSON.stringify({ body: 'Won 99 to 38.', card_summary: '', facts_used: [], warnings: [] });
    expect(evaluateAiDraft(ok, facts).ok).toBe(true);
    expect(evaluateAiDraft(bad, facts).violations.map((v) => v.code)).toContain('fabricated_number');
  });

  it('a banned context term is allowed when the facts contain it', () => {
    const withPlayoff = { result: 'Win', note: 'playoff semifinal' };
    const raw = JSON.stringify({ body: 'A playoff win.', card_summary: '', facts_used: [], warnings: [] });
    expect(evaluateAiDraft(raw, withPlayoff).ok).toBe(true);
  });

  it('the same banned term is flagged when the facts do NOT contain it', () => {
    const raw = JSON.stringify({ body: 'A playoff win.', card_summary: '', facts_used: [], warnings: [] });
    const codes = evaluateAiDraft(raw, { result: 'Win' }).violations.map((v) => v.code);
    expect(codes).toContain('unsupported_context');
  });

  it('malformed JSON short-circuits to a single violation', () => {
    const v = evaluateAiDraft('not json at all', {});
    expect(v.ok).toBe(false);
    expect(v.violations).toHaveLength(1);
    expect(v.violations[0].code).toBe('malformed_json');
  });

  it('BANNED_CONTEXT_TERMS is non-empty and lowercase', () => {
    expect(BANNED_CONTEXT_TERMS.length).toBeGreaterThan(0);
    expect(BANNED_CONTEXT_TERMS.every((t) => t === t.toLowerCase())).toBe(true);
  });
});
