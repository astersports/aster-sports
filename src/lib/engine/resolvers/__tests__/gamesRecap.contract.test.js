import { describe, expect, it } from 'vitest';
import { composeGamesRecap } from '../gamesRecap';
import { buildGamesSubject, summarizeGames } from '../gamesRecapHelpers';

const ORG = {
  name: 'Legacy Hoopers',
  branding: { eyebrowLink: 'https://lh.org/', contactEmail: 'info@lh.org', logoUrl: 'https://lh.org/logo.png' },
  coaches: [{ display_name: 'Coach Kenny', title: 'Coaching Director', phone: '555-1' }],
};

const GAMES = [
  { team_name: '10U Blue', team_color: '#94a3b8', opponent: '6th Boro 4AB', venue: 'CYO Spellman', start_at: '2026-05-03T17:00:00Z', our_score: 24, opponent_score: 30, result: 'L', day_label: 'Sat, May 3' },
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

  it('emits header + one game_card per game + signoff + footer (reuses tournament_prelim game_card renderer)', () => {
    const { subject, content_sections } = composeGamesRecap(context, { kind: 'family' }, {});
    expect(subject).toBe('Games recap: 2 games (1-1)');
    const kinds = content_sections.map((s) => s.kind);
    expect(kinds).toEqual(['header', 'game_card', 'game_card', 'signoff', 'footer']);
    expect(content_sections[0].sub_context).toBe('1-1 · May 3–May 9');
  });

  it('maps each game to a toned game_card (rail/primary/stake/team_color/venue)', () => {
    const { content_sections } = composeGamesRecap(context, { kind: 'family' }, {});
    const cards = content_sections.filter((s) => s.kind === 'game_card');
    // Loss — red tone, venue present
    expect(cards[0]).toEqual({
      kind: 'game_card', variant: 'regular',
      rail: { label: 'Sun 5/3', timePrimary: '1:00 PM' },
      primary: '10U Blue vs 6th Boro 4AB',
      stakeLine: { text: '24–30 · Loss', tone: 'red' },
      team_color: '#94a3b8',
      secondary: { text: 'CYO Spellman', link: null },
    });
    // Win — green tone, null venue -> no secondary key emitted
    expect(cards[1]).toEqual({
      kind: 'game_card', variant: 'regular',
      rail: { label: 'Sat 5/9', timePrimary: '1:00 PM' },
      primary: '10U Blue vs Resurrection Blue 4AB',
      stakeLine: { text: '25–20 · Win', tone: 'green' },
      team_color: '#94a3b8',
    });
    expect(cards[1].secondary).toBeUndefined();
  });

  it('omits "vs {opponent}" gracefully when opponent is null', () => {
    const noOpp = { ...context, games: [{ ...GAMES[0], opponent: null }], summary: summarizeGames([GAMES[0]]) };
    const { content_sections } = composeGamesRecap(noOpp, { kind: 'family' }, {});
    const card = content_sections.find((s) => s.kind === 'game_card');
    expect(card.primary).toBe('10U Blue');
    expect(JSON.stringify(card)).not.toContain('undefined');
  });

  it('keeps override highlights as stats_narrative AFTER the game cards, before signoff', () => {
    const { content_sections } = composeGamesRecap(context, { kind: 'family' }, { coach_note: 'Great bounce-back.' });
    const kinds = content_sections.map((s) => s.kind);
    expect(kinds).toEqual(['header', 'game_card', 'game_card', 'stats_narrative', 'signoff', 'footer']);
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
