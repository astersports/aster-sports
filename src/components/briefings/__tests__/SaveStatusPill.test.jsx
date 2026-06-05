// @vitest-environment jsdom
//
// COMPOSE-FRONT P2 — SaveStatusPill state coverage, with the new `error`
// state that closes the silent-autosave-failure path. error wins over
// saving/saved so a failed save never reads as "Saved".

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import SaveStatusPill from '../SaveStatusPill';

afterEach(cleanup);

describe('SaveStatusPill', () => {
  it('renders nothing before a kind is picked and nothing has saved', () => {
    const { container } = render(<SaveStatusPill busy={false} savedAt={null} error={null} hasKind={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows Draft once a kind is picked', () => {
    render(<SaveStatusPill busy={false} savedAt={null} error={null} hasKind />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows Saving… while busy', () => {
    render(<SaveStatusPill busy savedAt={null} error={null} hasKind />);
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('shows Saved once savedAt is set', () => {
    render(<SaveStatusPill busy={false} savedAt={new Date()} error={null} hasKind />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('shows the error state and is announced assertively', () => {
    render(<SaveStatusPill busy={false} savedAt={new Date()} error={new Error('boom')} hasKind />);
    const pill = screen.getByText(/Couldn’t save — retry/);
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveAttribute('role', 'alert');
    expect(pill).toHaveAttribute('aria-live', 'assertive');
  });

  it('error wins over a stale savedAt (never reads "Saved" after a failed save)', () => {
    render(<SaveStatusPill busy={false} savedAt={new Date()} error={new Error('boom')} hasKind />);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });
});
