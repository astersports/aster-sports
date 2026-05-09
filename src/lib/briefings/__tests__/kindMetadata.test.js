import { describe, expect, it } from 'vitest';
import { bodyModuleFor, KIND_METADATA, KIND_ORDER, sortKinds } from '../kindMetadata';

describe('KIND_METADATA', () => {
  it('all 8 kinds present', () => {
    expect(KIND_ORDER.length).toBe(8);
    expect(KIND_ORDER.every((k) => KIND_METADATA[k])).toBe(true);
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

  it('schedule_change has anchor + audience locked', () => {
    expect(KIND_METADATA.schedule_change.anchorLocked).toBe(true);
    expect(KIND_METADATA.schedule_change.audienceLocked).toBe(true);
  });

  it('bodyModuleFor returns the module name', () => {
    expect(bodyModuleFor('weekly_digest')).toBe('WeeklyDigestBody');
    expect(bodyModuleFor('nonexistent')).toBe(null);
  });
});

describe('sortKinds', () => {
  it('falls back to spec order when usage is empty', () => {
    expect(sortKinds({})).toEqual(KIND_ORDER);
  });

  it('floats most-recently-used kinds to the top', () => {
    const usage = { announcement: 1000, game_recap: 2000 };
    const sorted = sortKinds(usage);
    expect(sorted[0]).toBe('game_recap');
    expect(sorted[1]).toBe('announcement');
    expect(sorted.length).toBe(KIND_ORDER.length);
  });

  it('ignores unknown kinds in usage', () => {
    const sorted = sortKinds({ unknown_kind: 9999 });
    expect(sorted).toEqual(KIND_ORDER);
  });
});
