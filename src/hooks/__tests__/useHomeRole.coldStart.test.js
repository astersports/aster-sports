// @vitest-environment jsdom
//
// F-S2 gate (SCHEDULE_L99_BUILD_SPEC §8): view-as does NOT persist
// across a simulated cold start. The preview is a within-session tool —
// a persisted role_preferences preview without this session's marker
// resolves to the REAL role (and gets cleaned). With the marker, the
// preview holds.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ prefs: {}, merged: [] }));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'admin', loading: false }),
}));
vi.mock('../usePreferences', () => ({
  usePreferences: () => ({
    preferences: { role_preferences: h.prefs },
    loading: false,
    mergePreferenceJson: (col, partial) => { h.merged.push({ col, partial }); return Promise.resolve(); },
  }),
}));

import { useHomeRole } from '../useHomeRole';

const freshPreview = () => ({
  preferred_home_role: 'parent',
  preferred_home_role_set_at: new Date().toISOString(), // inside the 24h window
  view_as_guardian_id: 'g-1',
});

beforeEach(() => { sessionStorage.clear(); h.merged.length = 0; });
afterEach(cleanup);

describe('useHomeRole — F-S2 cold-start expiry', () => {
  it('persisted preview WITHOUT the session marker resolves to the real role and cleans the prefs', async () => {
    h.prefs = freshPreview();
    const { result } = renderHook(() => useHomeRole());
    expect(result.current.activeRole).toBe('admin');
    expect(result.current.isViewingAs).toBe(false);
    // cold-start cleanup wrote the reset (once)
    await waitFor(() => expect(h.merged.some((m) => m.col === 'role_preferences' && m.partial.preferred_home_role === null)).toBe(true));
  });

  it('preview WITH this session\'s marker holds', () => {
    sessionStorage.setItem('as-viewas-session', '1');
    h.prefs = freshPreview();
    const { result } = renderHook(() => useHomeRole());
    expect(result.current.activeRole).toBe('parent');
    expect(result.current.isViewingAs).toBe(true);
  });

  it('setViewAs arms the session marker; resetToRealRole clears it', async () => {
    h.prefs = {};
    const { result } = renderHook(() => useHomeRole());
    await result.current.setViewAs('coach');
    expect(sessionStorage.getItem('as-viewas-session')).toBe('1');
    await result.current.resetToRealRole();
    expect(sessionStorage.getItem('as-viewas-session')).toBeNull();
  });
});
