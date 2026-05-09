import { describe, expect, it } from 'vitest';
import { computeFlags } from '../useEventTimeWindow';

const NOW = new Date('2026-05-09T16:00:00Z').getTime();

describe('useEventTimeWindow.computeFlags', () => {
  it('isUpcoming when start is in the future and outside the 4h window', () => {
    const event = { start_at: new Date(NOW + 24 * 3600 * 1000).toISOString(), end_at: new Date(NOW + 25 * 3600 * 1000).toISOString() };
    const f = computeFlags(event, NOW);
    expect(f.isUpcoming).toBe(true);
    expect(f.isGameDay).toBe(false);
  });

  it('isGameDay when within 4h before start', () => {
    const event = { start_at: new Date(NOW + 2 * 3600 * 1000).toISOString(), end_at: new Date(NOW + 3 * 3600 * 1000).toISOString() };
    const f = computeFlags(event, NOW);
    expect(f.isGameDay).toBe(true);
    expect(f.isUpcoming).toBe(true);
    expect(f.isLive).toBe(false);
  });

  it('isLive when between start and end', () => {
    const event = { start_at: new Date(NOW - 30 * 60 * 1000).toISOString(), end_at: new Date(NOW + 30 * 60 * 1000).toISOString() };
    const f = computeFlags(event, NOW);
    expect(f.isLive).toBe(true);
    expect(f.isGameDay).toBe(true);
    expect(f.isPast).toBe(false);
  });

  it('isPast + still isGameDay within 3h after end', () => {
    const event = { start_at: new Date(NOW - 5 * 3600 * 1000).toISOString(), end_at: new Date(NOW - 60 * 60 * 1000).toISOString() };
    const f = computeFlags(event, NOW);
    expect(f.isPast).toBe(true);
    expect(f.isGameDay).toBe(true);
  });

  it('outside the 3h post-end window: not gameDay', () => {
    const event = { start_at: new Date(NOW - 12 * 3600 * 1000).toISOString(), end_at: new Date(NOW - 8 * 3600 * 1000).toISOString() };
    const f = computeFlags(event, NOW);
    expect(f.isGameDay).toBe(false);
    expect(f.isPast).toBe(true);
  });

  it('default 60min duration when end_at missing', () => {
    const event = { start_at: new Date(NOW - 30 * 60 * 1000).toISOString() };
    const f = computeFlags(event, NOW);
    expect(f.isLive).toBe(true);
  });

  it('returns null timeToStart when event has no start_at', () => {
    const f = computeFlags({}, NOW);
    expect(f.timeToStart).toBeNull();
    expect(f.isGameDay).toBe(false);
  });
});
