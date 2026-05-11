// Wave 4.4-B Session 1 — pure-logic test for the deep-link param parser.
// Tests the pure parseBriefingDeepLink helper (no React, node env).
// The hook wrapper around it is covered indirectly by the integration
// path: route + URLSearchParams produce the same shape parseBriefingDeepLink
// returns directly.

import { describe, expect, it } from 'vitest';
import { parseBriefingDeepLink } from '../useBriefingDeepLink';

function params(obj) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) sp.set(k, v);
  return sp;
}

describe('parseBriefingDeepLink', () => {
  it('1. /admin/briefings with no params — composer should NOT open', () => {
    const r = parseBriefingDeepLink('/admin/briefings', params());
    expect(r.shouldOpenComposer).toBe(false);
    expect(r.composerInit).toBe(null);
    expect(r.isComposeRoute).toBe(false);
  });

  it('2. /admin/briefings/compose cold start — opens with null init', () => {
    const r = parseBriefingDeepLink('/admin/briefings/compose', params());
    expect(r.shouldOpenComposer).toBe(true);
    expect(r.isComposeRoute).toBe(true);
    expect(r.composerInit).toEqual({ draft_id: null, kind: null, anchor_kind: null, anchor_id: null });
  });

  it('3. /admin/briefings/compose?anchor=team&id=<uuid> — team anchor deep-link', () => {
    const r = parseBriefingDeepLink('/admin/briefings/compose', params({ anchor: 'team', id: 'team-uuid-1' }));
    expect(r.shouldOpenComposer).toBe(true);
    expect(r.composerInit.anchor_kind).toBe('team');
    expect(r.composerInit.anchor_id).toBe('team-uuid-1');
    expect(r.composerInit.kind).toBe(null);
  });

  it('4. legacy param names still resolve (anchor_kind/anchor_id/draft_id)', () => {
    const r = parseBriefingDeepLink('/admin/briefings', params({ draft_id: 'd1', anchor_kind: 'event', anchor_id: 'e1' }));
    expect(r.shouldOpenComposer).toBe(true);
    expect(r.composerInit.draft_id).toBe('d1');
    expect(r.composerInit.anchor_kind).toBe('event');
    expect(r.composerInit.anchor_id).toBe('e1');
  });

  it('5. new names win when both old and new are present', () => {
    const r = parseBriefingDeepLink('/admin/briefings', params({ anchor: 'team', anchor_kind: 'event', id: 't1', anchor_id: 'e1' }));
    expect(r.composerInit.anchor_kind).toBe('team');
    expect(r.composerInit.anchor_id).toBe('t1');
  });

  it('6. event anchor + kind deep-link (scaffold parsing for Sessions 5+)', () => {
    const r = parseBriefingDeepLink('/admin/briefings/compose', params({ anchor: 'event', id: 'e1', kind: 'rsvp_nudge' }));
    expect(r.composerInit.anchor_kind).toBe('event');
    expect(r.composerInit.anchor_id).toBe('e1');
    expect(r.composerInit.kind).toBe('rsvp_nudge');
  });

  it('7. /admin/briefings without /compose suffix + only kind param — opens', () => {
    const r = parseBriefingDeepLink('/admin/briefings', params({ kind: 'announcement' }));
    expect(r.shouldOpenComposer).toBe(true);
    expect(r.isComposeRoute).toBe(false);
    expect(r.composerInit.kind).toBe('announcement');
  });
});
