// @vitest-environment jsdom
//
// Wave 4.4-C2b — DevicePreviewFrame component test. Verifies §12 rule
// #12's three-frame contract: Mobile 375, Desktop 600, Plain text.
//
// Five assertions per the C2b spec:
//   a. Default tab is Mobile (aria-selected="true" on mobile button)
//   b. Mobile tab iframe contentDocument body contains the html prop
//   c. Desktop tab click swaps aria-selected + iframe re-renders at 600px viewport
//   d. Plain tab renders <pre> with the plainText prop
//   e. Tablist + tab roles wired for screen readers
//
// Per-file environment opt-in (first-line directive). Global vitest env
// stays node; only this file pays the jsdom setup cost.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevicePreviewFrame from './DevicePreviewFrame';

// RTL's auto-cleanup hooks only fire when vitest globals are enabled.
// We opted into per-file jsdom (no globals), so wire cleanup explicitly.
afterEach(cleanup);

const HTML_FIXTURE = '<p data-testid="injected">Hello from briefing render</p>';
const PLAIN_FIXTURE = 'Mon May 11 — Practice 7:35 PM\nTue May 12 — Game vs Storm';

function setup() {
  const utils = render(<DevicePreviewFrame html={HTML_FIXTURE} plainText={PLAIN_FIXTURE} />);
  return { user: userEvent.setup(), ...utils };
}

describe('DevicePreviewFrame', () => {
  it('a. defaults to Mobile tab on initial mount', () => {
    setup();
    const mobile = screen.getByRole('tab', { name: /mobile/i });
    expect(mobile).toHaveAttribute('aria-selected', 'true');
    const desktop = screen.getByRole('tab', { name: /desktop/i });
    const plain = screen.getByRole('tab', { name: /plain text/i });
    expect(desktop).toHaveAttribute('aria-selected', 'false');
    expect(plain).toHaveAttribute('aria-selected', 'false');
  });

  it('b. Mobile tab iframe contentDocument body contains the html prop', async () => {
    setup();
    const iframe = screen.getByTitle('Briefing preview');
    await waitFor(() => {
      const body = iframe.contentDocument?.body;
      expect(body?.innerHTML).toContain('Hello from briefing render');
    });
    const viewportMeta = iframe.contentDocument?.querySelector('meta[name="viewport"]');
    expect(viewportMeta?.getAttribute('content')).toBe('width=375');
  });

  it('c. Desktop tab click swaps aria-selected + iframe re-renders at 600px viewport', async () => {
    const { user } = setup();
    const desktop = screen.getByRole('tab', { name: /desktop/i });
    await user.click(desktop);
    expect(desktop).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /mobile/i })).toHaveAttribute('aria-selected', 'false');
    const iframe = screen.getByTitle('Briefing preview');
    await waitFor(() => {
      const meta = iframe.contentDocument?.querySelector('meta[name="viewport"]');
      expect(meta?.getAttribute('content')).toBe('width=600');
    });
  });

  it('d. Plain tab click renders <pre> with the plainText prop (and unmounts iframe)', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: /plain text/i }));
    expect(screen.queryByTitle('Briefing preview')).not.toBeInTheDocument();
    const pre = screen.getByText(/Practice 7:35 PM/);
    expect(pre.tagName).toBe('PRE');
    expect(pre.textContent).toContain('Mon May 11');
    expect(pre.textContent).toContain('Tue May 12');
  });

  it('e. exposes tablist + tab roles for screen readers', () => {
    setup();
    const tablist = screen.getByRole('tablist', { name: /preview device/i });
    expect(tablist).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });
});
