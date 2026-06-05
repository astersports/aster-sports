import { describe, expect, it } from 'vitest';
import {
  deriveChipLabel,
  isAudienceLocked,
  lockedReasonFor,
  modesForKind,
  smartDefaultFor,
} from '../audienceModes';
import { KIND_METADATA } from '../kindMetadata';

// Audience one-control fix (item 1a) — locks the per-kind valid-mode map
// + smart default + locked detection so the UI refactor can't silently
// drift from the preserved send-side audience semantics.

const types = (kind) => modesForKind(kind).map((m) => m.type);

describe('audienceModes — smart default per kind', () => {
  it('inherits KIND_METADATA.defaultAudienceType for non-overridden kinds', () => {
    expect(smartDefaultFor('announcement')).toBe('org_all');
    expect(smartDefaultFor('weekly_digest')).toBe('org_all');
    expect(smartDefaultFor('coach_roundup')).toBe('coach_self');
    expect(smartDefaultFor('tournament_prelim')).toBe('tournament_attendees');
    expect(smartDefaultFor('game_recap')).toBe('event_attendees');
  });

  it('family_guide smart default is ALL FAMILIES (org_all) — confirmed item 1a', () => {
    // KIND_METADATA keeps family_specific (resolver keys off parent_user_id;
    // audience_type is decorative for this kind) but the chip shows org_all.
    expect(KIND_METADATA.family_guide.defaultAudienceType).toBe('family_specific');
    expect(smartDefaultFor('family_guide')).toBe('org_all');
  });
});

describe('audienceModes — locked kinds', () => {
  it('flags the three audienceLocked kinds as locked', () => {
    expect(isAudienceLocked('schedule_change')).toBe(true);
    expect(isAudienceLocked('games_recap')).toBe(true);
    expect(isAudienceLocked('academy_callup_notice')).toBe(true);
  });

  it('does NOT lock kinds without audienceLocked (incl. rsvp_nudge)', () => {
    expect(isAudienceLocked('rsvp_nudge')).toBe(false);
    expect(isAudienceLocked('announcement')).toBe(false);
    expect(isAudienceLocked('family_guide')).toBe(false);
  });

  it('locked kinds expose exactly one mode — their derived default', () => {
    expect(types('schedule_change')).toEqual(['event_attendees']);
    expect(types('games_recap')).toEqual(['multi_event_attendees']);
    expect(types('academy_callup_notice')).toEqual(['player_specific']);
  });

  it('gives each locked kind a one-line reason', () => {
    expect(lockedReasonFor('games_recap')).toMatch(/games/i);
    expect(lockedReasonFor('schedule_change')).toMatch(/event/i);
    expect(lockedReasonFor('academy_callup_notice')).toMatch(/player/i);
  });
});

describe('audienceModes — valid modes per kind (derived from prior picker)', () => {
  it('weekly_digest → org_all / team / multi_team', () => {
    expect(types('weekly_digest').sort()).toEqual(['multi_team', 'org_all', 'team']);
  });

  it('announcement → team / org_all', () => {
    expect(types('announcement').sort()).toEqual(['org_all', 'team']);
  });

  it('game_recap / rsvp_nudge → event_attendees / team', () => {
    expect(types('game_recap').sort()).toEqual(['event_attendees', 'team']);
    expect(types('rsvp_nudge').sort()).toEqual(['event_attendees', 'team']);
  });

  it('tournament kinds → tournament_attendees only', () => {
    expect(types('tournament_prelim')).toEqual(['tournament_attendees']);
    expect(types('tournament_recap')).toEqual(['tournament_attendees']);
  });

  it('coach_roundup prepends coach_self ahead of all modes', () => {
    expect(types('coach_roundup')[0]).toBe('coach_self');
    expect(types('coach_roundup')).toContain('org_all');
  });

  it('family_guide does not prepend family_specific (default overridden to org_all)', () => {
    const fg = types('family_guide');
    expect(fg).not.toContain('family_specific');
    expect(fg).toContain('org_all');
  });

  it('custom_message excludes player_specific', () => {
    expect(types('custom_message')).not.toContain('player_specific');
    expect(types('custom_message')).toContain('org_all');
  });
});

describe('audienceModes — deriveChipLabel', () => {
  const teamsById = new Map([['t1', { name: '10U Black' }], ['t2', { name: '11U Girls' }]]);

  it('org_all → All families', () => {
    expect(deriveChipLabel('org_all', null, teamsById)).toBe('All families');
  });

  it('team resolves the team name (new team_ids shape + legacy team_id)', () => {
    expect(deriveChipLabel('team', { team_ids: ['t1'] }, teamsById)).toBe('10U Black');
    expect(deriveChipLabel('team', { team_id: 't2' }, teamsById)).toBe('11U Girls');
  });

  it('multi_team shows names ≤2, count >2', () => {
    expect(deriveChipLabel('multi_team', { team_ids: ['t1', 't2'] }, teamsById)).toBe('10U Black + 11U Girls');
    expect(deriveChipLabel('multi_team', { team_ids: ['t1', 't2', 'tX'] }, teamsById)).toBe('3 teams');
  });

  it('falls back to the mode label for derived types', () => {
    expect(deriveChipLabel('event_attendees', null, teamsById)).toBe('Event RSVPs');
    expect(deriveChipLabel('coach_self', null, teamsById)).toBe('Coach only');
  });

  it('null audience type → placeholder', () => {
    expect(deriveChipLabel(null, null, teamsById)).toBe('Pick an audience');
  });
});
