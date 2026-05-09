// Kind composer — tournament_preliminary. Pre-tournament family
// briefing. Tournament header, hotel/parking, Sat/Sun notes, opponent
// scouting, lineup considerations, signoff, footer.
//
// Body fields (all optional except tournament name + dates):
//   { tournamentName, tournamentDates, tournamentVenue,
//     hotel_block: text, sat_notes: text, sun_notes: text,
//     opponent_scouting: text, lineup_notes: text }
//
// Schedule table + championship scenarios deferred — v1 ships text
// blocks via stats_narrative so the kind is end-to-end usable now.

import { renderSections, renderSectionsPlainText } from '../composer';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

function appendIf(sections, body) {
  if (body && body.trim()) sections.push({ kind: 'stats_narrative', body: body.trim() });
}

export function composeTournamentPrelim(data = {}) {
  const {
    tournamentName = '', tournamentDates = '', tournamentVenue = '',
    hotel_block = '', sat_notes = '', sun_notes = '',
    opponent_scouting = '', lineup_notes = '',
    // Wave 3.16.1: tourney_url resolved by caller from anchor.
    tourney_link_label = '', tourney_url = null,
    signoff_message = '', coaches = [],
    orgName = ORG_NAME_DEFAULT, eyebrowLink = ORG_WEBSITE_DEFAULT,
    contactEmail = ORG_CONTACT_DEFAULT, logoUrl = ORG_LOGO_DEFAULT,
  } = data;

  const sections = [
    { kind: 'header', eyebrow: `${orgName} · TOURNAMENT BRIEFING`, eyebrow_link: eyebrowLink, headline: tournamentName ? tournamentName.toUpperCase() : 'TOURNAMENT BRIEFING', sub_context: [tournamentDates, tournamentVenue].filter(Boolean).join(' · '), goldStripe: true },
  ];
  appendIf(sections, hotel_block);
  appendIf(sections, sat_notes ? `Saturday\n${sat_notes}` : '');
  appendIf(sections, sun_notes ? `Sunday\n${sun_notes}` : '');
  appendIf(sections, opponent_scouting);
  appendIf(sections, lineup_notes);
  if (tourney_link_label?.trim() && tourney_url) {
    sections.push({ kind: 'cta_buttons', buttons: [{ text: tourney_link_label.trim(), url: tourney_url }] });
  }
  if (signoff_message?.trim() || coaches.length) {
    sections.push({ kind: 'signoff', prose: signoff_message?.trim() || '', coaches: coaches.map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' })) });
  }
  sections.push({ kind: 'footer', logoUrl, orgName, websiteUrl: eyebrowLink, contactEmail });

  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">'
    + renderSections(sections) + '</div>';
  const plainText = renderSectionsPlainText(sections);
  const subject = `Game day briefing — ${tournamentName || 'tournament'}`;
  return { subject, html, plainText, sections };
}

export default composeTournamentPrelim;
