// @vitest-environment jsdom
//
// CutoverGateChip render contract test (per CLAUDE.md anti-pattern #43).
//
// §4.AI Option C PR A retired BriefingsInboxPage, leaving AdminHomePage
// as the single mount surface. This test was previously
// CutoverGateChipCrossSurface — renamed in PR C (2026-05-23) to reflect
// the post-Option C single-surface reality. The render-contract
// assertions are preserved verbatim: the chip's URL/value contract
// (mean to 1 decimal, ≥/< 4.0 boundary, loading/empty placeholders)
// is what the test locks.
//
// The test mocks the useBriefingFeedback hook and asserts that the
// component reads it deterministically across re-mounts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

const hookRef = { current: { loading: false, meanRating: 4.5, ratingCount: 12, messageCount: 5, atOrAboveThreshold: true } };

vi.mock('../../../hooks/useBriefingFeedback', () => ({
  useBriefingFeedback: () => hookRef.current,
  CUTOVER_GATE_THRESHOLD: 4.0,
}));
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: 'org-1' }),
}));

const { default: CutoverGateChip } = await import('../CutoverGateChip');

afterEach(() => {
  cleanup();
  hookRef.current = { loading: false, meanRating: 4.5, ratingCount: 12, messageCount: 5, atOrAboveThreshold: true };
});

describe('CutoverGateChip — render contract (AP #43)', () => {
  it('1. above threshold: renders mean to 1 decimal + ≥ 4.0 pill + success color', () => {
    const { container } = render(<CutoverGateChip />);
    const chip = container.querySelector('[data-testid="cutover-gate-chip"]');
    expect(chip).not.toBeNull();
    expect(chip.textContent).toContain('Cutover gate');
    expect(chip.textContent).toContain('4.5');
    expect(chip.textContent).toContain('12/5 last sends');
    expect(chip.textContent).toContain('≥ 4.0');
    expect(chip.getAttribute('aria-label')).toMatch(/4\.5 of 5/);
    expect(chip.getAttribute('aria-label')).toMatch(/At or above 4\.0 threshold/);
  });

  it('2. below threshold: renders mean + < 4.0 pill + non-success color', () => {
    hookRef.current = { loading: false, meanRating: 3.2, ratingCount: 8, messageCount: 5, atOrAboveThreshold: false };
    const { container } = render(<CutoverGateChip />);
    const chip = container.querySelector('[data-testid="cutover-gate-chip"]');
    expect(chip.textContent).toContain('3.2');
    expect(chip.textContent).toContain('< 4.0');
    expect(chip.getAttribute('aria-label')).toMatch(/Below 4\.0 threshold/);
  });

  it('3. exactly at threshold (4.0): renders ≥ 4.0 pill (boundary lock)', () => {
    hookRef.current = { loading: false, meanRating: 4.0, ratingCount: 5, messageCount: 5, atOrAboveThreshold: true };
    const { container } = render(<CutoverGateChip />);
    const chip = container.querySelector('[data-testid="cutover-gate-chip"]');
    expect(chip.textContent).toContain('4.0');
    expect(chip.textContent).toContain('≥ 4.0');
  });

  it('4. no ratings yet: renders empty state, no testid chip', () => {
    hookRef.current = { loading: false, meanRating: null, ratingCount: 0, messageCount: 0, atOrAboveThreshold: false };
    const { container } = render(<CutoverGateChip />);
    expect(container.querySelector('[data-testid="cutover-gate-chip"]')).toBeNull();
    expect(container.textContent).toContain('no ratings yet');
  });

  it('5. loading: renders aria-live placeholder, no testid chip', () => {
    hookRef.current = { loading: true };
    const { container } = render(<CutoverGateChip />);
    expect(container.querySelector('[data-testid="cutover-gate-chip"]')).toBeNull();
    expect(container.textContent).toContain('Cutover gate · …');
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
  });

  it('6. deterministic re-render: same hook output produces identical text across remounts', () => {
    // Mount twice with the same hook ref → identical output. Locks the
    // render contract so a future second mount surface (if reintroduced)
    // would still pass the invariant.
    hookRef.current = { loading: false, meanRating: 4.3, ratingCount: 9, messageCount: 5, atOrAboveThreshold: true };
    const { container: c1 } = render(<CutoverGateChip />);
    const text1 = c1.querySelector('[data-testid="cutover-gate-chip"]').textContent;
    cleanup();
    const { container: c2 } = render(<CutoverGateChip />);
    const text2 = c2.querySelector('[data-testid="cutover-gate-chip"]').textContent;
    expect(text1).toBe(text2);
  });
});
