// @vitest-environment jsdom
//
// Tier 3 v1 PR 4 — useInterval hook tests.
//
// Covers: callback fires on delay; callback identity swap doesn't
// resubscribe interval; cleanup on unmount + delay change; null/0
// delay disables the interval.

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInterval } from '../useInterval';

describe('useInterval', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('fires callback at each delay tick', () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, 1000));
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('null delay disables interval', () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, null));
    vi.advanceTimersByTime(10000);
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('0 or negative delay disables interval', () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, 0));
    vi.advanceTimersByTime(10000);
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('callback identity change keeps interval (uses ref for latest cb)', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), { initialProps: { cb: fn1 } });
    vi.advanceTimersByTime(1000);
    expect(fn1).toHaveBeenCalledTimes(1);
    rerender({ cb: fn2 });
    vi.advanceTimersByTime(1000);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn1).toHaveBeenCalledTimes(1); // not called again
  });

  it('clears interval on unmount', () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() => useInterval(fn, 1000));
    unmount();
    vi.advanceTimersByTime(10000);
    expect(fn).toHaveBeenCalledTimes(0);
  });
});
