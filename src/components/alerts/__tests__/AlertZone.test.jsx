// @vitest-environment jsdom
//
// AlertZone — loading-state gate test.
//
// Locks the kindness-microcopy invariant (CLAUDE.md §16.3): the
// "All clear" reassurance MUST NOT render before useAlertEvaluator's
// query resolves. Frank's Italy CEST smoke on PR #234 surfaced this
// as a false-reassurance flicker — a coach scanning during the load
// window could walk away thinking nothing's wrong, missing the actual
// amber/red state.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render as rtlRender, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AlertZone from '../AlertZone';

afterEach(cleanup);

// L99 v6 §5.1 B2 follow-up — AlertCard now uses useNavigate() to route
// to /events/:id?edit=1 on tap, requires Router context. Wrap render()
// so every test in this file gets it.
function render(ui, options) {
  return rtlRender(ui, { wrapper: MemoryRouter, ...options });
}

const SAMPLE_ALERT = {
  config_id: 'alert-1',
  alert_type_key: 'rsvp_shortfall',
  severity: 'warning',
  title: 'RSVP shortfall',
  description: '1 event affected',
};

describe('AlertZone — loading-state gate', () => {
  it('a. collapsible + loading + no alerts → renders nothing (no false pill)', () => {
    const { container } = render(<AlertZone alerts={[]} variant="collapsible" loading />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/all clear/i)).toBeNull();
  });

  it('b. always_visible + loading + no alerts → header + skeleton, NO AllClearPill', () => {
    render(<AlertZone alerts={[]} variant="always_visible" loading sectionLabel="ALERTS" />);
    expect(screen.getByText('ALERTS')).toBeInTheDocument();
    expect(screen.queryByText(/all clear/i)).toBeNull();
    // The aria-busy attribute marks the skeleton state for assistive tech.
    expect(screen.getByLabelText('Alerts')).toHaveAttribute('aria-busy', 'true');
  });

  it('c. collapsible + not loading + no alerts → renders AllClearPill (pill mode says "No alerts" to disambiguate from sibling ActionZone)', () => {
    render(<AlertZone alerts={[]} variant="collapsible" loading={false} />);
    expect(screen.getByText('No alerts')).toBeInTheDocument();
  });

  it('d. always_visible + not loading + no alerts → header + inline AllClearPill', () => {
    render(<AlertZone alerts={[]} variant="always_visible" loading={false} sectionLabel="ALERTS" />);
    expect(screen.getByText('ALERTS')).toBeInTheDocument();
    expect(screen.getByText(/all clear · no alerts firing/i)).toBeInTheDocument();
  });

  it('e. loading + alerts present → renders alerts (loading irrelevant when data lands)', () => {
    render(<AlertZone alerts={[SAMPLE_ALERT]} variant="always_visible" loading sectionLabel="ALERTS" />);
    expect(screen.getByText('RSVP shortfall')).toBeInTheDocument();
    expect(screen.queryByText(/all clear/i)).toBeNull();
  });

  it('f. default loading=false preserves pre-fix behavior (backward compat)', () => {
    // Callers that don't pass `loading` keep the original behavior:
    // AllClearPill renders immediately. The bug only existed when
    // consumers passed `loading=true` (i.e., wired the gate). This
    // covers consumers that haven't been wired yet.
    render(<AlertZone alerts={[]} variant="always_visible" sectionLabel="ALERTS" />);
    expect(screen.getByText(/all clear · no alerts firing/i)).toBeInTheDocument();
  });
});
