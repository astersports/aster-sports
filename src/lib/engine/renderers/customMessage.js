// Kind composer — custom_message. Most flexible kind. Free-form
// body text + signoff + footer. Subject is operator-provided.
//
// Body fields:
//   { subject: text, body_text: text }
//
// Rich-text editor wiring deferred — v1 ships plaintext-as-text.

import { renderSections, renderSectionsPlainText } from '../composer';
import { ORG_CONTACT_DEFAULT, ORG_LOGO_DEFAULT, ORG_NAME_DEFAULT, ORG_WEBSITE_DEFAULT } from '../../constants';
import { BODY_TOKENS, splitBodyTokens } from '../substitution/bodyTokens';

// PR-D — the token kinds present in a body, in stable BODY_TOKENS order.
// Compose stays pure: it tags the narrative section with this list as
// body_token_placeholders (AP #29); the send pipeline resolves URLs.
function bodyTokenKinds(text) {
  const present = new Set(splitBodyTokens(text).filter((s) => s.token).map((s) => s.token));
  return Object.keys(BODY_TOKENS).filter((k) => present.has(k));
}


export function composeCustomMessage(data = {}) {
  const {
    subject = '', body_text = '',
    signoff_message = '', coaches = [],
    orgName = ORG_NAME_DEFAULT, eyebrowLink = ORG_WEBSITE_DEFAULT,
    contactEmail = ORG_CONTACT_DEFAULT, logoUrl = ORG_LOGO_DEFAULT,
  } = data;

  const sections = [
    { kind: 'header', eyebrow: `${orgName}`, eyebrow_link: eyebrowLink, headline: subject ? subject.toUpperCase() : 'MESSAGE', goldStripe: true },
  ];
  if (body_text?.trim()) {
    const trimmed = body_text.trim();
    const tokenKinds = bodyTokenKinds(trimmed);
    sections.push(tokenKinds.length
      ? { kind: 'stats_narrative', body: trimmed, body_token_placeholders: tokenKinds }
      : { kind: 'stats_narrative', body: trimmed });
  }
  if (signoff_message?.trim() || coaches.length) {
    sections.push({ kind: 'signoff', prose: signoff_message?.trim() || '', coaches: coaches.map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' })) });
  }
  sections.push({ kind: 'footer', logoUrl, orgName, websiteUrl: eyebrowLink, contactEmail });

  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">'
    + renderSections(sections) + '</div>';
  const plainText = renderSectionsPlainText(sections);
  return { subject: subject?.trim() || `${orgName} message`, html, plainText, sections };
}
