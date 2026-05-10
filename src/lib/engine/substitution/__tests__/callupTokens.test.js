// Wave 4.2-A-8c — substituteCallupTokens unit tests.

import { describe, expect, it } from 'vitest';
import { substituteCallupTokens } from '../callupTokens';

const placeholders = { accept: '{{callup_accept_url}}', decline: '{{callup_decline_url}}' };
const callupSection = (playerId) => ({ kind: 'callup_response', player_id: playerId, window_label: 'Respond by noon', deadline_at: '2026-05-11T16:00:00Z', callup_token_placeholders: placeholders });
const tokensFor = (playerId) => ({ accept: `https://x.test/?p=${playerId}&a=accept`, decline: `https://x.test/?p=${playerId}&a=decline` });

describe('substituteCallupTokens', () => {
  it('1. pure: input array unchanged; returns a new array', () => {
    const input = [callupSection('p1')];
    const inputClone = JSON.parse(JSON.stringify(input));
    const out = substituteCallupTokens(input, { p1: tokensFor('p1') });
    expect(input).toEqual(inputClone);
    expect(out).not.toBe(input);
  });

  it('2. replaces placeholders with urls in callup_response section', () => {
    const out = substituteCallupTokens([callupSection('p1')], { p1: tokensFor('p1') });
    expect(out[0].callup_token_urls).toEqual(tokensFor('p1'));
    expect(out[0].callup_token_placeholders).toBeUndefined();
  });

  it('3. other sections passed through unchanged', () => {
    const header = { kind: 'header', headline: 'X' };
    const footer = { kind: 'footer', orgName: 'Y' };
    const sections = [header, callupSection('p1'), footer];
    const out = substituteCallupTokens(sections, { p1: tokensFor('p1') });
    expect(out[0]).toBe(header);
    expect(out[2]).toBe(footer);
  });

  it('4. throws on bad input shapes', () => {
    expect(() => substituteCallupTokens('not array', { p1: tokensFor('p1') })).toThrow(TypeError);
    expect(() => substituteCallupTokens([], null)).toThrow(TypeError);
  });

  it('5. throws on missing player_id key', () => {
    expect(() => substituteCallupTokens([callupSection('pX')], { pY: tokensFor('pY') }))
      .toThrow(/no token entry for player_id pX/);
  });

  it('6. throws on non-string URL value', () => {
    expect(() => substituteCallupTokens([callupSection('p1')], { p1: { accept: 'ok', decline: null } }))
      .toThrow(/decline.*must be a string/);
  });
});
