// Compose entry point #2 ("Message this team") — locks the team-prefill
// audience behavior end-to-end (COMPOSE_ENTRY_MODEL.txt #2).
//
// The team entry lands in the composer via ?anchor=team&id=<id> with NO
// kind. buildInitial pre-sets audience_type='team' + audience_filter.
// When the admin picks a kind, reconcileAudienceForKind decides whether
// to HONOR the team pre-fill (kind supports a team audience) or FALL BACK
// to the kind's smart default (drops the now-invalid team). This test
// pins both the pure reconciler and the reducer SET_KIND that consumes it.

import { describe, expect, it } from 'vitest';
import { reconcileAudienceForKind } from '../../../lib/briefings/audienceReconcile';
import { composerReducer } from '../composerReducer';
import { buildInitial } from '../briefingComposerHelpers';

const TEAM = 'team-uuid-1';
const teamFilter = { team_ids: [TEAM] };

describe('Message this team — buildInitial team pre-fill (no kind yet)', () => {
  it('?anchor=team&id=<id> with no kind → audience pre-set to that team, step 1', () => {
    const s = buildInitial({ initialAnchorKind: 'team', initialAnchorId: TEAM });
    expect(s.kind).toBeNull();
    expect(s.step).toBe(1);
    expect(s.anchor_kind).toBe('team');
    expect(s.anchor_id).toBe(TEAM);
    expect(s.audience_type).toBe('team');
    expect(s.audience_filter).toEqual(teamFilter);
  });
});

describe('reconcileAudienceForKind — honor vs fall back', () => {
  it('HONORS the team pre-fill for kinds that support a team audience', () => {
    for (const kind of ['announcement', 'weekly_digest', 'game_recap', 'rsvp_nudge', 'custom_message']) {
      expect(reconcileAudienceForKind(kind, 'team', teamFilter))
        .toEqual({ audience_type: 'team', audience_filter: teamFilter });
    }
  });

  it('FALLS BACK to smart default for kinds that do not support a team audience', () => {
    // tournament kinds → tournament_attendees; family_guide → org_all
    expect(reconcileAudienceForKind('tournament_prelim', 'team', teamFilter))
      .toEqual({ audience_type: 'tournament_attendees', audience_filter: null });
    expect(reconcileAudienceForKind('tournament_recap', 'team', teamFilter))
      .toEqual({ audience_type: 'tournament_attendees', audience_filter: null });
    expect(reconcileAudienceForKind('family_guide', 'team', teamFilter))
      .toEqual({ audience_type: 'org_all', audience_filter: null });
    expect(reconcileAudienceForKind('coach_roundup', 'team', teamFilter))
      .toEqual({ audience_type: 'coach_self', audience_filter: null });
  });

  it('FALLS BACK for locked kinds (audience is derived, never honored)', () => {
    expect(reconcileAudienceForKind('games_recap', 'team', teamFilter))
      .toEqual({ audience_type: 'multi_event_attendees', audience_filter: null });
    expect(reconcileAudienceForKind('schedule_change', 'team', teamFilter))
      .toEqual({ audience_type: 'event_attendees', audience_filter: null });
    expect(reconcileAudienceForKind('academy_callup_notice', 'team', teamFilter))
      .toEqual({ audience_type: 'player_specific', audience_filter: null });
  });

  it('with no current pre-fill, returns the kind smart default', () => {
    expect(reconcileAudienceForKind('announcement', null, null))
      .toEqual({ audience_type: 'org_all', audience_filter: null });
  });
});

describe('Message this team — pick-kind reducer flow (initial audience state)', () => {
  // Mirror BriefingComposer.onPick: reconcile, then SET_KIND.
  function pickKind(state, kind) {
    const aud = reconcileAudienceForKind(kind, state.audience_type, state.audience_filter);
    return composerReducer(state, {
      type: 'SET_KIND', kind, audience_type: aud.audience_type, audience_filter: aud.audience_filter, defaultBody: {},
    });
  }

  it('team pre-fill + announcement (team-audience kind) → defaults to the team', () => {
    const init = buildInitial({ initialAnchorKind: 'team', initialAnchorId: TEAM });
    const s = pickKind(init, 'announcement');
    expect(s.kind).toBe('announcement');
    expect(s.audience_type).toBe('team');
    expect(s.audience_filter).toEqual(teamFilter);
  });

  it('team pre-fill + tournament_prelim (no team audience) → ignores team, uses smart default', () => {
    const init = buildInitial({ initialAnchorKind: 'team', initialAnchorId: TEAM });
    const s = pickKind(init, 'tournament_prelim');
    expect(s.kind).toBe('tournament_prelim');
    expect(s.audience_type).toBe('tournament_attendees');
    expect(s.audience_filter).toBeNull();
  });

  it('team pre-fill + family_guide (override → org_all) → drops the team filter', () => {
    const init = buildInitial({ initialAnchorKind: 'team', initialAnchorId: TEAM });
    const s = pickKind(init, 'family_guide');
    expect(s.kind).toBe('family_guide');
    expect(s.audience_type).toBe('org_all');
    expect(s.audience_filter).toBeNull();
  });
});
