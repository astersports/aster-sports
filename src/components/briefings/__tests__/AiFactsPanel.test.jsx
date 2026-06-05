// @vitest-environment jsdom
//
// PR-D — AI facts panel. Locks: toggle (aria-expanded), verbatim fact rows,
// amber missing rows (never fabricated), and the count.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AiFactsPanel from '../AiFactsPanel';

afterEach(cleanup);

const facts = [
  { k: 'Final score', v: '38 – 31' },
  { k: 'Venue', v: 'Sportsplex' },
];

describe('AiFactsPanel', () => {
  it('renders nothing when there are no facts and no missing', () => {
    const { container } = render(<AiFactsPanel facts={[]} missing={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('toggle shows the fact count and starts collapsed (aria-expanded false)', () => {
    render(<AiFactsPanel facts={facts} missing={[]} />);
    const toggle = screen.getByRole('button', { name: /facts used · 2/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Final score')).toBeNull();
  });

  it('expands to show verbatim label/value rows', () => {
    render(<AiFactsPanel facts={facts} missing={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /facts used · 2/i }));
    expect(screen.getByRole('button', { name: /facts used · 2/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Final score')).toBeInTheDocument();
    expect(screen.getByText('38 – 31')).toBeInTheDocument();
  });

  it('renders a MISSING fact as an amber row, value "not on file" (never invented)', () => {
    render(<AiFactsPanel facts={facts} missing={['opponent record']} />);
    fireEvent.click(screen.getByRole('button', { name: /facts used · 2/i }));
    const miss = screen.getByText(/Missing · opponent record/);
    expect(miss).toBeInTheDocument();
    // amber tone applied via the warning token
    expect(miss).toHaveStyle({ color: 'var(--as-warning)' });
    expect(screen.getByText('not on file')).toBeInTheDocument();
  });

  it('count reflects only facts, not missing rows', () => {
    render(<AiFactsPanel facts={facts} missing={['a', 'b', 'c']} />);
    expect(screen.getByRole('button', { name: /facts used · 2/i })).toBeInTheDocument();
  });
});
