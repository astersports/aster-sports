// @vitest-environment jsdom
//
// PR 6-C — CoverageConflictBanner render contract. Locks: nothing renders
// with zero conflicts; a conflict cluster shows the coach name + each
// overlapping game; import games get a reassign dropdown excluding the
// conflicted coach; existing events render read-only; selecting a coach
// calls onDelegate(rowIdx, coachUserId) and clearing calls it with null.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import CoverageConflictBanner from '../CoverageConflictBanner';

afterEach(cleanup);

const coachNameMap = new Map([['kenny', 'Coach Kenny']]);
const coachOptions = [
  { user_id: 'kenny', name: 'Coach Kenny' },
  { user_id: 'darien', name: 'Coach Darien' },
];
const rows = [
  { delegated_coach_user_id: null }, // idx 0
  { delegated_coach_user_id: null }, // idx 1
];
const conflicts = [{
  coach_user_id: 'kenny',
  events: [
    { key: 'import-0', label: '10U Black vs CT Wolves' },
    { key: 'import-1', label: '9U Boys vs Hoop City' },
  ],
}];

describe('CoverageConflictBanner', () => {
  it('renders nothing with no conflicts', () => {
    const { container } = render(<CoverageConflictBanner conflicts={[]} coachNameMap={coachNameMap} coachOptions={coachOptions} rows={rows} onDelegate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the coach name and both overlapping games', () => {
    const { getByText, getAllByText } = render(<CoverageConflictBanner conflicts={conflicts} coachNameMap={coachNameMap} coachOptions={coachOptions} rows={rows} onDelegate={vi.fn()} />);
    expect(getAllByText(/Coverage conflict — Coach Kenny/).length).toBe(1);
    expect(getByText('10U Black vs CT Wolves')).toBeInTheDocument();
    expect(getByText('9U Boys vs Hoop City')).toBeInTheDocument();
  });

  it('reassign dropdown excludes the conflicted coach', () => {
    const { getByLabelText } = render(<CoverageConflictBanner conflicts={conflicts} coachNameMap={coachNameMap} coachOptions={coachOptions} rows={rows} onDelegate={vi.fn()} />);
    const sel = getByLabelText('Reassign 9U Boys vs Hoop City');
    const optionValues = [...sel.querySelectorAll('option')].map((o) => o.value);
    expect(optionValues).toContain('darien');
    expect(optionValues).not.toContain('kenny');
  });

  it('selecting a coach calls onDelegate(idx, coachId)', () => {
    const onDelegate = vi.fn();
    const { getByLabelText } = render(<CoverageConflictBanner conflicts={conflicts} coachNameMap={coachNameMap} coachOptions={coachOptions} rows={rows} onDelegate={onDelegate} />);
    fireEvent.change(getByLabelText('Reassign 9U Boys vs Hoop City'), { target: { value: 'darien' } });
    expect(onDelegate).toHaveBeenCalledWith(1, 'darien');
  });

  it('clearing back to keep calls onDelegate(idx, null)', () => {
    const onDelegate = vi.fn();
    const r2 = [{ delegated_coach_user_id: null }, { delegated_coach_user_id: 'darien' }];
    const { getByLabelText } = render(<CoverageConflictBanner conflicts={conflicts} coachNameMap={coachNameMap} coachOptions={coachOptions} rows={r2} onDelegate={onDelegate} />);
    fireEvent.change(getByLabelText('Reassign 9U Boys vs Hoop City'), { target: { value: '' } });
    expect(onDelegate).toHaveBeenCalledWith(1, null);
  });

  it('existing events render read-only (no dropdown)', () => {
    const mixed = [{ coach_user_id: 'kenny', events: [{ key: 'import-0', label: 'Game A' }, { key: 'existing-e9', label: 'vs Practice' }] }];
    const { getByText, queryByLabelText } = render(<CoverageConflictBanner conflicts={mixed} coachNameMap={coachNameMap} coachOptions={coachOptions} rows={rows} onDelegate={vi.fn()} />);
    expect(getByText('existing event')).toBeInTheDocument();
    expect(queryByLabelText('Reassign vs Practice')).toBeNull();
  });
});
