// Kind composer — announcement. General team or org-wide message.
// Headline, body text, signoff, footer.
//
// Body fields:
//   { headline: text, body_text: text }
//
// Inline photo support deferred to a polish PR.

import { renderSections, renderSectionsPlainText } from '../composer';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

export function composeAnnouncement(data = {}) {
  const {
    headline = '', body_text = '',
    signoff_message = '', coaches = [],
    orgName = ORG_NAME_DEFAULT, eyebrowLink = ORG_WEBSITE_DEFAULT,
    contactEmail = ORG_CONTACT_DEFAULT, logoUrl = ORG_LOGO_DEFAULT,
  } = data;

  const sections = [
    { kind: 'header', eyebrow: `${orgName} · ANNOUNCEMENT`, eyebrow_link: eyebrowLink, headline: headline ? headline.toUpperCase() : 'ANNOUNCEMENT', goldStripe: true },
  ];
  if (body_text?.trim()) sections.push({ kind: 'stats_narrative', body: body_text.trim() });
  if (signoff_message?.trim() || coaches.length) {
    sections.push({ kind: 'signoff', prose: signoff_message?.trim() || '', coaches: coaches.map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' })) });
  }
  sections.push({ kind: 'footer', logoUrl, orgName, websiteUrl: eyebrowLink, contactEmail });

  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">'
    + renderSections(sections) + '</div>';
  const plainText = renderSectionsPlainText(sections);
  const subject = headline?.trim() || `${orgName} announcement`;
  return { subject, html, plainText, sections };
}

export default composeAnnouncement;
