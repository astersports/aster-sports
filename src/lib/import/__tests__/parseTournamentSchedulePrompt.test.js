import { describe, expect, it } from 'vitest';
import { buildPrompt, parseClaudeOutput } from '../parseTournamentSchedulePrompt';

describe('parseTournamentSchedulePrompt — buildPrompt', () => {
  it('embeds team list + venue list in the prompt', () => {
    const teams = [{ name: '11U Girls' }, { name: '10U Black' }];
    const venues = [{ name: 'Insports Center' }];
    const prompt = buildPrompt('paste content here', { teams, venues });
    expect(prompt).toContain('- 11U Girls');
    expect(prompt).toContain('- 10U Black');
    expect(prompt).toContain('- Insports Center');
    expect(prompt).toContain('paste content here');
    expect(prompt).toContain('7-line repeating pattern');
    expect(prompt).toContain('Pool Standings sections must be IGNORED');
  });

  it('falls back to "(none)" when team or venue list is empty', () => {
    const prompt = buildPrompt('x', { teams: [], venues: [] });
    expect(prompt).toMatch(/teams[^]*\(none\)/);
    expect(prompt).toMatch(/venues[^]*\(none\)/);
  });
});

describe('parseTournamentSchedulePrompt — parseClaudeOutput', () => {
  it('parses clean JSON array of event objects', () => {
    const raw = JSON.stringify([
      { team: '11U Girls', date: '5/16', time: '11:00 AM', opponent: 'CT Northstars', venue: 'Insports Center', court: 'Court 3', home_away: 'home' },
    ]);
    const rows = parseClaudeOutput(raw);
    expect(rows).toHaveLength(1);
    expect(rows[0].team).toBe('11U Girls');
    expect(rows[0].home_away).toBe('home');
  });

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n[]\n```';
    expect(parseClaudeOutput(raw)).toEqual([]);
  });

  it('coerces home_away to "home" when not literally "away"', () => {
    const raw = JSON.stringify([{ team: 'X', date: '5/16', time: '11:00 AM', opponent: 'Y', venue: 'V', court: '1', home_away: 'random' }]);
    const rows = parseClaudeOutput(raw);
    expect(rows[0].home_away).toBe('home');
  });

  it('throws on empty input', () => {
    expect(() => parseClaudeOutput('')).toThrow(/Empty parser output/);
  });

  it('throws on malformed JSON', () => {
    expect(() => parseClaudeOutput('{not valid')).toThrow(/Malformed JSON/);
  });

  it('throws when output is not an array', () => {
    expect(() => parseClaudeOutput('{"foo":1}')).toThrow(/not an array/);
  });

  it('throws when row is not an object', () => {
    expect(() => parseClaudeOutput('[1, 2]')).toThrow(/Row 0 is not an object/);
  });

  it('handles paste-error scenarios (multi-tournament accidental paste — outputs all events; resolver deduplicates downstream)', () => {
    const raw = JSON.stringify([
      { team: '11U Girls', date: '5/16', time: '11:00 AM', opponent: 'X', venue: 'V', court: '1', home_away: 'home' },
      { team: '11U Girls', date: '6/20', time: '11:00 AM', opponent: 'Y', venue: 'V', court: '1', home_away: 'home' },
    ]);
    const rows = parseClaudeOutput(raw);
    expect(rows).toHaveLength(2);
    // out-of-range second row gets caught downstream by validateParsedRow
  });

  it('treats missing optional fields as empty strings', () => {
    const raw = JSON.stringify([{ team: '11U Girls', date: '5/16', time: '11:00 AM', opponent: 'X' }]);
    const rows = parseClaudeOutput(raw);
    expect(rows[0].venue).toBe('');
    expect(rows[0].court).toBe('');
  });
});
