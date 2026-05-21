// @vitest-environment jsdom
//
// Cross-surface invariant per CLAUDE.md anti-pattern #43 / Teams PR B.
//
// RsvpProgressBar renders inside the TeamDetailHero (compact) and is
// available for any other surface that wants the same progress visual
// (e.g., EventCard expanded variant in a future PR). The bar's output
// MUST be deterministic given identical inputs — the three segment
// widths sum to the same proportion regardless of caller context.
//
// This test catches a future regression where a per-surface wrapper
// silently mutates the segment math (e.g., a compact override that
// rounds going+maybe but not out, breaking the rhythm).

import { describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import RsvpProgressBar from '../RsvpProgressBar';

function segmentWidths(container) {
  const bar = container.firstChild;
  const segs = Array.from(bar.children);
  return segs.map((s) => s.style.width);
}

describe('RsvpProgressBar — cross-surface invariant', () => {
  it('compact + full produce identical segment widths for same input', () => {
    const inputs = { going: 8, maybe: 2, out: 1, total: 13 };
    const a = render(<RsvpProgressBar {...inputs} compact />);
    const compactWidths = segmentWidths(a.container);
    cleanup();
    const b = render(<RsvpProgressBar {...inputs} />);
    const fullWidths = segmentWidths(b.container);
    expect(compactWidths).toEqual(fullWidths);
  });

  it('compact vs full only differ in track height', () => {
    const a = render(<RsvpProgressBar going={5} maybe={3} out={2} total={10} compact />);
    const compactHeight = a.container.firstChild.style.height;
    cleanup();
    const b = render(<RsvpProgressBar going={5} maybe={3} out={2} total={10} />);
    const fullHeight = b.container.firstChild.style.height;
    expect(compactHeight).toBe('6px');
    expect(fullHeight).toBe('10px');
  });

  it('all-zero total renders a neutral track (no NaN widths)', () => {
    const { container } = render(<RsvpProgressBar going={0} maybe={0} out={0} total={0} compact />);
    const widths = segmentWidths(container);
    widths.forEach((w) => expect(w).toMatch(/^0%$/));
  });

  it('sum of segments never exceeds 100% even when total under-reports', () => {
    // Real-world: counts come in async; total might be stale by one
    // response. The safeTotal guard MUST clamp segments to <=100%.
    const { container } = render(<RsvpProgressBar going={10} maybe={5} out={2} total={5} compact />);
    const widths = segmentWidths(container).map((w) => parseFloat(w));
    const sum = widths.reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(100.01);
  });
});
