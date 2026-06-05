import { describe, expect, it } from 'vitest';
import { composeGamesRecap } from '../gamesRecap';
import { buildGamesSubject, summarizeGames } from '../gamesRecapHelpers';

const ORG = {
  name: 'Legacy Hoopers',
  branding: { eyebrowLink: 'https://lh.org/', contactEmail: 'info@lh.org', logoUrl: 'https://lh.org/logo.png' },
  coaches: [{ display_name: 'Coach Kenny', title: 'Coaching Director', phone: '555-1' }],
};

// Two DIFFERENT teams so the per-cell team-color invariant is exercised:
// 9U Boys (cyan) loss + 10U Blue (slate) win.
const GAMES = [
  { team_name: '9U Boys', team_color: '#06b6d4', opponent: '6th Boro 3AB', venue: 'CYO Spellman', start_at: '2026-05-03T17:00:00Z', our_score: 12, opponent_score: 13, result: 'L', day_label: 'Sat, May 3' },
  { team_name: '10U Blue', team_color: '#94a3b8', opponent: 'Resurrection Blue 4AB', venue: null, start_at: '2026-05-09T17:00:00Z', our_score: 25, opponent_score: 20, result: 'W', day_label: 'Sat, May 9' },
];

describe('summarizeGames', () => {
  it('computes W-L record + date range label', () => {
    const s = summarizeGames(GAMES);
    expect(s.record).toBe('1-1');
    expect(s.label).toBe('1-1 · May 3–May 9');
  });
  it('includes ties only when present, single-date collapses range', () => {
    expect(summarizeGames([{ result: 'T', start_at: '2026-05-03T17:00:00Z' }]).record).toBe('0-0-1');
    expect(summarizeGames([GAMES[0]]).label).toBe('0-1 · May 3');
  });
});

describe('buildGamesSubject', () => {
  it('pluralizes + includes record', () => {
    expect(buildGamesSubject(GAMES, '1-1')).toBe('Games recap: 2 games (1-1)');
    expect(buildGamesSubject([GAMES[0]], '0-1')).toBe('Games recap: 1 game (0-1)');
  });
});

describe('composeGamesRecap', () => {
  const context = { org: ORG, games: GAMES, summary: summarizeGames(GAMES), subject: 'Games recap: 2 games (1-1)' };

  it('emits the framed structure: frame + cobalt band + section bars + one recap_game_cell per game + signoff + footer', () => {
    const { subject, content_sections } = composeGamesRecap(context, { kind: 'family' }, {});
    expect(subject).toBe('Games recap: 2 games (1-1)');
    const kinds = content_sections.map((s) => s.kind);
    expect(kinds).toEqual([
      'frame_open', 'header', 'section_bar', 'recap_game_cell', 'recap_game_cell',
      'section_bar', 'signoff', 'footer', 'frame_close',
    ]);
    // Header band carries the record pill (cobalt_band variant)
    const header = content_sections[0 + 1];
    expect(header.variant).toBe('cobalt_band');
    expect(header.record_pill).toBe('1–1 RECORD · MAY 3 – MAY 9');
    // Section bars frame the results and the narrative
    const bars = content_sections.filter((s) => s.kind === 'section_bar').map((s) => s.label);
    expect(bars).toEqual(['The Weekend', 'From the Sideline']);
  });

  it('each cell carries its OWN game team_color (per-cell rail), toned W/L, date eyebrow, venue context', () => {
    const { content_sections } = composeGamesRecap(context, { kind: 'family' }, {});
    const cells = content_sections.filter((s) => s.kind === 'recap_game_cell');
    // Cell 0 — 9U Boys cyan rail, LOSS, venue present
    expect(cells[0]).toEqual({
      kind: 'recap_game_cell',
      team_color: '#06b6d4',
      date_label: 'Sun · May 3',
      matchup: '9U Boys vs 6th Boro 3AB',
      our_score: 12, opponent_score: 13, result: 'L',
      context: 'CYO Spellman',
    });
    // Cell 1 — 10U Blue slate rail, WIN, null venue -> no context key
    expect(cells[1]).toEqual({
      kind: 'recap_game_cell',
      team_color: '#94a3b8',
      date_label: 'Sat · May 9',
      matchup: '10U Blue vs Resurrection Blue 4AB',
      our_score: 25, opponent_score: 20, result: 'W',
    });
    expect(cells[1].context).toBeUndefined();
    // The per-cell color invariant: the two cells carry DIFFERENT rails.
    expect(cells[0].team_color).not.toBe(cells[1].team_color);
  });

  it('omits "vs {opponent}" gracefully when opponent is null', () => {
    const noOpp = { ...context, games: [{ ...GAMES[0], opponent: null }], summary: summarizeGames([GAMES[0]]) };
    const { content_sections } = composeGamesRecap(noOpp, { kind: 'family' }, {});
    const cell = content_sections.find((s) => s.kind === 'recap_game_cell');
    expect(cell.matchup).toBe('9U Boys');
    expect(JSON.stringify(cell)).not.toContain('undefined');
  });

  it('keeps override highlights as stats_narrative under "From the Sideline", before signoff', () => {
    const { content_sections } = composeGamesRecap(context, { kind: 'family' }, { coach_note: 'Great bounce-back.' });
    const kinds = content_sections.map((s) => s.kind);
    expect(kinds).toEqual([
      'frame_open', 'header', 'section_bar', 'recap_game_cell', 'recap_game_cell',
      'section_bar', 'stats_narrative', 'signoff', 'footer', 'frame_close',
    ]);
    const narratives = content_sections.filter((s) => s.kind === 'stats_narrative').map((s) => s.body);
    expect(narratives).toContain('Great bounce-back.');
  });

  it('compose is pure: same context+slice+overrides -> deeply-equal sections', () => {
    const norm = (v) => JSON.parse(JSON.stringify(v));
    const a = composeGamesRecap(context, { kind: 'family' }, { coach_note: 'x' });
    const b = composeGamesRecap(context, { kind: 'family' }, { coach_note: 'x' });
    expect(norm(a)).toEqual(norm(b));
  });

  it('throws on missing context or slice', () => {
    expect(() => composeGamesRecap(null, {})).toThrow();
    expect(() => composeGamesRecap(context, null)).toThrow();
  });
});
