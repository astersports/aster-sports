import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

// Audit F-15 (wave 3, 2026-06-13): the redesigned schedule/home surfaces
// drifted off the locked type scale (24/20/17/15/13/11) with 9/10/12/14px
// one-offs + a fontWeight 800. This guard locks those three surfaces to
// the scale so the next edit can't re-introduce the drift (AP#43; also
// satisfies the AP#46 card-diff rule for EventCard/ActionRow changes).
// Scoped to these files — the rest of the app's de-facto sizes are out of
// scope for this sweep.

const SCALE = new Set([11, 13, 15, 17, 20, 24]);
const FILES = [
  'src/components/schedule/EventCard.jsx',
  'src/components/event/EventHeroActions.jsx',
  'src/components/home/ActionRow.jsx',
];

describe('typography scale conformance (F-15)', () => {
  it('every literal fontSize sits on the locked scale', () => {
    const bad = [];
    for (const f of FILES) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/fontSize:\s*(\d+)\b/g)) {
        if (!SCALE.has(Number(m[1]))) bad.push(`${f}: fontSize ${m[1]}`);
      }
    }
    expect(bad, `Off-scale font sizes (allowed ${[...SCALE].join('/')}):\n${bad.join('\n')}`).toEqual([]);
  });

  it('no fontWeight exceeds the 700 cap', () => {
    const bad = [];
    for (const f of FILES) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/fontWeight:\s*(\d+)\b/g)) {
        if (Number(m[1]) > 700) bad.push(`${f}: fontWeight ${m[1]}`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
