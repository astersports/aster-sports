// Kind composer — tournament_recap. Post-tournament family email.
// Final standing, game-by-game results (text body), MVP highlight,
// coach takeaways, signoff, footer.
//
// Body fields:
//   { tournamentName, final_standing: text, game_results: text,
//     mvp_name: text, takeaways: text }
//
// Standing visual + per-game results table deferred to a polish PR.

import { renderSections, renderSectionsPlainText } from '../composer';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

function appendIf(sections, body) {
  if (body && body.trim()) sections.push({ kind: 'stats_narrative', body: body.trim() });
}

export function composeTournamentRecap(data = {}) {
  const {
    tournamentName = '', final_standing = '', game_results = '',
    mvp_name = '', takeaways = '',
    // Wave 3.16.1: caller resolves tourney_url from anchor; label is
    // body-authored. Both required to emit a CTA.
    tourney_link_label = '', tourney_url = null,
    signoff_message = '', coaches = [],
    orgName = ORG_NAME_DEFAULT, eyebrowLink = ORG_WEBSITE_DEFAULT,
    contactEmail = ORG_CONTACT_DEFAULT, logoUrl = ORG_LOGO_DEFAULT,
  } = data;

  const sections = [
    { kind: 'header', eyebrow: `${orgName} · TOURNAMENT RECAP`, eyebrow_link: eyebrowLink, headline: tournamentName ? tournamentName.toUpperCase() : 'TOURNAMENT RECAP', goldStripe: true },
  ];
  appendIf(sections, final_standing);
  appendIf(sections, game_results);
  appendIf(sections, mvp_name ? `MVP: ${mvp_name.trim()}` : '');
  appendIf(sections, takeaways);
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
  const subject = `Tournament recap — ${tournamentName || 'tournament'}`;
  return { subject, html, plainText, sections };
}
