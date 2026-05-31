import { describe, expect, it } from 'vitest';
import { formatCurrency, formatTournamentRange } from '../formatters';

// Cross-surface invariant test (AP #43 / #46) for the formatter-consolidation
// PR. Before this PR, three components carried their own formatRange copies
// (TournamentHeader, TournamentListItem, broadcast/TournamentCard) — and the
// broadcast copy used a `T00:00:00` midnight anchor that rendered date-only
// values one calendar day early during EDT. All three now route through
// formatTournamentRange; these tests lock the noon-anchor DST safety + the
// withYear/no-year parity so the surfaces can't silently diverge again.

describe('formatTournamentRange — noon-anchor DST safety', () => {
  it('renders a date-only value on its OWN calendar day during EDT (not one early)', () => {
    // May 1 2026 is EDT (UTC-4). A midnight anchor (2026-05-01T00:00:00 parsed
    // as local→UTC) regressed to "Apr 30" on NY render. Noon anchor stays May 1.
    expect(formatTournamentRange('2026-05-01', '2026-05-01')).toBe('May 1');
  });

  it('single-day (start === end) renders one date', () => {
    expect(formatTournamentRange('2026-04-13', '2026-04-13')).toBe('Apr 13');
  });

  it('no end date renders just the start', () => {
    expect(formatTournamentRange('2026-04-13', null)).toBe('Apr 13');
    expect(formatTournamentRange('2026-04-13')).toBe('Apr 13');
  });

  it('empty start returns empty string (consumer-suppression contract)', () => {
    expect(formatTournamentRange('', '2026-04-15')).toBe('');
    expect(formatTournamentRange(null)).toBe('');
  });
});

describe('formatTournamentRange — span collapsing', () => {
  it('same-month span collapses to "Mon D–D"', () => {
    expect(formatTournamentRange('2026-04-13', '2026-04-15')).toBe('Apr 13–15');
  });

  it('cross-month span renders both months', () => {
    expect(formatTournamentRange('2026-04-30', '2026-05-02')).toBe('Apr 30–May 2');
  });

  it('withYear appends the year on same-month spans (TournamentHeader contract)', () => {
    expect(formatTournamentRange('2026-04-13', '2026-04-15', { withYear: true })).toBe('Apr 13–15, 2026');
  });

  it('withYear appends the year on single-day (TournamentHeader contract)', () => {
    expect(formatTournamentRange('2026-04-13', '2026-04-13', { withYear: true })).toBe('Apr 13, 2026');
  });

  it('withYear appends the year on cross-month spans', () => {
    expect(formatTournamentRange('2026-04-30', '2026-05-02', { withYear: true })).toBe('Apr 30–May 2, 2026');
  });

  it('withYear=false (list/broadcast contract) omits the year', () => {
    expect(formatTournamentRange('2026-04-13', '2026-04-15', { withYear: false })).toBe('Apr 13–15');
  });
});

describe('formatCurrency — cross-surface consistency (AP #63 resolution)', () => {
  it('renders cents on all surfaces ($X,XXX.00) — parent home now matches admin', () => {
    expect(formatCurrency(127500)).toBe('$1,275.00');
  });

  it('handles null/zero without NaN', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });
});
