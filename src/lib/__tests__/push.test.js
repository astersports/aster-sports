// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { isPushSupported, subscriptionToRow, urlBase64ToUint8Array } from '../push';

describe('urlBase64ToUint8Array', () => {
  it('decodes base64url to bytes', () => {
    expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3]);
  });
  it('handles url-safe chars (- _) + missing padding', () => {
    const out = urlBase64ToUint8Array('a-b_');
    expect(out).toBeInstanceOf(Uint8Array);
    expect(Array.from(out)).toEqual([107, 230, 255]);
  });
});

describe('subscriptionToRow', () => {
  it('maps a PushSubscription JSON to a push_subscriptions row', () => {
    const sub = { toJSON: () => ({ endpoint: 'https://push/abc', keys: { p256dh: 'P', auth: 'A' } }) };
    const row = subscriptionToRow(sub, { userId: 'u1', orgId: 'o1' });
    expect(row).toMatchObject({ user_id: 'u1', org_id: 'o1', endpoint: 'https://push/abc', p256dh: 'P', auth_key: 'A' });
    expect(row.last_used_at).toBeTruthy();
  });
  it('handles a plain object (no toJSON) + null org', () => {
    const row = subscriptionToRow({ endpoint: 'e', keys: { p256dh: 'p', auth: 'a' } }, { userId: 'u', orgId: null });
    expect(row.org_id).toBeNull();
    expect(row.endpoint).toBe('e');
    expect(row.auth_key).toBe('a');
  });
});

describe('isPushSupported', () => {
  it('false when VITE_VAPID_PUBLIC_KEY is unset (dormant until the env var lands)', () => {
    expect(isPushSupported()).toBe(false);
  });
});
