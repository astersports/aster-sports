import { describe, expect, it } from 'vitest';
import { composeWeeklyDigest } from '../weeklyDigest';
import { emptyWeek, multiTeam, singleTeam, tournamentWeekend } from '../../__fixtures__/weeklyDigest';

describe('composeWeeklyDigest', () => {
  it('single-team family — schedule shows just that team color stripe', () => {
    const out = composeWeeklyDigest(singleTeam);
    expect(out.subject).toBe('Week ahead — May 11–17');
    expect(out.teams_included).toEqual(['t-10b']);
    expect(out.html).toContain('WEEK AHEAD');
    expect(out.html).toContain('border-left:5px solid #18181B'); // 10U Black stripe
    expect(out.html).not.toContain('#7C3AED'); // no other team colors
    expect(out.plainText).toContain('Quick week');
    expect(out.sections.some((s) => s.kind === 'weekly_schedule')).toBe(true);
  });

  it('multi-team Samaritano shape — both teams interleave chronologically', () => {
    const out = composeWeeklyDigest(multiTeam);
    expect(out.teams_included).toEqual(expect.arrayContaining(['t-11u', 't-8u']));
    // Both team colors render in stripe borders.
    expect(out.html).toContain('border-left:5px solid #7C3AED'); // 11U Girls
    expect(out.html).toContain('border-left:5px solid #EA580C'); // 8U Boys
    // Day-label ordering proves the schedule interleaves chronologically:
    // Tue 5/12 (8U Boys) before Wed 5/13 (11U Girls) before Sat 5/16 (11U Girls game).
    const may12 = out.html.indexOf('MAY 12');
    const may13 = out.html.indexOf('MAY 13');
    const may16 = out.html.indexOf('MAY 16');
    expect(may12).toBeGreaterThan(0);
    expect(may13).toBeGreaterThan(may12);
    expect(may16).toBeGreaterThan(may13);
    expect(out.html).toContain('Stagger your snack runs');
  });

  it('tournament weekend — Fri/Sat/Sun derive correct placeholder labels', () => {
    const out = composeWeeklyDigest(tournamentWeekend);
    // Fri 5/15 before Sat-start tournament → "see Thursday email"
    expect(out.html).toContain('see Thursday email');
    // Sat 5/16 → "pool play"
    expect(out.html).toContain('pool play');
    // Sun 5/17 with bracket_day_count > 0 → "championship day"
    expect(out.html).toContain('championship day');
    // tournament_placeholder variant uses cream bg + gold border
    expect(out.html).toContain('background-color:#fffbeb');
    expect(out.html).toContain('border:1px solid #fbbf24');
  });

  it('empty week — header + signoff render but no schedule section', () => {
    const out = composeWeeklyDigest(emptyWeek);
    expect(out.html).toContain('WEEK AHEAD');
    expect(out.sections.find((s) => s.kind === 'weekly_schedule')).toBeUndefined();
    // Empty signoff_message + empty body_notes → minimal sections.
    expect(out.sections.find((s) => s.kind === 'stats_narrative')).toBeUndefined();
    expect(out.sections.find((s) => s.kind === 'signoff')).toBeDefined(); // coaches still render signature
  });

  it('snapshot — multi-team baseline', () => {
    expect(composeWeeklyDigest(multiTeam)).toMatchSnapshot();
  });
});
