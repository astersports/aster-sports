import { describe, expect, it } from 'vitest';
import { anchorTitle, audiencePill, bucketFeed, summaryLine } from '../radarFeedHelpers';

const NOW = new Date('2026-06-04T12:00:00Z').getTime();
const iso = (deltaMs) => new Date(NOW + deltaMs).toISOString();
const DAY = 86400000;

describe('bucketFeed', () => {
  it('live drafts split by origin: created_by_trigger -> ready, null -> drafts; expired excluded (#678)', () => {
    const rows = [
      { id: 'a', status: 'draft', expires_at: iso(DAY), created_by_trigger: 't1' },  // live proposal -> ready
      { id: 'b', status: 'draft', expires_at: iso(-DAY), created_by_trigger: 't2' }, // expired -> out
      { id: 'c', status: 'draft', expires_at: null, created_by_trigger: 't3' },      // proposal, no expiry -> ready
      { id: 'd', status: 'draft', expires_at: null, created_by_trigger: null },      // user WIP -> drafts
      { id: 'e', status: 'draft', expires_at: iso(DAY) },                            // user WIP (no field) -> drafts
    ];
    const { ready, drafts } = bucketFeed(rows, NOW);
    expect(ready.map((r) => r.id)).toEqual(['a', 'c']);
    expect(drafts.map((r) => r.id)).toEqual(['d', 'e']);
  });

  it('scheduled bucket + sent-within-7d bucket; older sent excluded', () => {
    const rows = [
      { id: 's', status: 'scheduled' },
      { id: 'recent', status: 'sent', sent_at: iso(-2 * DAY) },
      { id: 'old', status: 'sent', sent_at: iso(-10 * DAY) },
    ];
    const { scheduled, sent } = bucketFeed(rows, NOW);
    expect(scheduled.map((r) => r.id)).toEqual(['s']);
    expect(sent.map((r) => r.id)).toEqual(['recent']);
  });
});

describe('summaryLine — schedule_change is END-AWARE', () => {
  const ctx = {
    eventsById: { 'e-1': { title: '10U Black Practice' } },
    change: {
      before_jsonb: { start_at: '2026-06-06T22:00:00Z', end_at: '2026-06-06T22:30:00Z' },
      after_jsonb: { start_at: '2026-06-06T22:00:00Z', end_at: '2026-06-07T00:30:00Z' },
    },
  };
  it('shows both the new end and the old end (never start-only)', () => {
    const text = summaryLine({ kind: 'schedule_change', anchor_kind: 'event', anchor_id: 'e-1' }, ctx);
    // same start, different end — both ends must appear so the change is visible
    expect(text).toMatch(/6:00/);     // start
    expect(text).toMatch(/8:30/);     // new end (00:30Z -> 8:30 PM ET)
    expect(text).toMatch(/was/);      // the before-clause
    expect(text).toMatch(/6:30/);     // old end (22:30Z -> 6:30 PM ET)
  });
});

describe('audiencePill', () => {
  it('formats "<n> families · <anchor>" with singular/plural', () => {
    expect(audiencePill({ recipient_count: 12, anchor_kind: 'org' })).toBe('12 families · All program');
    const ctx = { eventsById: { e: { title: '10U Black Practice' } } };
    expect(audiencePill({ recipient_count: 1, anchor_kind: 'event', anchor_id: 'e' }, ctx)).toBe('1 family · 10U Black Practice');
    expect(audiencePill({ recipient_count: null, anchor_kind: 'org' })).toMatch(/^—/);
  });
});

describe('anchorTitle', () => {
  it('resolves event / tournament / multi_event / org', () => {
    const ctx = { eventsById: { e: { title: 'Game' } }, tournamentsById: { t: { name: 'Nationals' } } };
    expect(anchorTitle({ anchor_kind: 'event', anchor_id: 'e' }, ctx)).toBe('Game');
    expect(anchorTitle({ anchor_kind: 'tournament', anchor_id: 't' }, ctx)).toBe('Nationals');
    expect(anchorTitle({ anchor_kind: 'multi_event' }, ctx)).toBe('Selected games');
    expect(anchorTitle({ anchor_kind: 'org' }, ctx)).toBe('All program');
  });
});
