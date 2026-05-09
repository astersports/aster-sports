import { describe, expect, it } from 'vitest';
import { composeGameRecap } from '../gameRecap';
import { composeTournamentPrelim } from '../tournamentPrelim';
import { composeTournamentRecap } from '../tournamentRecap';
import { composeAnnouncement } from '../announcement';
import { composeCustomMessage } from '../customMessage';

const COACHES = [{ display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' }];

describe('composeGameRecap', () => {
  it('renders header + score + highlights + signoff + footer', () => {
    const out = composeGameRecap({
      teamName: '11U Girls', opponent: 'Storm Blue',
      score: { ours: 42, theirs: 38 },
      our_highlights: 'Strong third quarter.', opp_highlights: 'Their #12 had a hot first half.',
      player_of_game_name: 'Sara K.', coach_note: 'Proud of the team.',
      signoff_message: 'Onward.', coaches: COACHES,
    });
    expect(out.subject).toBe('Recap — 11U Girls 42-38 vs Storm Blue');
    expect(out.html).toContain('GAME RECAP');
    expect(out.html).toContain('Final: 11U Girls 42 – Storm Blue 38 (W)');
    expect(out.html).toContain('Strong third quarter.');
    expect(out.html).toContain('Player of the game: Sara K.');
    expect(out.plainText).toContain('Final: 11U Girls 42 – Storm Blue 38 (W)');
    const kinds = out.sections.map((s) => s.kind);
    expect(kinds[0]).toBe('header');
    expect(kinds[kinds.length - 1]).toBe('footer');
  });

  it('omits score line when score is missing (loss tag still works)', () => {
    const out = composeGameRecap({ teamName: '10U', opponent: 'Mavs' });
    expect(out.html).not.toContain('Final:');
    expect(out.subject).toBe('Recap — 10U vs Mavs');
  });

  it('marks losses with L tag', () => {
    const out = composeGameRecap({ teamName: '10U', opponent: 'Mavs', score: { ours: 30, theirs: 40 } });
    expect(out.html).toContain('(L)');
  });
});

describe('composeTournamentPrelim', () => {
  it('renders header + body sections + signoff + footer', () => {
    const out = composeTournamentPrelim({
      tournamentName: 'Zero Gravity NY Hoop Festival',
      tournamentDates: 'May 16-17',
      tournamentVenue: 'Stamford Sportsplex',
      hotel_block: 'Hampton Inn block: $189/night.',
      sat_notes: 'Pool play 9 AM, noon, 3 PM.',
      sun_notes: 'Bracket play TBD pending Saturday results.',
      opponent_scouting: 'Scout Saturday opponent #12.',
      lineup_notes: 'Start with Sara, Sienna, Stella.',
      signoff_message: 'See you Saturday.', coaches: COACHES,
    });
    expect(out.subject).toBe('Game day briefing — Zero Gravity NY Hoop Festival');
    expect(out.html).toContain('TOURNAMENT BRIEFING');
    expect(out.html).toContain('ZERO GRAVITY NY HOOP FESTIVAL');
    expect(out.html).toContain('May 16-17 · Stamford Sportsplex');
    expect(out.html).toContain('Hampton Inn block: $189/night.');
    expect(out.html).toContain('Saturday');
    expect(out.html).toContain('Sunday');
    expect(out.plainText).toContain('Pool play 9 AM');
    expect(out.plainText).toContain('Bracket play TBD');
  });
});

describe('composeTournamentRecap', () => {
  it('renders standing + game results + MVP + takeaways', () => {
    const out = composeTournamentRecap({
      tournamentName: 'NY Hoop Festival',
      final_standing: 'Finished 3rd of 8 teams.',
      game_results: 'Sat: W 42-38, L 30-40. Sun: W 51-44.',
      mvp_name: 'Sara K.',
      takeaways: 'Defense in the second half was the difference.',
      signoff_message: 'Great weekend.', coaches: COACHES,
    });
    expect(out.subject).toBe('Tournament recap — NY Hoop Festival');
    expect(out.html).toContain('TOURNAMENT RECAP');
    expect(out.html).toContain('NY HOOP FESTIVAL');
    expect(out.html).toContain('Finished 3rd of 8 teams.');
    expect(out.html).toContain('MVP: Sara K.');
    expect(out.plainText).toContain('Sat: W 42-38');
  });
});

describe('composeAnnouncement', () => {
  it('uppercases headline and renders body', () => {
    const out = composeAnnouncement({
      headline: 'Practice canceled tomorrow',
      body_text: 'WCC unavailable. Back to normal Wednesday.',
      coaches: COACHES,
    });
    expect(out.subject).toBe('Practice canceled tomorrow');
    expect(out.html).toContain('PRACTICE CANCELED TOMORROW');
    expect(out.html).toContain('WCC unavailable.');
    expect(out.plainText).toContain('WCC unavailable.');
  });

  it('uses default subject when headline empty', () => {
    const out = composeAnnouncement({ body_text: 'Heads up.' });
    expect(out.subject).toBe('Legacy Hoopers announcement');
  });
});

describe('composeCustomMessage', () => {
  it('passes operator subject through unchanged', () => {
    const out = composeCustomMessage({
      subject: 'Quick favor',
      body_text: 'Need 2 volunteers for snack run Saturday.',
      coaches: COACHES,
    });
    expect(out.subject).toBe('Quick favor');
    expect(out.html).toContain('QUICK FAVOR');
    expect(out.plainText).toContain('Need 2 volunteers');
  });

  it('plain-text contains no markup', () => {
    const out = composeCustomMessage({ subject: 'Test', body_text: 'Body text here.' });
    expect(out.plainText).not.toContain('<');
  });
});
