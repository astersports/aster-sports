// Wave 4.2-A-8a — registry helpers + dispatch unit tests.
// Verifies isCalendarAnchored / getDispatchSendPath /
// NoCallupTokenInfrastructureError / NoRecipientsError shape.

import { describe, expect, it } from 'vitest';
import {
  CALENDAR_ANCHORED_KINDS, getDispatchSendPath, isCalendarAnchored,
  NoCallupTokenInfrastructureError, NoRecipientsError, RESOLVER_REGISTRY,
} from '../registry';

describe('registry — helpers', () => {
  it('isCalendarAnchored: 7 kinds true, free-form + unknown false', () => {
    for (const k of CALENDAR_ANCHORED_KINDS) expect(isCalendarAnchored(k)).toBe(true);
    expect(isCalendarAnchored('announcement')).toBe(false);
    expect(isCalendarAnchored('custom_message')).toBe(false);
    expect(isCalendarAnchored('not_a_kind')).toBe(false);
  });

  it('getDispatchSendPath returns the per-kind discriminator', () => {
    expect(getDispatchSendPath('weekly_digest')).toBe('digestSend');
    expect(getDispatchSendPath('game_recap')).toBe('composerSubmit');
    expect(getDispatchSendPath('tournament_prelim')).toBe('composerSubmit');
    expect(getDispatchSendPath('tournament_recap')).toBe('composerSubmit');
    expect(getDispatchSendPath('schedule_change')).toBe('composerSubmit');
    expect(getDispatchSendPath('rsvp_nudge')).toBe('rsvpNudgeSend');
    expect(getDispatchSendPath('academy_callup_notice')).toBe('academyCallupSend');
    expect(getDispatchSendPath('announcement')).toBe('legacy');
    expect(getDispatchSendPath('custom_message')).toBe('legacy');
    expect(getDispatchSendPath('not_a_kind')).toBe('legacy');
  });

  it('all 7 entries expose resolve, compose, anchorFromState, overridesFromState, sendPath', () => {
    for (const kind of CALENDAR_ANCHORED_KINDS) {
      const e = RESOLVER_REGISTRY[kind];
      expect(typeof e.resolve).toBe('function');
      expect(typeof e.compose).toBe('function');
      expect(typeof e.anchorFromState).toBe('function');
      expect(typeof e.overridesFromState).toBe('function');
      expect(['composerSubmit', 'digestSend', 'rsvpNudgeSend', 'academyCallupSend']).toContain(e.sendPath);
    }
  });

  it('anchorFromState pulls the right state path per kind', () => {
    const state = { anchor_id: 'evt-1', audience_filter: { player_ids: ['p-1'] }, pilot_only: true };
    expect(RESOLVER_REGISTRY.game_recap.anchorFromState(state)).toEqual({ eventId: 'evt-1', pilotOnly: true });
    expect(RESOLVER_REGISTRY.tournament_prelim.anchorFromState(state)).toEqual({ tournamentId: 'evt-1', pilotOnly: true });
    expect(RESOLVER_REGISTRY.tournament_recap.anchorFromState(state)).toEqual({ tournamentId: 'evt-1', pilotOnly: true });
    expect(RESOLVER_REGISTRY.schedule_change.anchorFromState(state)).toEqual({ eventId: 'evt-1', pilotOnly: true });
    expect(RESOLVER_REGISTRY.rsvp_nudge.anchorFromState(state)).toEqual({ eventId: 'evt-1', pilotOnly: true });
    expect(RESOLVER_REGISTRY.academy_callup_notice.anchorFromState(state)).toEqual({ eventId: 'evt-1', playerId: 'p-1', pilotOnly: true });
  });

  it('overridesFromState merges state.body + signoff_message', () => {
    const state = { body: { coach_note: 'hi', opp_highlights: 'oh' }, signoff_message: 'bye' };
    const overrides = RESOLVER_REGISTRY.game_recap.overridesFromState(state);
    expect(overrides).toEqual({ coach_note: 'hi', opp_highlights: 'oh', signoff_message: 'bye' });
  });

  it('NoCallupTokenInfrastructureError is constructable', () => {
    const e = new NoCallupTokenInfrastructureError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('NoCallupTokenInfrastructureError');
    expect(e.message).toContain('callup token mint');
  });

  it('NoRecipientsError carries kind + anchor', () => {
    const e = new NoRecipientsError('rsvp_nudge', { eventId: 'e-1' });
    expect(e.name).toBe('NoRecipientsError');
    expect(e.kind).toBe('rsvp_nudge');
    expect(e.anchor).toEqual({ eventId: 'e-1' });
  });

  it('academy_callup_notice on academyCallupSend path; blockedReason no longer set', () => {
    const e = RESOLVER_REGISTRY.academy_callup_notice;
    expect(e.sendPath).toBe('academyCallupSend');
    expect(e.blockedReason).toBeUndefined();
  });

  it('NoCallupTokenInfrastructureError retained for test imports', () => {
    expect(typeof NoCallupTokenInfrastructureError).toBe('function');
    expect(new NoCallupTokenInfrastructureError().name).toBe('NoCallupTokenInfrastructureError');
  });
});
