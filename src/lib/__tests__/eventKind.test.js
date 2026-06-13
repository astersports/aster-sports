import { describe, expect, it } from 'vitest';
import { eventKindLabel, eventKindVariant } from '../eventKind';

// Operator 2026-06-13: schedule cards must identify the KIND from
// event_type + the team's program_type. The label/variant pair is the
// one source both the pill text and its color read from.

const ev = (event_type, program_type, extra = {}) => ({
  event_type, teams: { program: program_type ? { program_type } : null }, ...extra,
});

describe('eventKindLabel', () => {
  it('competitive types read straight', () => {
    expect(eventKindLabel(ev('game', 'season'))).toBe('Game');
    expect(eventKindLabel(ev('tournament', 'season'))).toBe('Tournament');
  });
  it('skills_lab → Training; tryout event → Tryout', () => {
    expect(eventKindLabel(ev('skills_lab', 'season'))).toBe('Training');
    expect(eventKindLabel(ev('tryout', 'season'))).toBe('Tryout');
  });
  it('practice inherits the PROGRAM label', () => {
    expect(eventKindLabel(ev('practice', 'season'))).toBe('Practice');
    expect(eventKindLabel(ev('practice', 'camp'))).toBe('Camp');
    expect(eventKindLabel(ev('practice', 'clinic'))).toBe('Clinic');
    expect(eventKindLabel(ev('practice', 'tryout'))).toBe('Tryout');
    expect(eventKindLabel(ev('practice', 'evaluation'))).toBe('Evaluation');
  });
  it('scrimmage flag wins; missing program degrades to the event label', () => {
    expect(eventKindLabel(ev('game', 'season', { is_scrimmage: true }))).toBe('Scrimmage');
    expect(eventKindLabel(ev('practice', null))).toBe('Practice');
    expect(eventKindLabel(null)).toBe('Event');
  });
});

describe('eventKindVariant', () => {
  it('color families map to existing tokens', () => {
    expect(eventKindVariant(ev('game', 'season'))).toBe('accent');
    expect(eventKindVariant(ev('tournament', 'season'))).toBe('accent');
    expect(eventKindVariant(ev('skills_lab', 'season'))).toBe('academy');
    expect(eventKindVariant(ev('practice', 'tryout'))).toBe('warning');
    expect(eventKindVariant(ev('practice', 'evaluation'))).toBe('warning');
    expect(eventKindVariant(ev('practice', 'camp'))).toBe('info');
    expect(eventKindVariant(ev('practice', 'season'))).toBe('neutral');
    expect(eventKindVariant(ev('game', 'season', { is_scrimmage: true }))).toBe('neutral');
  });
});
