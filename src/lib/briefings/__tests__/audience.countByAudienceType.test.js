import { describe, expect, it } from 'vitest';
import { countByAudienceType } from '../audience';
import { FULL_RECIPIENTS, team10UBlack, team10UBlue } from './_audienceFixtures';

describe('countByAudienceType', () => {
  it('returns null when audienceType missing', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS })).toBe(null);
  });
  it('org_all returns recipient count', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'org_all' })).toBe(5);
  });
  it('team filters by anchor when audienceFilter has no team_id', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', anchorId: team10UBlue })).toBe(2);
  });
  it('team prefers audienceFilter.team_id when present', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', audienceFilter: { team_id: team10UBlack }, anchorId: team10UBlue })).toBe(1);
  });
  it('multi_team unions across teams', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'multi_team', audienceFilter: { team_ids: [team10UBlue, team10UBlack] } })).toBe(3);
  });
  // 5d-b-1 backward-compat shim assertions:
  // TeamGroupedPicker writes audience_filter.team_ids[] (plural). Old
  // drafts saved pre-5d-b-1 carry audience_filter.team_id (singular).
  // countByAudienceType must accept both shapes for the 'team' type.
  it('5d-b-1: team mode reads audienceFilter.team_ids[] (new shape)', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', audienceFilter: { team_ids: [team10UBlue] } })).toBe(2);
  });
  it('5d-b-1: team mode falls back to audienceFilter.team_id (legacy singular)', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', audienceFilter: { team_id: team10UBlue } })).toBe(2);
  });
  it('5d-b-1: team mode — team_ids[] wins over team_id when both present', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', audienceFilter: { team_ids: [team10UBlack], team_id: team10UBlue } })).toBe(1);
  });

  // COMPOSE-FRONT P1: previously returned null forever → "Computing audience…"
  // never cleared and the send gate couldn't fire. coach_self / family_specific
  // resolve to a single recipient/family synchronously.
  it('coach_self resolves to 1 (the composing coach)', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'coach_self' })).toBe(1);
  });
  it('family_specific resolves to 1 family', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'family_specific' })).toBe(1);
  });

  // The 4 anchor/player types remain null here — they need the async
  // useResolvedAudienceCount path; null is the "defer to resolver" signal.
  it.each(['event_attendees', 'tournament_attendees', 'multi_event_attendees', 'player_specific'])(
    '%s returns null (deferred to async resolver)', (type) => {
      expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: type })).toBe(null);
    });
});
