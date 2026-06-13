// @vitest-environment jsdom
//
// useGoBack: back button must never be a silent no-op. navigate(-1) does
// nothing when the page is the first history entry (cold open / deep link /
// PWA reload) — operator-caught 2026-06-13 (stuck on an event detail). The
// hook pops history when there's an entry, else routes to a fallback.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

import { useGoBack } from '../useGoBack';

afterEach(() => navigate.mockClear());

describe('useGoBack', () => {
  it('pops history when there is an in-app entry (idx > 0)', () => {
    window.history.replaceState({ idx: 2 }, '');
    renderHook(() => useGoBack()).result.current();
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it('falls back to Home on cold open (idx 0) instead of dead-ending', () => {
    window.history.replaceState({ idx: 0 }, '');
    renderHook(() => useGoBack()).result.current();
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('honors a custom fallback', () => {
    window.history.replaceState({ idx: 0 }, '');
    renderHook(() => useGoBack('/schedule')).result.current();
    expect(navigate).toHaveBeenCalledWith('/schedule', { replace: true });
  });

  it('falls back when idx is absent (no router state)', () => {
    window.history.replaceState({}, '');
    renderHook(() => useGoBack()).result.current();
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
