import { describe, expect, it } from 'vitest';
import { composeWeeklyDigest } from '../weeklyDigest';
import { emptyWeek, multiTeam, singleTeam, tournamentWeekend } from '../../__fixtures__/weeklyDigest';

describe('composeWeeklyDigest', () => {
  it('single-team family — schedule shows just that team color stripe', () => {
    const out = composeWeeklyDigest(singleTeam);
    expect(out.subject).toBe('Week ahead — May 11–17');
    expect(out.teams_included).toEqual(['t-10b']);
    expect(out.html).toContain('WEEK AHEAD');
    expect(out.html).toContain('border-left:5px solid #4a8fd4'); // 10U Black cobalt (v14)
    expect(out.html).not.toContain('#a78bfa'); // no other team colors
    expect(out.plainText).toContain('Quick week');
    expect(out.sections.some((s) => s.kind === 'weekly_schedule')).toBe(true);
  });

  it('multi-team Samaritano shape — both teams interleave chronologically', () => {
    const out = composeWeeklyDigest(multiTeam);
    expect(out.teams_included).toEqual(expect.arrayContaining(['t-11u', 't-8u']));
    expect(out.html).toContain('border-left:5px solid #a78bfa'); // 11U Girls violet (v14)
    expect(out.html).toContain('border-left:5px solid #f59e0b'); // 8U Boys amber (v14)
    const may12 = out.html.indexOf('MAY 12');
    const may13 = out.html.indexOf('MAY 13');
    const may16 = out.html.indexOf('MAY 16');
    expect(may12).toBeGreaterThan(0);
    expect(may13).toBeGreaterThan(may12);
    expect(may16).toBeGreaterThan(may13);
    expect(out.html).toContain('Stagger your snack runs');
  });

  it('header eyebrow defaults to legacyhoopers.org link for digest kind', () => {
    const out = composeWeeklyDigest(multiTeam);
    expect(out.html).toContain('href="https://www.legacyhoopers.org/"');
    expect(out.html).toMatch(/<a[^>]*>Legacy Hoopers · WEEKLY DIGEST<\/a>/);
    expect(out.plainText).toContain('LEGACY HOOPERS · WEEKLY DIGEST · legacyhoopers.org');
  });

  it('event location_link renders inline " · map" link', () => {
    const out = composeWeeklyDigest(multiTeam);
    expect(out.html).toContain('href="https://maps.google.com/?q=WCC"');
    expect(out.html).toContain('href="https://maps.google.com/?q=Stamford+Sportsplex"');
    expect(out.html).toMatch(/·\s*<a[^>]+>map<\/a>/);
    expect(out.plainText).toContain('https://maps.google.com/?q=WCC');
  });

  it('rsvp_counts render with color-coded spans, zero-state shows muted "no RSVPs yet"', () => {
    const out = composeWeeklyDigest(multiTeam);
    // Wave 3.7 §D-RSVP-1: each count colored to its tone, separators
    // remain in TEXT_GRAPHITE (#475569).
    expect(out.html).toContain('color:#16a34a;font-weight:500;">8 going');
    expect(out.html).toContain('color:#d97706;font-weight:500;">2 maybe');
    expect(out.html).toContain('color:#dc2626;font-weight:500;">1 out');
    expect(out.html).toContain('color:#16a34a;font-weight:500;">12 going');
    expect(out.html).toContain('color:#dc2626;font-weight:500;">0 out');
    expect(out.html).toContain('no RSVPs yet'); // e2 (all zero)
    // Plain-text path stays uncolored, just words + separators.
    expect(out.plainText).toContain('8 going · 2 maybe · 1 out');
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
