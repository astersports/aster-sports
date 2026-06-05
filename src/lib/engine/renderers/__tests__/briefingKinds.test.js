import { describe, expect, it } from 'vitest';
import { composeTournamentPrelim } from '../tournamentPrelim';
import { composeAnnouncement } from '../announcement';
import { composeCustomMessage } from '../customMessage';

// composeTournamentRecap removed PR #323 — May 16 audit P2 #16 dead-code
// cleanup. The legacy `renderers/tournamentRecap.js` was unreferenced
// by any production path (canonical compose is `resolvers/tournamentRecap.js`
// via RESOLVER_REGISTRY). The sibling legacy renderers above remain
// (still tested) until they're flagged for removal too.

const COACHES = [{ display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' }];

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
    expect(out.subject).toBe('Game day briefing: Zero Gravity NY Hoop Festival');
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
