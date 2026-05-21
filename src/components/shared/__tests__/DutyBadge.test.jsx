// @vitest-environment jsdom
//
// DutyBadge unit tests — locks the duty-type → icon mapping, label
// fallback to dutyType when no explicit label, compact size delta, and
// token-driven color contract per CLAUDE.md §3.

import { describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import DutyBadge from '../DutyBadge';

describe('DutyBadge', () => {
  it('renders nothing when dutyType is missing', () => {
    const { container } = render(<DutyBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an svg icon + the duty label', () => {
    const { container } = render(<DutyBadge dutyType="Scorekeeper" />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.textContent).toBe('Scorekeeper');
  });

  it('falls back to dutyType string when label not provided', () => {
    const { container } = render(<DutyBadge dutyType="Custom Task" />);
    expect(container.textContent).toBe('Custom Task');
  });

  it('prefers explicit label over dutyType', () => {
    const { container } = render(<DutyBadge dutyType="snacks" label="Snack Captain" />);
    expect(container.textContent).toBe('Snack Captain');
  });

  it('normalises duty type matching (case-insensitive, trimmed)', () => {
    // All four spellings should resolve to the same icon (Apple for snacks).
    const renders = ['snacks', 'SNACKS', '  Snacks  ', 'snack'].map((t) => {
      const r = render(<DutyBadge dutyType={t} />);
      const svg = r.container.querySelector('svg');
      const path = svg?.innerHTML;
      cleanup();
      return path;
    });
    // All four should resolve to the same icon path.
    renders.forEach((p) => expect(p).toBe(renders[0]));
  });

  it('uses token-driven colors only (no hardcoded hex)', () => {
    const { container } = render(<DutyBadge dutyType="Setup" />);
    const wrapper = container.firstChild;
    expect(wrapper.style.color).toContain('em-text-secondary');
    const svg = container.querySelector('svg');
    // lucide-react renders the color via the `stroke` attribute.
    expect(svg.getAttribute('stroke')).toContain('em-text-tertiary');
    // No raw hex should appear on the wrapper.
    expect(wrapper.outerHTML).not.toMatch(/#[0-9A-Fa-f]{3,6}/);
  });

  it('compact mode shrinks fontSize from 13 to 12', () => {
    const full = render(<DutyBadge dutyType="Photos" />);
    expect(full.container.firstChild.style.fontSize).toBe('13px');
    cleanup();
    const compact = render(<DutyBadge dutyType="Photos" compact />);
    expect(compact.container.firstChild.style.fontSize).toBe('12px');
  });
});
