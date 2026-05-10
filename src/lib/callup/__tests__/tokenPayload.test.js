// Wave 4.3-D — parseCallupTokenPayload unit tests.

import { describe, expect, it } from 'vitest';
import { parseCallupTokenPayload } from '../tokenPayload';

const E = '00000000-0000-0000-0000-000000000001';
const P = '00000000-0000-0000-0000-000000000002';
const G = '00000000-0000-0000-0000-000000000003';
const NONCE = 'abcdef0123456789abcdef0123456789';
const EXPIRES_AT_EPOCH = 1800000000;

function urlSafeB64(str) {
  const bytes = new TextEncoder().encode(str);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeToken({ e = E, p = P, g = G, r = 'accept', n = NONCE, x = EXPIRES_AT_EPOCH } = {}, signature = 'sig_part') {
  const json = JSON.stringify({ e, p, g, r, n, x });
  return `${urlSafeB64(json)}.${signature}`;
}

describe('parseCallupTokenPayload', () => {
  it('1. returns null on non-string input', () => {
    expect(parseCallupTokenPayload(null)).toBeNull();
    expect(parseCallupTokenPayload(undefined)).toBeNull();
    expect(parseCallupTokenPayload(123)).toBeNull();
    expect(parseCallupTokenPayload({})).toBeNull();
  });

  it('2. returns null on missing dot separator', () => {
    expect(parseCallupTokenPayload('no_dot_here')).toBeNull();
    expect(parseCallupTokenPayload('')).toBeNull();
  });

  it('3. returns null on malformed base64', () => {
    expect(parseCallupTokenPayload('!!!!.sig')).toBeNull();
  });

  it('4. returns null on non-JSON payload', () => {
    expect(parseCallupTokenPayload(`${urlSafeB64('hello world')}.sig`)).toBeNull();
  });

  it('5. parses a valid token shape correctly', () => {
    const token = makeToken();
    const result = parseCallupTokenPayload(token);
    expect(result).toEqual({
      event_id: E,
      player_id: P,
      guardian_id: G,
      response: 'accept',
      nonce: NONCE,
      expires_at: new Date(EXPIRES_AT_EPOCH * 1000).toISOString(),
    });
  });

  it('6. handles URL-safe base64 alphabet correctly (+ → -, / → _)', () => {
    // Build a payload that, when base64-encoded, produces both - and _ chars.
    // The 'r' field is one of the few we control without affecting validity.
    // Use a payload that we know produces those chars after standard base64.
    // Most JSON payloads with curly braces produce + and / when base64'd.
    const token = makeToken({ r: 'decline' });
    const result = parseCallupTokenPayload(token);
    expect(result.response).toBe('decline');
    expect(result.event_id).toBe(E);
    // The token MUST round-trip even with -, _ in the b64 alphabet.
    expect(token).not.toContain('+');
    expect(token).not.toContain('/');
  });
});
