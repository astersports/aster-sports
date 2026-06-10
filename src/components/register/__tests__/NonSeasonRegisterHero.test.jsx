// @vitest-environment jsdom
//
// D1 — non-season flat-fee hero. Locks: when open + a fee is set, it shows the
// per-child fee + a Continue CTA wired to onContinue; otherwise it shows a status
// line and NO Continue (upcoming / closed / fee-not-set). The word "division"
// never appears.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import NonSeasonRegisterHero from '../NonSeasonRegisterHero';

afterEach(cleanup);
const program = { name: 'Fall 2026 Tryouts', program_type: 'tryout' };

describe('NonSeasonRegisterHero (D1)', () => {
  it('open + fee set → shows per-child fee + Continue, fires onContinue', () => {
    const onContinue = vi.fn();
    render(<NonSeasonRegisterHero program={program} division={{ id: 'd1', base_fee_cents: 4500 }} regState="open" onContinue={onContinue} />);
    expect(screen.getByText('$45.00')).toBeTruthy();
    const cta = screen.getByRole('button', { name: /continue · \$45\.00/i });
    fireEvent.click(cta);
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/division/i)).toBeNull();
  });

  it('upcoming → status line, no Continue', () => {
    render(<NonSeasonRegisterHero program={program} division={{ id: 'd1', base_fee_cents: 4500 }} regState="upcoming" opensLabel="Jun 7" />);
    expect(screen.getByText(/registration opens jun 7/i)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('open but fee not set (no division) → "isn’t open yet", no Continue', () => {
    render(<NonSeasonRegisterHero program={program} division={undefined} regState="open" />);
    expect(screen.getByText(/isn’t open yet/i)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('open but fee is 0 → not ready', () => {
    render(<NonSeasonRegisterHero program={program} division={{ id: 'd1', base_fee_cents: 0 }} regState="open" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
