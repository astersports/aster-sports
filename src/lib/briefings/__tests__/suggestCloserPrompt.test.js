import { describe, expect, it } from 'vitest';
import { buildSuggestCloserPrompt, parseSuggestCloserOutput } from '../suggestCloserPrompt';

describe('buildSuggestCloserPrompt', () => {
  it('includes team + tournament names verbatim', () => {
    const out = buildSuggestCloserPrompt({ tournamentName: 'Rumble for the Ring CT', teamName: '11U Girls' });
    expect(out).toContain('11U Girls');
    expect(out).toContain('Rumble for the Ring CT');
  });

  it('falls back to placeholders when team/tournament missing', () => {
    const out = buildSuggestCloserPrompt({});
    expect(out).toContain('(unknown team)');
    expect(out).toContain('(unnamed tournament)');
  });

  it('embeds scheduleGapsText when provided', () => {
    const out = buildSuggestCloserPrompt({
      tournamentName: 'T', teamName: 'X',
      scheduleGapsText: 'Saturday: 11:00 AM vs A → [2-hour gap] → 2:00 PM vs B',
    });
    expect(out).toContain('Saturday: 11:00 AM');
    expect(out).toContain('Schedule shape');
  });

  it('notes when schedule shape is not provided', () => {
    const out = buildSuggestCloserPrompt({ tournamentName: 'T', teamName: 'X' });
    expect(out).toContain('(not provided)');
  });

  it('inlines up to 5 voice examples as bulleted quotes', () => {
    const out = buildSuggestCloserPrompt({
      tournamentName: 'T', teamName: 'X',
      voiceExamples: ['Have fun. Play hard.', 'Drive safe.', 'See you out there.', '  ', null, 'Pizza after.', 'Good luck.', 'Extra one (should be dropped).'],
    });
    expect(out).toContain('Have fun. Play hard.');
    expect(out).toContain('Pizza after.');
    expect(out).toContain('Good luck.');
    // 6th valid example should be dropped (cap at 5)
    expect(out).not.toContain('Extra one');
    // null + whitespace-only entries dropped; count quoted example
    // lines (the STATIC_INSTRUCTIONS block also has "- " bullets so
    // we can't just count all "- " lines).
    const exampleSection = out.split('Recent closers from the same coach')[1] || '';
    const quotedLines = exampleSection.match(/^- "/gm) || [];
    expect(quotedLines.length).toBe(5);
  });

  it('notes when no voice examples are provided', () => {
    const out = buildSuggestCloserPrompt({ tournamentName: 'T', teamName: 'X' });
    expect(out).toContain('(none yet');
  });

  it('forbids sign-off cliché list is encoded in the prompt', () => {
    const out = buildSuggestCloserPrompt({});
    expect(out).toMatch(/leave it all on the floor/i);
    expect(out).toMatch(/sports clichés/i);
  });
});

describe('parseSuggestCloserOutput', () => {
  it('returns empty string for empty / non-string input', () => {
    expect(parseSuggestCloserOutput('')).toBe('');
    expect(parseSuggestCloserOutput(null)).toBe('');
    expect(parseSuggestCloserOutput(42)).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(parseSuggestCloserOutput('  hello world  ')).toBe('hello world');
  });

  it('strips markdown code fences', () => {
    expect(parseSuggestCloserOutput('```\nhello world\n```')).toBe('hello world');
    expect(parseSuggestCloserOutput('```text\nhello world\n```')).toBe('hello world');
  });

  it('strips surrounding quote marks', () => {
    expect(parseSuggestCloserOutput('"hello world"')).toBe('hello world');
    expect(parseSuggestCloserOutput("'hello world'")).toBe('hello world');
  });

  it('preserves internal quotes and punctuation', () => {
    expect(parseSuggestCloserOutput('She said "go" and meant it.')).toBe('She said "go" and meant it.');
  });
});
