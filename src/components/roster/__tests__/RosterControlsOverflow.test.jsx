// @vitest-environment jsdom
//
// 2026-05-22 — locks the iPhone-width overflow fix in RosterControls.
// The 4-chip staff sort row [# A-Z Age Att] sits next to a flex:1 search
// input. Without `minWidth: 0` on the search container, the input's
// intrinsic content width acts as a floor and the row bleeds off the
// right edge.
//
// Pattern (per AP #43): cross-surface invariant test pins the structural
// requirement so future refactors can't silently regress.

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import RosterControls from '../RosterControls';

function setup(role) {
  return render(
    <RosterControls search="" setSearch={() => {}} sortBy="jersey" setSortBy={() => {}} role={role} />,
  );
}

describe('RosterControls — iPhone-width overflow fix', () => {
  it('1. search container has minWidth: 0 so flex can shrink the input below its intrinsic content width', () => {
    const { container } = setup('admin');
    // Find the search container — the flex:1 wrapper around the input.
    const flexRow = container.firstChild.firstChild;
    const searchContainer = flexRow.children[0];
    expect(searchContainer.style.flex).toBe('1 1 0%');
    expect(searchContainer.style.minWidth).toBe('0px');
  });

  it('2. sort toggle container has flexShrink: 0 so it does not shrink below its natural chip width', () => {
    const { container } = setup('admin');
    const flexRow = container.firstChild.firstChild;
    const sortContainer = flexRow.children[1];
    expect(sortContainer.style.flexShrink).toBe('0');
  });

  it('3. admin/coach sees the full 4-chip set [# A-Z Age Att]', () => {
    const { container } = setup('admin');
    const sortContainer = container.firstChild.firstChild.children[1];
    const labels = Array.from(sortContainer.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual(['#', 'A-Z', 'Age', 'Att']);
  });

  it('4. parent sees the 2-chip set [# A-Z] only (no overflow risk at iPhone width)', () => {
    const { container } = setup('parent');
    const sortContainer = container.firstChild.firstChild.children[1];
    const labels = Array.from(sortContainer.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual(['#', 'A-Z']);
  });
});
