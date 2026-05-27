import { describe, expect, it } from 'vitest';
import { composeGamesRecap } from '../gamesRecap';
import { buildGamesSubject, summarizeGames } from '../gamesRecapHelpers';

const ORG = {
  name: 'Legacy Hoopers',
  branding: { eyebrowLink: 'https://lh.org/', contactEmail: 'info@lh.org', logoUrl: 'https://lh.org/logo.png' },
  coaches: [{ display_name: 'Coach Kenny', title: 'Coaching Director', phone: '555-1' }],
};

const GAMES = [
  { team_name: '10U Blue', opponent: '6th Boro 4AB', start_at: '2026-05-03T17:00:00Z', our_score: 24, opponent_score: 30, result: 'L', day_label: 'Sat, May 3' },
  { team_name: '10U Blue', opponent: 'Resurrection Blue 4AB', start_at: '2026-05-09T17:00:00Z', our_score: 25, opponent_score: 20, result: 'W', day_label: 'Sat, May 9' },
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
    expect(buildGamesSubject(GAMES, '1-1')).toBe('Games recap — 2 games (1-1)');
    expect(buildGamesSubject([GAMES[0]], '0-1')).toBe('Games recap — 1 game (0-1)');
  });
});

describe('composeGamesRecap', () => {
  const context = { org: ORG, games: GAMES, summary: summarizeGames(GAMES), subject: 'Games recap — 2 games (1-1)' };

  it('emits header + one stats_narrative per game + signoff + footer (existing renderers only)', () => {
    const { subject, content_sections } = composeGamesRecap(context, { kind: 'family' }, {});
    expect(subject).toBe('Games recap — 2 games (1-1)');
    const kinds = content_sections.map((s) => s.kind);
    expect(kinds).toEqual(['header', 'stats_narrative', 'stats_narrative', 'signoff', 'footer']);
    expect(content_sections[0].sub_context).toBe('1-1 · May 3–May 9');
    expect(content_sections[1].body).toBe('Sat, May 3 — 10U Blue 24 – 6th Boro 4AB 30 (L)');
  });

  it('appends override highlights as stats_narrative before signoff', () => {
    const { content_sections } = composeGamesRecap(context, { kind: 'family' }, { coach_note: 'Great bounce-back.' });
    const narratives = content_sections.filter((s) => s.kind === 'stats_narrative').map((s) => s.body);
    expect(narratives).toContain('Great bounce-back.');
  });

  it('throws on missing context or slice', () => {
    expect(() => composeGamesRecap(null, {})).toThrow();
    expect(() => composeGamesRecap(context, null)).toThrow();
  });
});
