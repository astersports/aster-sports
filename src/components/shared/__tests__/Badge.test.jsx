// @vitest-environment jsdom
// Badge unit tests + cross-surface pill audit (anti-pattern #43 + #46).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import Badge from '../Badge';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(__filename), '..', '..', '..', '..');

const VARIANT_CASES = [
  ['success', 'as-success-soft', 'as-success'], ['warning', 'as-warning-soft', 'as-warning'],
  ['danger',  'as-danger-soft',  'as-danger'],  ['info',    'as-info-soft',    'as-info'],
  ['neutral', 'as-neutral-soft', 'as-neutral'], ['academy', 'as-academy-soft', 'as-academy'],
  ['accent',  'as-accent-soft',  'as-accent'],  ['urgent',  'as-accent',       'as-text-inverse'],
  ['subtle',  'as-bg-tertiary',  'as-text-tertiary'],
];

describe('Badge', () => {
  it('renders rectangular by default (borderRadius 6)', () => {
    const { container } = render(<Badge>Hello</Badge>);
    expect(container.firstChild.style.borderRadius).toBe('6px');
    expect(container.textContent).toBe('Hello');
  });
  it('renders pill shape with borderRadius:999 when pill=true', () => {
    const { container } = render(<Badge pill>x</Badge>);
    expect(container.firstChild.style.borderRadius).toBe('999px');
  });
  it.each(VARIANT_CASES)('maps variant=%s to (%s, %s) in pill mode', (variant, bg, fg) => {
    const { container } = render(<Badge pill variant={variant}>x</Badge>);
    expect(container.firstChild.style.backgroundColor).toContain(bg);
    expect(container.firstChild.style.color).toContain(fg);
  });
  it('compact mode shrinks padding + font in pill mode', () => {
    const full = render(<Badge pill>x</Badge>);
    expect(full.container.firstChild.style.padding).toBe('2px 8px');
    expect(full.container.firstChild.style.fontSize).toBe('11px');
    cleanup();
    const compact = render(<Badge pill compact>x</Badge>);
    expect(compact.container.firstChild.style.padding).toBe('1px 6px');
    expect(compact.container.firstChild.style.fontSize).toBe('10px');
  });
  it('style prop merges without overriding borderRadius:999', () => {
    const { container } = render(<Badge pill style={{ marginLeft: 'auto', borderRadius: 4 }}>x</Badge>);
    expect(container.firstChild.style.marginLeft).toBe('auto');
    expect(container.firstChild.style.borderRadius).toBe('999px');
  });
});

// Files allowed to keep inline pill spans (see PR commit message for reasons).
const INLINE_REMAINING = new Set([
  'src/components/tournament/TournamentHeader.jsx',
  'src/components/tournament/TournamentListItem.jsx',
  'src/components/briefings/inbox/ActionQueueRow.jsx',
  'src/components/briefings/inbox/InboxFilters.jsx',
  'src/components/briefings/PilotModeChip.jsx',
  'src/components/briefings/SaveStatusPill.jsx',
  'src/components/ride/ClaimStatusPill.jsx',
  'src/components/alerts/AllClearPill.jsx',
  'src/components/admin/CutoverGateChip.jsx',
  'src/components/shared/Badge.jsx',
]);

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(jsx|js)$/.test(name) && !/\.test\.|__tests__/.test(p)) acc.push(p);
  }
  return acc;
}

describe('Badge cross-surface pill audit', () => {
  it('inline pill-label spans live only in the inline-remaining set', () => {
    // Pill LABEL discriminator: tight inline style object carrying
    // borderRadius:999/9999 + small fontSize (10-13) + small padding
    // (e.g. '2px 8px', '3px 8px') on the same style block. Excludes
    // buttons/toggles (which have minHeight + cursor) and circles/avatars
    // (which have width === height, no fontSize).
    const root = REPO_ROOT;
    const files = [...walk(join(root, 'src/components')), ...walk(join(root, 'src/pages'))];
    const violations = files.filter((file) => {
      const text = readFileSync(file, 'utf8');
      // Match a style block (curly-delimited) containing all three markers.
      const styleBlocks = text.match(/\{[^{}]{0,400}\}/g) || [];
      return styleBlocks.some((b) =>
        /borderRadius:\s*9{3,4}/.test(b)
        && /fontSize:\s*1[0-3]\b/.test(b)
        && /padding:\s*['"]\d+px\s+\d+px['"]/.test(b)
        && !/minHeight/.test(b)
        && !/cursor:\s*['"]pointer/.test(b)
      );
    }).map((f) => relative(root, f).replace(/\\/g, '/')).filter((rel) => !INLINE_REMAINING.has(rel));
    expect(violations).toEqual([]);
  });
});
