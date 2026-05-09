import { describe, expect, it } from 'vitest';
import { composeScheduleChange } from '../scheduleChange';
import scheduleChangeDiff from '../scheduleChangeDiff';

const before = { label: '11U Girls Practice', time: 'Wednesday May 13, 5:00 PM', location: 'WCC' };
const after = { label: '11U Girls Practice', time: 'Friday May 15, 5:00 PM', location: 'WCC' };

describe('composeScheduleChange', () => {
  it('produces header eyebrow + diff block + footer at minimum', () => {
    const out = composeScheduleChange({ summary: 'Practice moved.', before, after });
    expect(out.subject).toContain('Schedule update');
    expect(out.html).toContain('SCHEDULE CHANGE');
    expect(out.html).toContain('SCHEDULE UPDATE');
    expect(out.html).toContain('Practice moved.');
    expect(out.html).toContain('text-decoration:line-through');
    expect(out.html).toContain('font-weight:700');
    const kinds = out.sections.map((s) => s.kind);
    expect(kinds[0]).toBe('header');
    expect(kinds).toContain('schedule_change_diff');
    expect(kinds[kinds.length - 1]).toBe('footer');
  });

  it('omits summary section when summary is empty', () => {
    const out = composeScheduleChange({ summary: '', before, after });
    const kinds = out.sections.map((s) => s.kind);
    expect(kinds.includes('stats_narrative')).toBe(false);
  });

  it('renders signoff when prose or coaches present', () => {
    const out = composeScheduleChange({
      summary: 'Practice moved.', before, after,
      signoff_message: 'Sorry for the late switch.',
      coaches: [{ display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' }],
    });
    expect(out.html).toContain('Sorry for the late switch.');
    expect(out.html).toContain('Frank');
    expect(out.plainText).toContain('Sorry for the late switch.');
    expect(out.plainText).toContain('Frank');
  });

  it('plain-text path uses uppercase PREVIOUS / UPDATED prefixes (no markup)', () => {
    const out = composeScheduleChange({ summary: 'Moved.', before, after });
    expect(out.plainText).toContain('PREVIOUS:');
    expect(out.plainText).toContain('UPDATED:');
    expect(out.plainText).not.toContain('<');
  });
});

describe('scheduleChangeDiff section renderer', () => {
  it('renders both sides when both have fields', () => {
    const { html, plainText } = scheduleChangeDiff({ kind: 'schedule_change_diff', before, after });
    expect(html).toContain('PREVIOUS');
    expect(html).toContain('UPDATED');
    expect(html).toContain('Wednesday May 13');
    expect(html).toContain('Friday May 15');
    expect(plainText.split('\n').length).toBe(2);
  });

  it('skips a side when its fields are empty', () => {
    const { html } = scheduleChangeDiff({ kind: 'schedule_change_diff', before: {}, after });
    expect(html).not.toContain('PREVIOUS');
    expect(html).toContain('UPDATED');
  });
});
