import { describe, expect, it } from 'vitest';
import { deliveryRollup } from '../deliveryRollup';

describe('deliveryRollup (SEE)', () => {
  it('empty input → all zeros', () => {
    const z = { total: 0, delivered: 0, opened: 0, bounced: 0, complained: 0 };
    expect(deliveryRollup([])).toEqual(z);
    expect(deliveryRollup()).toEqual(z);
  });

  it('counts each provider signal off the *_at columns', () => {
    const rows = [
      { delivered_at: 't', opened_at: 't' },     // delivered + opened
      { delivered_at: 't' },                      // delivered
      { bounced_at: 't' },                        // bounced
      { complained_at: 't', delivered_at: 't' },  // delivered + complained
      {},                                         // no signal (queued/sent)
    ];
    expect(deliveryRollup(rows)).toEqual({ total: 5, delivered: 3, opened: 1, bounced: 1, complained: 1 });
  });

  it('GUARD (E3 fix): bounce is keyed on bounced_at, NOT the phantom bounce_reason', () => {
    // the prior inline count used bounce_reason, which is not a column. A row
    // carrying only bounce_reason must NOT register as bounced.
    const rows = [{ bounce_reason: 'mailbox full' }, { bounced_at: 't' }];
    expect(deliveryRollup(rows).bounced).toBe(1);
  });
});
