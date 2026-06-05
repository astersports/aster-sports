import { describe, expect, it } from 'vitest';
import { composeTournamentPrelim } from '../tournamentPrelim';

const URL = 'https://setourney.app.link/test123';

// composeTournamentRecap test blocks removed PR #323 — May 16 audit
// P2 #16 deleted the legacy `renderers/tournamentRecap.js`. CTA-emission
// behavior for tournament_recap now lives in `resolvers/tournamentRecap.js`
// and is covered by `resolvers/__tests__/tournamentRecap.snapshot.test.js`.

describe('wave 3.16.1 — tourney CTA emission', () => {
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
});
