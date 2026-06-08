// Pure-helper coverage for the briefing-ai-draft edge fn (AP #30 source-of-truth
// mirror). Locks prompt assembly, fence-strip, em-dash guard, and the response
// parse into the locked { body, card_summary, facts_used, warnings } shape.

import { describe, expect, it } from 'vitest';
import {
  AI_DRAFT_KINDS, ANCHORED_KINDS, audienceFraming, buildAiDraftUserPrompt, factsToLines,
  FREE_FORM_KINDS, parseAiDraftOutput, stripEmDashes, stripFences,
} from '../aiDraftPrompt';

describe('aiDraftPrompt helpers', () => {
  it('kind sets: free-form + anchored compose the v1 supported set', () => {
    expect(FREE_FORM_KINDS).toEqual(['announcement', 'custom_message']);
    expect(ANCHORED_KINDS).toEqual(['game_recap', 'games_recap', 'weekly_digest', 'tournament_recap', 'tournament_prelim']);
    expect(AI_DRAFT_KINDS).toEqual([...FREE_FORM_KINDS, ...ANCHORED_KINDS]);
  });

  it('audienceFraming: team name vs all-families', () => {
    expect(audienceFraming('11U Girls')).toBe('11U Girls families');
    expect(audienceFraming(null)).toBe('all families');
    expect(audienceFraming('   ')).toBe('all families');
  });

  it('factsToLines: flattens, drops empties, trims', () => {
    expect(factsToLines({ a: 'x', b: '', c: null, d: ' y ' })).toEqual(['a: x', 'd: y']);
    expect(factsToLines(null)).toEqual([]);
  });

  it('buildAiDraftUserPrompt: includes gist + facts + JSON instruction', () => {
    const p = buildAiDraftUserPrompt({ kind: 'custom_message', framing: 'all families', factLines: ['Coach: Kenny'], gist: 'practice moved' });
    expect(p).toContain('Draft a custom message briefing for all families.');
    expect(p).toContain('What it needs to say: practice moved');
    expect(p).toContain('- Coach: Kenny');
    expect(p).toContain('minified JSON');
    expect(p).toContain('NO em dashes');
  });

  it('buildAiDraftUserPrompt: narrativeOnly weaves data in, no baked signature, drops the full-template instruction', () => {
    const p = buildAiDraftUserPrompt({ kind: 'game_recap', framing: '11U Girls families', factLines: ['Final: 42-38 (W)'], narrativeOnly: true });
    expect(p).toContain("Write ONLY the coach's voice narrative");
    expect(p).toContain('Weave the key facts');
    expect(p).toContain('narrative prose');
    expect(p).not.toContain('Follow the structure template');
    // Signature is the separate (off-by-default) signoff, never baked into the body.
    expect(p).not.toContain('then sign off by name');
    expect(p).toContain('Do NOT sign off by name');
  });

  it('buildAiDraftUserPrompt: full-template path also forbids a baked signature', () => {
    const p = buildAiDraftUserPrompt({ kind: 'announcement', framing: 'all families', factLines: [], gist: 'hi' });
    expect(p).toContain('Follow the structure template');
    expect(p).toContain('Do NOT sign off by name');
  });

  it('buildAiDraftUserPrompt: no-facts path forbids invention', () => {
    const p = buildAiDraftUserPrompt({ kind: 'announcement', framing: 'all families', factLines: [], gist: 'hi' });
    expect(p).toContain('do not invent specifics');
  });

  it('buildAiDraftUserPrompt: narrativeOnly scopes record/games to the recap window (no season-wrap)', () => {
    const p = buildAiDraftUserPrompt({ kind: 'games_recap', framing: '10U Blue families', factLines: ['Games: Fri 10U Blue 22-28 vs 6th Boro (L)'], narrativeOnly: true });
    expect(p).toContain("covers ONLY this briefing's games, not the full season");
    expect(p).toContain('first, last, or only game');
    expect(p).toContain("'time to breathe'");
    // Fix B: when a season-to-date fact IS supplied, the model may use it.
    expect(p).toContain("If a 'Season so far' fact is given");
  });

  it('buildAiDraftUserPrompt: hard rules forbid fabricated game context (FLAG 1)', () => {
    const recap = buildAiDraftUserPrompt({ kind: 'game_recap', framing: '10U Blue families', factLines: ['Final: 22-28 (L)'], narrativeOnly: true });
    const free = buildAiDraftUserPrompt({ kind: 'announcement', framing: 'all families', factLines: ['What: picture day'] });
    // Applies on BOTH paths (shared hard-rules tail).
    for (const p of [recap, free]) {
      expect(p).toContain('Do NOT assert game context you were not given');
      expect(p).toContain('opener, playoff, or first game');
      expect(p).toContain('within-game timeline');
    }
  });

  it('stripFences: removes ```json fences', () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripFences('{"a":1}')).toBe('{"a":1}');
  });

  it('stripEmDashes: maps em dash to colon (voice HARD DON\'T guard)', () => {
    expect(stripEmDashes('Schedule update — 11U Girls')).toBe('Schedule update: 11U Girls');
    expect(stripEmDashes('a—b')).toBe('a: b');
  });

  it('parseAiDraftOutput: parses the locked shape + applies em-dash guard', () => {
    const out = parseAiDraftOutput('```json\n{"body":"Game 3 — go get it.","card_summary":"W vs Eagles","facts_used":[{"k":"Record","v":"5-2"}],"warnings":["venue missing"]}\n```');
    expect(out).toEqual({
      body: 'Game 3: go get it.',
      card_summary: 'W vs Eagles',
      facts_used: [{ k: 'Record', v: '5-2' }],
      warnings: ['venue missing'],
    });
  });

  it('parseAiDraftOutput: defaults missing optional keys', () => {
    const out = parseAiDraftOutput('{"body":"hello"}');
    expect(out).toEqual({ body: 'hello', card_summary: '', facts_used: [], warnings: [] });
  });

  it('parseAiDraftOutput: throws on non-JSON', () => {
    expect(() => parseAiDraftOutput('not json at all')).toThrow('non-JSON');
  });

  it('parseAiDraftOutput: throws on missing body', () => {
    expect(() => parseAiDraftOutput('{"card_summary":"x"}')).toThrow('missing body');
  });
});
