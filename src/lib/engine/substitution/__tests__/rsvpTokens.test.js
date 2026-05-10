// Wave 4.2-A-8b-b — substituteRsvpTokens unit tests.

import { describe, expect, it } from 'vitest';
import { substituteRsvpTokens } from '../rsvpTokens';

const placeholders = { going: '{{rsvp_going_url}}', maybe: '{{rsvp_maybe_url}}', not_going: '{{rsvp_not_going_url}}' };
const rsvpSection = (playerId, kid) => ({ kind: 'rsvp_request', kid_first_name: kid, player_id: playerId, team_name: 'X', team_color: '#000', event_label: 'Skills', urgency_phrase: 'Today', rsvp_token_placeholders: placeholders });
const tokensFor = (playerId) => ({ going: `https://example.test/?p=${playerId}&a=going`, maybe: `https://example.test/?p=${playerId}&a=maybe`, not_going: `https://example.test/?p=${playerId}&a=not_going` });

describe('substituteRsvpTokens', () => {
  it('1. pure: input array unchanged; returns a new array', () => {
    const input = [rsvpSection('p1', 'Hudson')];
    const inputClone = JSON.parse(JSON.stringify(input));
    const out = substituteRsvpTokens(input, { p1: tokensFor('p1') });
    expect(input).toEqual(inputClone);
    expect(out).not.toBe(input);
  });

  it('2. single-kid family: rsvp_token_urls populated, placeholders removed', () => {
    const out = substituteRsvpTokens([rsvpSection('p1', 'Hudson')], { p1: tokensFor('p1') });
    expect(out[0].rsvp_token_urls).toEqual(tokensFor('p1'));
    expect(out[0].rsvp_token_placeholders).toBeUndefined();
  });

  it('3. multi-kid family: each rsvp_request gets URLs for its own player_id', () => {
    const sections = [rsvpSection('p1', 'Aubtin'), rsvpSection('p2', 'Frankie'), rsvpSection('p3', 'Hudson')];
    const map = { p1: tokensFor('p1'), p2: tokensFor('p2'), p3: tokensFor('p3') };
    const out = substituteRsvpTokens(sections, map);
    expect(out.map((s) => s.rsvp_token_urls.going)).toEqual([tokensFor('p1').going, tokensFor('p2').going, tokensFor('p3').going]);
  });

  it('4. other sections passed through unchanged', () => {
    const header = { kind: 'header', headline: 'X' };
    const footer = { kind: 'footer', orgName: 'Y' };
    const sections = [header, rsvpSection('p1', 'Hudson'), footer];
    const out = substituteRsvpTokens(sections, { p1: tokensFor('p1') });
    expect(out[0]).toBe(header);
    expect(out[2]).toBe(footer);
  });

  it('5. throws on bad input shapes', () => {
    expect(() => substituteRsvpTokens('not array', { p1: tokensFor('p1') })).toThrow(TypeError);
    expect(() => substituteRsvpTokens([], null)).toThrow(TypeError);
  });

  it('6. throws on missing player_id key or non-string URL value', () => {
    const section = rsvpSection('pX', 'Hudson');
    expect(() => substituteRsvpTokens([section], { pY: tokensFor('pY') })).toThrow(/no token entry for player_id pX/);
    expect(() => substituteRsvpTokens([section], { pX: { going: 'ok', maybe: null, not_going: 'ok' } })).toThrow(/maybe.*must be a string/);
  });
});
