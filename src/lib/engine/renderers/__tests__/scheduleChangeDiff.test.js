// AP #43 invariant test — scheduleChangeDiff renderer MUST consume the exact
// shape emitted by the composer's buildDiffSection (resolvers/scheduleChangeHelpers.js).
// Regression guard: a prior version of this renderer read section.before.start_at
// / .status (raw event-row shape) which buildDiffSection never emits, so the
// was/now card silently rendered empty. This test drives the renderer with REAL
// buildDiffSection output and asserts the swap rows are non-empty.

import { describe, expect, it } from 'vitest';
import render from '../scheduleChangeDiff';
import { buildDiffSection } from '../../resolvers/scheduleChangeHelpers';
import fixtureSections from '../../resolvers/__tests__/fixtures/schedule_change_skills_lab/expected_content_sections.json';

describe('scheduleChangeDiff', () => {
  it('consumes the exact buildDiffSection output shape (end_at change)', () => {
    const event = { title: '11U Girls Skills Lab', event_type: 'skills_lab' };
    const before = { start_at: '2026-05-11T23:35:00Z', end_at: '2026-05-12T00:35:00Z', location: "St. Patrick's", opponent: null };
    const after = { start_at: '2026-05-11T23:35:00Z', end_at: '2026-05-12T01:05:00Z', location: "St. Patrick's", opponent: null };
    const section = buildDiffSection(event, null, before, after, ['end_at']);

    const { html, plainText } = render(section);
    // Non-empty was/now card.
    expect(html).not.toEqual('');
    expect(html).toContain('PREVIOUS · When');
    expect(html).toContain('UPDATED · When');
    // The pre-formatted before/after time strings render verbatim.
    expect(html).toContain(section.before.time);
    expect(html).toContain(section.after.time);
    expect(plainText).toContain(`PREVIOUS When: ${section.before.time}`);
    expect(plainText).toContain(`UPDATED When: ${section.after.time}`);
  });

  it('renders the live schedule_change fixture diff section non-empty', () => {
    const section = fixtureSections.find((s) => s.kind === 'schedule_change_diff');
    expect(section).toBeTruthy();
    const { html } = render(section);
    expect(html).not.toEqual('');
    expect(html).toContain('Monday, May 11 from 7:35 PM to 8:35 PM'); // before.time
    expect(html).toContain('Monday, May 11 from 7:35 PM to 9:05 PM'); // after.time
  });

  it('renders a location + opponent change', () => {
    const event = { title: '10U Black Game', event_type: 'game' };
    const before = { start_at: '2026-05-11T23:00:00Z', end_at: null, location: 'WCC', opponent: 'Hawks' };
    const after = { start_at: '2026-05-11T23:00:00Z', end_at: null, location: 'St. Patrick\'s', opponent: 'Eagles' };
    const section = buildDiffSection(event, null, before, after, ['location', 'opponent']);
    const { html, plainText } = render(section);
    expect(html).toContain('PREVIOUS · Where');
    expect(html).toContain('UPDATED · Where');
    expect(html).toContain('PREVIOUS · Opponent');
    expect(plainText).toContain('PREVIOUS Where: WCC');
    expect(plainText).toContain("UPDATED Where: St. Patrick's");
    expect(plainText).toContain('PREVIOUS Opponent: Hawks');
  });

  it('returns empty html/plainText when no fields changed', () => {
    const section = { kind: 'schedule_change_diff', changed_fields: [], before: {}, after: {} };
    expect(render(section)).toEqual({ html: '', plainText: '' });
  });

  it('escapes HTML in field values', () => {
    const section = {
      kind: 'schedule_change_diff',
      changed_fields: ['location'],
      before: { time: '', label: '', location: '<script>x</script>', opponent: null },
      after: { time: '', label: '', location: 'safe', opponent: null },
    };
    const { html } = render(section);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
