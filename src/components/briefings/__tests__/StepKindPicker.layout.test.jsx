// @vitest-environment jsdom
//
// Wave 4.4-B Session 5b — StepKindPicker layout test. Verifies tile
// count under three states: unfiltered, filtered subset, empty filter.
//
// Mocks useKindUsage to avoid the Supabase fetch dependency at test
// time. The hook returns deterministic empty maps so the picker
// renders all 9 KIND_METADATA tiles.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../../../hooks/useKindUsage', () => ({
  useKindUsage: () => ({ usageByKind: {}, countsByKind: {}, loading: false }),
}));

const { default: StepKindPicker } = await import('../../briefings/StepKindPicker');

afterEach(cleanup);

describe('StepKindPicker layout', () => {
  it('a. renders 9 KindTile children when no visibleKinds filter (full KIND_METADATA)', () => {
    render(<StepKindPicker onPick={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(9);
  });

  it('b. renders subset when visibleKinds=[announcement, custom_message]', () => {
    render(<StepKindPicker onPick={() => {}} visibleKinds={['announcement', 'custom_message']} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    const labels = buttons.map((b) => b.getAttribute('data-kind'));
    expect(labels).toContain('announcement');
    expect(labels).toContain('custom_message');
  });

  it('c. renders empty-state message when visibleKinds is an empty array', () => {
    render(<StepKindPicker onPick={() => {}} visibleKinds={[]} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(/No briefing types match this context/i)).toBeInTheDocument();
  });
});
