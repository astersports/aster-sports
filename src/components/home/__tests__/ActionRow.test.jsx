// @vitest-environment jsdom
//
// ActionRow comms variant — sender name (#1). Guards the "New from {sender}"
// behavior + the admin "Briefings" pin precedence + the fallback. Satisfies
// AP#46 (a *Row change ships with a test) and locks the label logic.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import ActionRow from '../ActionRow';

afterEach(cleanup);

const noop = () => {};

describe('ActionRow — comms variant', () => {
  it('shows "New from {sender}" when the briefing has a resolved sender', () => {
    const { container } = render(
      <ActionRow item={{ domain: 'comms', id: 'c1', from: 'Frank', subject: 'Weekly digest', to: '/inbox?r=1' }} onNavigate={noop} onRsvpResolved={noop} />,
    );
    expect(container.textContent).toMatch(/New from Frank/);
    expect(container.textContent).toMatch(/Weekly digest/);
  });

  it('falls back to "New from your coach" when the sender is unresolved', () => {
    const { container } = render(
      <ActionRow item={{ domain: 'comms', id: 'c2', from: null, subject: 'x' }} onNavigate={noop} onRsvpResolved={noop} />,
    );
    expect(container.textContent).toMatch(/New from your coach/);
  });

  it('admin "Briefings" pin (item.primary) takes precedence over the sender name', () => {
    const { container } = render(
      <ActionRow item={{ domain: 'comms', id: 'b', primary: 'Briefings', pinned: true, from: 'Frank', subtitle: '3 ready · 2 to write' }} onNavigate={noop} onRsvpResolved={noop} />,
    );
    expect(container.textContent).toMatch(/Briefings/);
    expect(container.textContent).not.toMatch(/New from/);
  });
});
