import { describe, expect, it } from 'vitest';
import { composeTournamentRecap } from '../tournamentRecap';
import { composeTournamentPrelim } from '../tournamentPrelim';
import { composeGameRecap } from '../gameRecap';

const URL = 'https://setourney.app.link/test123';

describe('wave 3.16.1 — tourney CTA emission', () => {
  it('tournamentRecap emits cta_buttons when label + URL both present', () => {
    const out = composeTournamentRecap({
      tournamentName: 'Champs',
      final_standing: '3rd of 8',
      tourney_link_label: 'VIEW BRACKET',
      tourney_url: URL,
    });
    const cta = out.sections.find((s) => s.kind === 'cta_buttons');
    expect(cta).toBeTruthy();
    expect(cta.buttons[0].text).toBe('VIEW BRACKET');
    expect(cta.buttons[0].url).toBe(URL);
    expect(out.html).toContain(URL);
  });

  it('tournamentRecap omits cta_buttons when label is empty', () => {
    const out = composeTournamentRecap({
      tournamentName: 'Champs',
      final_standing: '3rd of 8',
      tourney_link_label: '',
      tourney_url: URL,
    });
    expect(out.sections.find((s) => s.kind === 'cta_buttons')).toBeUndefined();
  });

  it('tournamentRecap omits cta_buttons when URL is null', () => {
    const out = composeTournamentRecap({
      tournamentName: 'Champs',
      final_standing: '3rd of 8',
      tourney_link_label: 'VIEW BRACKET',
      tourney_url: null,
    });
    expect(out.sections.find((s) => s.kind === 'cta_buttons')).toBeUndefined();
  });

  it('tournamentPrelim emits cta_buttons with the resolved URL', () => {
    const out = composeTournamentPrelim({
      tournamentName: 'NY Hoop Festival',
      tournamentDates: 'May 16-17',
      hotel_block: 'Hampton Inn block',
      tourney_link_label: 'VIEW SCHEDULE',
      tourney_url: URL,
    });
    expect(out.html).toContain(URL);
    expect(out.html).toContain('VIEW SCHEDULE');
  });

  it('gameRecap emits cta_buttons when parented to a tournament with tourney_url', () => {
    const out = composeGameRecap({
      teamName: '10U Blue',
      opponent: 'Storm Blue',
      score: { ours: 42, theirs: 38 },
      our_highlights: 'Strong third quarter.',
      tourney_link_label: 'VIEW LEAGUE STANDINGS',
      tourney_url: URL,
    });
    expect(out.html).toContain('VIEW LEAGUE STANDINGS');
    expect(out.html).toContain(URL);
  });

  it('gameRecap omits CTA when game has no parent tournament (URL null)', () => {
    const out = composeGameRecap({
      teamName: '11U Girls',
      opponent: 'Storm Blue',
      score: { ours: 42, theirs: 38 },
      our_highlights: 'Strong third quarter.',
      tourney_link_label: 'VIEW LEAGUE STANDINGS',
      tourney_url: null,
    });
    expect(out.sections.find((s) => s.kind === 'cta_buttons')).toBeUndefined();
  });

  it('plain-text path includes URL when CTA emits', () => {
    const out = composeTournamentRecap({
      tournamentName: 'Champs',
      final_standing: '3rd of 8',
      tourney_link_label: 'VIEW BRACKET',
      tourney_url: URL,
    });
    expect(out.plainText).toContain('VIEW BRACKET');
    expect(out.plainText).toContain(URL);
  });
});
