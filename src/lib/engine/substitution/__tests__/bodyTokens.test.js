// PR-D — substituteBodyTokens + splitBodyTokens unit tests.

import { describe, expect, it } from 'vitest';
import { BODY_TOKENS, splitBodyTokens, substituteBodyTokens, TOKEN_PLACEHOLDER } from '../bodyTokens';

describe('BODY_TOKENS', () => {
  it('has exactly the 3 tokens with a real URL source (latest_briefing absent)', () => {
    expect(Object.keys(BODY_TOKENS).sort()).toEqual(['directions', 'rsvp', 'schedule']);
    expect(BODY_TOKENS.latest_briefing).toBeUndefined();
  });
});

describe('splitBodyTokens', () => {
  it('segments text + known token placeholders in order', () => {
    const segs = splitBodyTokens('Quick one. {{token:rsvp_url}} so we have a count.');
    expect(segs).toEqual([
      { text: 'Quick one. ' },
      { token: 'rsvp' },
      { text: ' so we have a count.' },
    ]);
  });
  it('leaves an UNKNOWN token kind as literal text (never fabricated)', () => {
    const segs = splitBodyTokens('See {{token:latest_briefing_url}} now');
    expect(segs).toEqual([{ text: 'See ' }, { text: '{{token:latest_briefing_url}}' }, { text: ' now' }]);
  });
  it('handles plain text with no tokens', () => {
    expect(splitBodyTokens('no tokens here')).toEqual([{ text: 'no tokens here' }]);
  });
});

describe('substituteBodyTokens (AP #29)', () => {
  const section = () => ({ kind: 'stats_narrative', body: 'x {{token:schedule_url}}', body_token_placeholders: ['schedule'] });

  it('is pure: input unchanged, returns new array', () => {
    const input = [section()];
    const clone = JSON.parse(JSON.stringify(input));
    const out = substituteBodyTokens(input, { schedule: 'https://a.test/schedule/1' });
    expect(input).toEqual(clone);
    expect(out).not.toBe(input);
  });

  it('renames placeholders -> body_token_urls with resolved url', () => {
    const out = substituteBodyTokens([section()], { schedule: 'https://a.test/schedule/1' });
    expect(out[0].body_token_urls).toEqual({ schedule: 'https://a.test/schedule/1' });
    expect(out[0].body_token_placeholders).toBeUndefined();
  });

  it('passes through sections without placeholders unchanged', () => {
    const header = { kind: 'header', headline: 'X' };
    const out = substituteBodyTokens([header], {});
    expect(out[0]).toBe(header);
  });

  it('throws on missing url for a declared placeholder', () => {
    expect(() => substituteBodyTokens([section()], {})).toThrow(/schedule.*non-empty URL/);
  });

  it('throws on unknown token kind in placeholders', () => {
    const bad = { kind: 'stats_narrative', body: 'x', body_token_placeholders: ['latest_briefing'] };
    expect(() => substituteBodyTokens([bad], {})).toThrow(/unknown token kind/);
  });

  it('throws on bad input shapes', () => {
    expect(() => substituteBodyTokens('not array', {})).toThrow(TypeError);
    expect(() => substituteBodyTokens([], null)).toThrow(TypeError);
  });

  it('TOKEN_PLACEHOLDER builds the canonical literal', () => {
    expect(TOKEN_PLACEHOLDER('directions')).toBe('{{token:directions_url}}');
  });
});
