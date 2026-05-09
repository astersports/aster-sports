import { describe, expect, it } from 'vitest';
import { composerReducer, INITIAL_STATE } from '../composerReducer';

const FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('composerReducer — wave 3.17 SET_SCHEDULE', () => {
  it('schedule_for_later mode + scheduledFor stored together', () => {
    const s = composerReducer(INITIAL_STATE, {
      type: 'SET_SCHEDULE',
      payload: { mode: 'schedule_for_later', scheduledFor: FUTURE },
    });
    expect(s.send_mode).toBe('scheduled');
    expect(s.scheduled_for).toBe(FUTURE);
  });

  it('flipping back to send_now clears scheduled_for', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'SET_SCHEDULE', payload: { mode: 'schedule_for_later', scheduledFor: FUTURE } });
    const b = composerReducer(a, { type: 'SET_SCHEDULE', payload: { mode: 'send_now' } });
    expect(b.send_mode).toBe('now');
    expect(b.scheduled_for).toBeNull();
  });

  it('schedule_for_later with no scheduledFor leaves scheduled_for null', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'SET_SCHEDULE', payload: { mode: 'schedule_for_later' } });
    expect(s.send_mode).toBe('scheduled');
    expect(s.scheduled_for).toBeNull();
  });

  it('SET_SCHEDULE preserves other state (kind, body, audience_type)', () => {
    const seeded = { ...INITIAL_STATE, kind: 'announcement', body: { headline: 'h' }, audience_type: 'team' };
    const s = composerReducer(seeded, { type: 'SET_SCHEDULE', payload: { mode: 'schedule_for_later', scheduledFor: FUTURE } });
    expect(s.kind).toBe('announcement');
    expect(s.body).toEqual({ headline: 'h' });
    expect(s.audience_type).toBe('team');
  });
});
