// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InboxList from '../InboxList';

// vitest runs without `globals: true`, so @testing-library/react's
// auto-cleanup never registers — each multi-render test file must call
// cleanup itself (matches the codebase convention, e.g.
// ShareScheduleButton.test.jsx). Without this, renders accumulate across
// it-blocks: getAllByRole('listitem') saw 4 (two renders) instead of 2,
// and items[0] was the prior render's button (its no-op onSelect, not the
// vi.fn()), so the Enter test counted 0 calls.
afterEach(cleanup);

// Phase 3 D-8(a-new) — structural a11y for parent inbox.
// Asserts ARIA roles, labels, keyboard interaction. Full axe-core
// scan is a separate operator-run step (CLAUDE.md rule #14
// `npx @axe-core/cli` against the dev server) — this catches the
// regressions a structural test can catch in CI without a browser dep.

const FIXTURE_ITEMS = [
  { id: 'r-1', message_id: 'm-1', kind: 'weekly_digest', subject: "This week ahead",
    sent_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 'r-2', message_id: 'm-2', kind: 'game_recap', subject: 'vs Eagles 45-32',
    sent_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString() },
];

describe('InboxList a11y (Phase 3 D-8 a-new)', () => {
  it('renders a list landmark with an accessible name', () => {
    render(<InboxList items={FIXTURE_ITEMS} onSelect={() => {}} />);
    expect(screen.getByRole('list', { name: /briefings/i })).toBeInTheDocument();
  });

  it('renders each item as a listitem with an accessible name including subject + kind', () => {
    render(<InboxList items={FIXTURE_ITEMS} onSelect={() => {}} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(FIXTURE_ITEMS.length);
    // First item is most recent (TODAY bucket). Check its accessible name
    // includes both kind label + subject.
    expect(items[0].getAttribute('aria-label')).toMatch(/Weekly digest/i);
    expect(items[0].getAttribute('aria-label')).toMatch(/This week ahead/i);
  });

  it('exposes the items as buttons (focusable + keyboard-activatable)', () => {
    render(<InboxList items={FIXTURE_ITEMS} onSelect={() => {}} />);
    const items = screen.getAllByRole('listitem');
    for (const el of items) {
      // The list rows are <button type="button"> with role="listitem" added.
      // Confirm they're activatable via the native button semantics.
      expect(el.tagName.toLowerCase()).toBe('button');
      expect(el.getAttribute('type')).toBe('button');
    }
  });

  it('keyboard activation (Enter) fires onSelect with the row item', async () => {
    const onSelect = vi.fn();
    render(<InboxList items={FIXTURE_ITEMS} onSelect={onSelect} />);
    const items = screen.getAllByRole('listitem');
    items[0].focus();
    expect(document.activeElement).toBe(items[0]);
    const user = userEvent.setup();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: FIXTURE_ITEMS[0].id }));
  });

  it('empty state announces via role=status', () => {
    render(<InboxList items={[]} onSelect={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent(/nothing here yet/i);
  });
});
