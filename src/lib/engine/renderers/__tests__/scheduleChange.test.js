import { describe, expect, it } from 'vitest';
import { composeScheduleChange } from '../scheduleChange';
import scheduleChangeDiff from '../scheduleChangeDiff';

// 4 fixtures cover the field-by-field diff renderer:
//   - end-only: start unchanged, end +30 minutes (the production bug)
//   - location-only: time unchanged, location swapped
//   - cancellation: status flips to 'cancelled'
//   - multi-field: start, end, AND location all change
const startA = '2026-05-11T23:35:00.000Z';
const endA60 = '2026-05-12T00:35:00.000Z';
const endA90 = '2026-05-12T01:05:00.000Z';
const startB = '2026-05-15T23:35:00.000Z';
const endB = '2026-05-16T01:05:00.000Z';

describe('composeScheduleChange — sections + subject', () => {
  it('produces header + diff + footer at minimum', () => {
    const out = composeScheduleChange({
      summary: 'Practice moved.',
      before: { start_at: startA, end_at: endA60, location: 'WCC' },
      after: { start_at: startB, end_at: endB, location: 'WCC' },
      eventTitle: '11U Girls Skills Lab',
    });
    expect(out.subject).toBe('Schedule update — 11U Girls Skills Lab');
    expect(out.html).toContain('SCHEDULE CHANGE');
    expect(out.html).toContain('SCHEDULE UPDATE');
    expect(out.html).toContain('Practice moved.');
    const kinds = out.sections.map((s) => s.kind);
    expect(kinds[0]).toBe('header');
    expect(kinds).toContain('schedule_change_diff');
    expect(kinds[kinds.length - 1]).toBe('footer');
  });

  it('renders signoff when prose or coaches present', () => {
    const out = composeScheduleChange({
      summary: 'Practice moved.',
      before: { start_at: startA, end_at: endA60 }, after: { start_at: startB, end_at: endB },
      signoff_message: 'Sorry for the late switch.',
      coaches: [{ display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' }],
    });
    expect(out.html).toContain('Sorry for the late switch.');
    expect(out.html).toContain('Frank');
    expect(out.plainText).toContain('Sorry for the late switch.');
    expect(out.plainText).toContain('Frank');
  });
});

describe('scheduleChangeDiff — field-by-field rendering', () => {
  it('end-only change shows time RANGE so duration is visible (regression test for prod bug)', () => {
    const before = { start_at: startA, end_at: endA60, location: "St. Patrick's" };
    const after = { start_at: startA, end_at: endA90, location: "St. Patrick's" };
    const { html, plainText } = scheduleChangeDiff({ kind: 'schedule_change_diff', before, after });
    // HTML: previous AND next ranges differ
    expect(html).toContain('PREVIOUS · When');
    expect(html).toContain('UPDATED · When');
    // The two ranges must differ — no more "7:35 PM ... 7:35 PM" silent failure.
    const prevRange = (html.match(/text-decoration:line-through[^>]*">([^<]+)/) || [])[1];
    const nextRange = (html.match(/font-weight:700[^>]*">([^<]+)/) || [])[1];
    expect(prevRange).toBeTruthy();
    expect(nextRange).toBeTruthy();
    expect(prevRange).not.toBe(nextRange);
    // No location change → location row not rendered
    expect(html).not.toContain('PREVIOUS · Where');
    // Plain text PREVIOUS/UPDATED prefixes present
    expect(plainText).toContain('PREVIOUS When:');
    expect(plainText).toContain('UPDATED When:');
  });

  it('location-only change shows location, suppresses time row', () => {
    const before = { start_at: startA, end_at: endA60, location: 'WCC' };
    const after = { start_at: startA, end_at: endA60, location: 'Trustees Gym' };
    const { html, plainText } = scheduleChangeDiff({ kind: 'schedule_change_diff', before, after });
    expect(html).toContain('PREVIOUS · Where');
    expect(html).toContain('UPDATED · Where');
    expect(html).toContain('WCC');
    expect(html).toContain('Trustees Gym');
    expect(html).not.toContain('PREVIOUS · When');
    expect(plainText).toContain('PREVIOUS Where: WCC');
    expect(plainText).toContain('UPDATED Where: Trustees Gym');
  });

  it('cancellation renders prominent CANCELLED callout, suppresses time/location rows', () => {
    const before = { start_at: startA, end_at: endA60, location: 'WCC', status: 'scheduled' };
    const after = { start_at: startA, end_at: endA60, location: 'WCC', status: 'cancelled' };
    const { html, plainText } = scheduleChangeDiff({ kind: 'schedule_change_diff', before, after });
    expect(html).toContain('CANCELLED');
    expect(html).toContain('This event has been cancelled.');
    expect(html).not.toContain('PREVIOUS · When');
    expect(html).not.toContain('PREVIOUS · Where');
    expect(plainText).toContain('CANCELLED:');
  });

  it('multi-field change renders both When and Where rows', () => {
    const before = { start_at: startA, end_at: endA60, location: 'WCC' };
    const after = { start_at: startB, end_at: endB, location: 'Trustees Gym' };
    const { html, plainText } = scheduleChangeDiff({ kind: 'schedule_change_diff', before, after, eventTitle: '11U Girls Skills Lab' });
    expect(html).toContain('PREVIOUS · When');
    expect(html).toContain('UPDATED · When');
    expect(html).toContain('PREVIOUS · Where');
    expect(html).toContain('UPDATED · Where');
    expect(html).toContain('11U Girls Skills Lab');
    expect(plainText).toContain('11U Girls Skills Lab');
    expect(plainText).toContain('PREVIOUS When:');
    expect(plainText).toContain('PREVIOUS Where:');
  });

  it('opponent-only change renders Opponent row with TBD fallback (Frank 11U Girls championship, 2026-05-20)', () => {
    const before = { start_at: startA, end_at: endA60, location: 'WCC', opponent: null };
    const after = { start_at: startA, end_at: endA60, location: 'WCC', opponent: 'PHD - McCurdy' };
    const { html, plainText } = scheduleChangeDiff({ kind: 'schedule_change_diff', before, after });
    expect(html).toContain('PREVIOUS · Opponent');
    expect(html).toContain('TBD');
    expect(html).toContain('UPDATED · Opponent');
    expect(html).toContain('PHD - McCurdy');
    expect(plainText).toContain('PREVIOUS Opponent: TBD');
    expect(plainText).toContain('UPDATED Opponent: PHD - McCurdy');
  });

  it('no changes returns empty html and plainText (defensive)', () => {
    const same = { start_at: startA, end_at: endA60, location: 'WCC' };
    const out = scheduleChangeDiff({ kind: 'schedule_change_diff', before: same, after: same });
    expect(out.html).toBe('');
    expect(out.plainText).toBe('');
  });

  it('plain-text path uses no HTML markup', () => {
    const before = { start_at: startA, end_at: endA60 };
    const after = { start_at: startA, end_at: endA90 };
    const { plainText } = scheduleChangeDiff({ kind: 'schedule_change_diff', before, after });
    expect(plainText).not.toContain('<');
    expect(plainText).not.toContain('strikethrough');
  });
});
