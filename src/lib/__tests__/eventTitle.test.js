// Unit tests for formatEventTitle + formatEventTitleString.
// Locks the Cluster 3 contract: computed from opponent + event_type +
// home_away, never echoes free-text event.title.

import { describe, expect, it } from 'vitest';
import { formatEventTitle, formatEventTitleString } from '../eventTitle';

describe('formatEventTitle', () => {
  it('returns vs. {opponent} for home game with opponent', () => {
    expect(formatEventTitle({ event_type: 'game', opponent: 'Holy Family', home_away: 'home' }))
      .toEqual({ prefix: 'vs. ', body: 'Holy Family' });
  });

  it('returns @ {opponent} for away game', () => {
    expect(formatEventTitle({ event_type: 'game', opponent: 'Sky Gym Elite', home_away: 'away' }))
      .toEqual({ prefix: '@ ', body: 'Sky Gym Elite' });
  });

  it('treats neutral + tbd home_away as vs.', () => {
    expect(formatEventTitle({ event_type: 'game', opponent: 'Tornadoes', home_away: 'neutral' }))
      .toEqual({ prefix: 'vs. ', body: 'Tornadoes' });
    expect(formatEventTitle({ event_type: 'tournament', opponent: 'Heat', home_away: 'tbd' }))
      .toEqual({ prefix: 'vs. ', body: 'Heat' });
  });

  it('returns typeLabel for non-game event types', () => {
    expect(formatEventTitle({ event_type: 'practice' }))
      .toEqual({ prefix: '', body: 'Practice' });
    expect(formatEventTitle({ event_type: 'skills_lab' }))
      .toEqual({ prefix: '', body: 'Skills Lab' });
  });

  it('returns typeLabel for game without opponent', () => {
    expect(formatEventTitle({ event_type: 'game', home_away: 'home' }))
      .toEqual({ prefix: '', body: 'Game' });
  });

  it('ignores free-text event.title (Cluster 3.1 doctrine)', () => {
    // Production examples that should NOT surface as titles
    expect(formatEventTitle({ event_type: 'game', opponent: 'Holy Family', home_away: 'home', title: 'vs. 9U Boys Game' }))
      .toEqual({ prefix: 'vs. ', body: 'Holy Family' });
    expect(formatEventTitle({ event_type: 'practice', title: '10U Blue · 6th Boro 4AB · May Reschedule' }))
      .toEqual({ prefix: '', body: 'Practice' });
  });

  it('handles null / undefined event gracefully', () => {
    expect(formatEventTitle(null)).toEqual({ prefix: '', body: '' });
    expect(formatEventTitle(undefined)).toEqual({ prefix: '', body: '' });
  });

  it('falls back to event_type string when type is unknown', () => {
    expect(formatEventTitle({ event_type: 'custom_type' }))
      .toEqual({ prefix: '', body: 'custom_type' });
  });

  it('returns Event for missing event_type', () => {
    expect(formatEventTitle({})).toEqual({ prefix: '', body: 'Event' });
  });
});

describe('formatEventTitleString', () => {
  it('concatenates prefix + body', () => {
    expect(formatEventTitleString({ event_type: 'game', opponent: 'Holy Family', home_away: 'home' }))
      .toBe('vs. Holy Family');
    expect(formatEventTitleString({ event_type: 'tournament', opponent: 'Heat', home_away: 'away' }))
      .toBe('@ Heat');
    expect(formatEventTitleString({ event_type: 'practice' }))
      .toBe('Practice');
  });
});
