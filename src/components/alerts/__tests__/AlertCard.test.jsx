// @vitest-environment jsdom
//
// AlertCard interaction model — every alert is actionable. Locks:
//   - tournament_prelim expands like tournament_recap, rows Compose into
//     the prelim composer (parity fix — prelim was previously a dead card)
//   - weekly briefing taps through to compose that kind
//   - payments overdue taps through to the financial dashboard

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AlertCard from '../AlertCard';

afterEach(cleanup);

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}{loc.search}</div>;
}

function renderCard(alert) {
  return render(
    <MemoryRouter initialEntries={['/admin/home']}>
      <AlertCard alert={alert} />
      <Routes><Route path="*" element={<LocationProbe />} /></Routes>
    </MemoryRouter>,
  );
}

describe('AlertCard interactions', () => {
  it('tournament_prelim expands to upcoming tournaments, row composes a prelim', async () => {
    const user = userEvent.setup();
    renderCard({
      config_id: 'c', alert_type_key: 'briefing_overdue', instance_key: 'tournament_prelim',
      severity: 'warning', data: { tournaments: [{ id: 't1', name: 'Zero Gravity Finals', start_date: '2026-05-30' }] },
    });
    await user.click(screen.getByRole('button', { name: /tournament prelim briefing overdue/i }));
    await user.click(screen.getByRole('button', { name: /Zero Gravity Finals/i }));
    expect(screen.getByTestId('loc').textContent)
      .toBe('/admin/briefings/compose?anchor=tournament&id=t1&kind=tournament_prelim');
  });

  it('weekly briefing taps through to compose that kind', async () => {
    const user = userEvent.setup();
    renderCard({
      config_id: 'c', alert_type_key: 'briefing_overdue', instance_key: 'weekly_digest',
      severity: 'warning', data: { briefing_kind: 'weekly_digest', expected_send_by: 'Thursday 09:00' },
    });
    await user.click(screen.getByRole('button', { name: /weekly briefing overdue/i }));
    expect(screen.getByTestId('loc').textContent).toBe('/admin/briefings/compose?kind=weekly_digest');
  });

  it('payments overdue taps through to the financial dashboard', async () => {
    const user = userEvent.setup();
    renderCard({
      config_id: 'c', alert_type_key: 'payment_overdue', severity: 'warning',
      data: { total_outstanding_cents: 127500, family_count: 1 },
    });
    await user.click(screen.getByRole('button', { name: /payments overdue/i }));
    expect(screen.getByTestId('loc').textContent).toBe('/admin/financials');
  });

  // BUG-1 invariant: the overdue alert declares its (all-seasons) scope so it
  // can't read as a contradiction next to season-scoped "Payment collection".
  it('payment overdue body declares all-seasons scope', () => {
    renderCard({
      config_id: 'c', alert_type_key: 'payment_overdue', severity: 'warning',
      data: { total_outstanding_cents: 127500, family_count: 1 },
    });
    expect(screen.getByText(/\$1,275\.00 across 1 family · all seasons/)).toBeInTheDocument();
  });

  // BUG-3 invariant: rsvp_shortfall is actionable (not a dead card) and taps
  // through to the schedule — keeps alert affordance consistent across cards.
  it('rsvp shortfall taps through to the schedule (no dead card)', async () => {
    const user = userEvent.setup();
    renderCard({
      config_id: 'c', alert_type_key: 'rsvp_shortfall', severity: 'warning',
      data: { affected_count: 4 },
    });
    await user.click(screen.getByRole('button', { name: /rsvp shortfall/i }));
    expect(screen.getByTestId('loc').textContent).toBe('/schedule');
  });
});
