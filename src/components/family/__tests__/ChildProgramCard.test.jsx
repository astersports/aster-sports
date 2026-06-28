// @vitest-environment jsdom
// Cross-surface invariant (AP#43 / AP#46) locking the bug-audit fix: a
// `futures_academy` enrollment must render the Futures-Academy badge, not the
// generic "Enrolled" fallback (the STATUS map was missing the key, so the
// spotlight detected futures via status while the card mislabeled it —
// PATTERN A, one concept / two renders). Pure render test; no Supabase.
import { describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import ChildProgramCard from '../ChildProgramCard';

const child = (status) => ({
  id: 'k1', firstName: 'Milo', grade: 3,
  enrollments: [{ programId: 'p1', status, programName: 'Spring Skills', programType: 'academy' }],
});

describe('ChildProgramCard — status badge invariant', () => {
  it('renders the Futures Academy badge for a futures_academy enrollment', () => {
    const { getByText } = render(<ChildProgramCard child={child('futures_academy')} />);
    expect(getByText('Futures Academy')).toBeTruthy();
    cleanup();
  });

  it('renders the Enrolled badge for a rostered enrollment', () => {
    const { getByText } = render(<ChildProgramCard child={child('enrolled')} />);
    expect(getByText('Enrolled')).toBeTruthy();
    cleanup();
  });

  it('falls back to Enrolled for an unknown status (no crash)', () => {
    const { getByText } = render(<ChildProgramCard child={child('mystery_state')} />);
    expect(getByText('Enrolled')).toBeTruthy();
    cleanup();
  });

  it('renders the empty-enrollment line without crashing', () => {
    const { getByText } = render(
      <ChildProgramCard child={{ id: 'k2', firstName: 'Ada', grade: 2, enrollments: [] }} />,
    );
    expect(getByText(/Not enrolled/i)).toBeTruthy();
    cleanup();
  });
});
