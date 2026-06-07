// @vitest-environment jsdom
//
// A2 (Part A) — kind-picker grouping invariant + render. Architect ruled Option B
// (Recaps / Outreach / Guides), static order, single-item headers kept. The
// load-bearing guard (AP#43): KIND_GROUPS must cover MANUAL_KINDS EXACTLY — no
// duplicate, no kind that falls out of the picker, none invented — so adding a
// 6th manual kind later can't silently leave it unpickable.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import InlineKindChips from '../InlineKindChips';
import { KIND_GROUPS, MANUAL_KINDS } from '../../../lib/briefings/composeKinds';
import { KIND_METADATA } from '../../../lib/briefings/kindMetadata';

afterEach(cleanup);

describe('InlineKindChips grouping (A2, AP#43)', () => {
  it('KIND_GROUPS covers MANUAL_KINDS exactly — each kind once, none missing/extra', () => {
    const grouped = KIND_GROUPS.flatMap((g) => g.kinds);
    expect(new Set(grouped).size).toBe(grouped.length); // no duplicates
    expect([...grouped].sort()).toEqual([...MANUAL_KINDS].sort()); // same set
  });

  it('groups are Recaps / Outreach / Guides in order (Option B + static rank)', () => {
    expect(KIND_GROUPS.map((g) => g.label)).toEqual(['Recaps', 'Outreach', 'Guides']);
    expect(KIND_GROUPS.find((g) => g.label === 'Outreach').kinds).toEqual(['announcement', 'custom_message']);
    expect(KIND_GROUPS.find((g) => g.label === 'Guides').kinds).toEqual(['coach_roundup', 'family_guide']);
  });

  it('renders all three group headers — incl. the single-item Recaps header (KEEP #3)', () => {
    render(<InlineKindChips selected={null} onPick={() => {}} />);
    ['Recaps', 'Outreach', 'Guides'].forEach((h) => expect(screen.getByText(h)).toBeInTheDocument());
  });

  it('renders exactly one chip per manual kind (5 total) with its metadata label', () => {
    render(<InlineKindChips selected={null} onPick={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(MANUAL_KINDS.length);
    MANUAL_KINDS.forEach((k) => expect(screen.getByText(KIND_METADATA[k].label)).toBeInTheDocument());
  });

  it('marks the selected chip pressed and dispatches kind + meta on pick (by label, order-agnostic)', () => {
    const onPick = vi.fn();
    render(<InlineKindChips selected="games_recap" onPick={onPick} />);
    const pressed = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent).toBe(KIND_METADATA.games_recap.label);
    fireEvent.click(screen.getByText(KIND_METADATA.announcement.label));
    expect(onPick).toHaveBeenCalledWith('announcement', KIND_METADATA.announcement);
  });
});
