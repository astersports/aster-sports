import { describe, expect, it } from 'vitest';
import { EVENT_DEFAULT_DURATION_MS, eventEnd, eventTimeState, isRsvpOpen } from '../eventWindows';

// SD-2 spine contract (SCHEDULE_L99_BUILD_SPEC §1.1 + §8 PR-A' gates).
// Three states only; NULL end_at tolerated via the ONE 2h constant.

const NOW = new Date('2026-06-12T16:00:00Z').getTime();
const iso = (offsetMs) => new Date(NOW + offsetMs).toISOString();
const H = 60 * 60 * 1000;

describe('eventEnd', () => {
  it('returns end_at verbatim when present', () => {
    const e = { start_at: iso(-3 * H), end_at: iso(-1 * H) };
    expect(eventEnd(e)).toBe(e.end_at);
  });
  it('falls back to start + 2h when end_at is NULL (DB-8 tolerance)', () => {
    const e = { start_at: iso(0), end_at: null };
    expect(new Date(eventEnd(e)).getTime()).toBe(NOW + EVENT_DEFAULT_DURATION_MS);
    expect(EVENT_DEFAULT_DURATION_MS).toBe(2 * H);
  });
});

describe('eventTimeState — the three-state contract', () => {
  it('upcoming before start', () => {
    expect(eventTimeState({ start_at: iso(1 * H), end_at: iso(2 * H) }, NOW)).toBe('upcoming');
  });
  it('happening_now between start and end (the mid-game-into-Past bug, §8 gate)', () => {
    expect(eventTimeState({ start_at: iso(-1 * H), end_at: iso(1 * H) }, NOW)).toBe('happening_now');
  });
  it('happening_now exactly at start and exactly at end (inclusive bounds)', () => {
    expect(eventTimeState({ start_at: iso(0), end_at: iso(1 * H) }, NOW)).toBe('happening_now');
    expect(eventTimeState({ start_at: iso(-1 * H), end_at: iso(0) }, NOW)).toBe('happening_now');
  });
  it('completed after end', () => {
    expect(eventTimeState({ start_at: iso(-3 * H), end_at: iso(-1 * H) }, NOW)).toBe('completed');
  });
  it('NULL end_at + started >2h ago resolves completed (§8 gate — the 5 legacy NULL-end rows gray out)', () => {
    expect(eventTimeState({ start_at: iso(-2 * H - 60000), end_at: null }, NOW)).toBe('completed');
  });
  it('NULL end_at + started <2h ago is still happening_now', () => {
    expect(eventTimeState({ start_at: iso(-1 * H), end_at: null }, NOW)).toBe('happening_now');
  });
});

describe('isRsvpOpen (SD-11)', () => {
  it('open strictly before start, closed exactly at start', () => {
    expect(isRsvpOpen(iso(1), NOW)).toBe(true);
    expect(isRsvpOpen(iso(0), NOW)).toBe(false);
    expect(isRsvpOpen(iso(-1), NOW)).toBe(false);
  });
});
