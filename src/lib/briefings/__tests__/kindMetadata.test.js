import { describe, expect, it } from 'vitest';
import { bodyModuleFor, KIND_METADATA, KIND_ORDER, sortKinds } from '../kindMetadata';

describe('KIND_METADATA', () => {
  it('all 10 kinds present (coach_roundup added wave 5 PR 4a)', () => {
    expect(KIND_ORDER.length).toBe(10);
    expect(KIND_ORDER.every((k) => KIND_METADATA[k])).toBe(true);
    expect(KIND_ORDER).toContain('academy_callup_notice');
    expect(KIND_ORDER).toContain('coach_roundup');
  });

  it('every entry has icon + label + description + bodyModule', () => {
    Object.entries(KIND_METADATA).forEach(([k, m]) => {
      expect(m.icon, k).toBeTruthy();
      expect(m.label, k).toBeTruthy();
      expect(m.description, k).toBeTruthy();
      expect(m.bodyModule, k).toBeTruthy();
    });
  });

  it('rsvp_nudge is enabled after wave 4.0 (HMAC token plumbing)', () => {
    expect(KIND_METADATA.rsvp_nudge.disabled).toBe(false);
    expect(KIND_METADATA.rsvp_nudge.badge).toBeUndefined();
  });

  // Wave 4.1b §4 — Bug D. M1 (PR #53) reconciled the DB CHECK with the
  // engine's 9 canonical kinds; every kind must be enabled.
  it('Wave 4.1b — every canonical kind has disabled=false', () => {
    ['rsvp_nudge', 'game_recap', 'tournament_prelim', 'tournament_recap', 'announcement', 'custom_message'].forEach((k) => {
      expect(KIND_METADATA[k].disabled, k).toBe(false);
    });
  });

  it('schedule_change has anchor + audience locked', () => {
    expect(KIND_METADATA.schedule_change.anchorLocked).toBe(true);
    expect(KIND_METADATA.schedule_change.audienceLocked).toBe(true);
  });

  it('bodyModuleFor returns the module name', () => {
    expect(bodyModuleFor('weekly_digest')).toBe('WeeklyDigestBody');
    expect(bodyModuleFor('nonexistent')).toBe(null);
  });
});

// Wave 4.1d-2 §5.1 — academy_callup_notice surfaced
describe('academy_callup_notice (G2 — surfaced wave 4.1d-2)', () => {
  it('exists in KIND_METADATA with player_specific audience', () => {
    const meta = KIND_METADATA.academy_callup_notice;
    expect(meta).toBeTruthy();
    expect(meta.disabled).toBe(false);
    expect(meta.defaultAudienceType).toBe('player_specific');
    expect(meta.audienceLocked).toBe(true);
    expect(meta.bodyModule).toBe('AcademyCallupBody');
  });
  it('default anchor is event (single game)', () => {
    expect(KIND_METADATA.academy_callup_notice.defaultAnchorKind).toBe('event');
    expect(KIND_METADATA.academy_callup_notice.anchorKinds).toEqual(['event']);
  });
  it('appears in KIND_ORDER between rsvp_nudge and custom_message', () => {
    const idx = KIND_ORDER.indexOf('academy_callup_notice');
    expect(idx).toBeGreaterThan(-1);
    expect(KIND_ORDER[idx - 1]).toBe('rsvp_nudge');
    expect(KIND_ORDER[idx + 1]).toBe('custom_message');
  });
  // Wave 4.8 BUG (5/13 incident) — wizard cannot complete this kind; the
  // canonical activation flow (EventDetail → AcademyCallupPicker) is the
  // only path that populates events.academy_callup_player_ids. Body step
  // short-circuits to AcademyCallupRedirectCard when the flag is false.
  it('wizardSupported: false (kind stays discoverable, body renders redirect)', () => {
    expect(KIND_METADATA.academy_callup_notice.wizardSupported).toBe(false);
  });
});

describe('sortKinds (wave 4.1d-2 §2.5 — stable order, usage no longer reorders)', () => {
  it('returns spec order when usage is empty', () => {
    expect(sortKinds({})).toEqual(KIND_ORDER);
  });

  it('returns spec order regardless of usage data (deterministic to fix kind picker flicker)', () => {
    const usage = { announcement: 1000, game_recap: 2000 };
    expect(sortKinds(usage)).toEqual(KIND_ORDER);
  });

  it('ignores unknown kinds in usage and returns spec order', () => {
    expect(sortKinds({ unknown_kind: 9999 })).toEqual(KIND_ORDER);
  });
});
