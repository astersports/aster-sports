// Kind composer — rsvp_nudge. Per-family one-tap RSVP nudge for an
// upcoming event. The actual signed-token URLs are injected by the
// send pipeline (rsvpNudgeSend.js) at per-recipient render time so
// each (event, player, response) gets a fresh nonce. The composer
// emits a `rsvp_buttons` placeholder section per player; the send
// pipeline rewrites those placeholders with real <a href="..."> tags
// pointing at /functions/v1/rsvp-token-handler?t=...&action=...
//
// Body fields (from RsvpNudgeBody):
//   { headline_override?, custom_message?, ask_comment_field? }
//
// The send pipeline also passes:
//   eventTitle, eventTimeLabel, eventLocation, players: [{id, name}]
// so the composer can build a header line + per-player section.

import { renderSections, renderSectionsPlainText } from '../composer';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

function summaryLine(eventTitle, eventTimeLabel, eventLocation) {
  return [eventTitle, eventTimeLabel, eventLocation].filter(Boolean).join(' · ');
}

export function composeRsvpNudge(data = {}) {
  const {
    headline_override = '',
    custom_message = '',
    eventTitle = '',
    eventTimeLabel = '',
    eventLocation = '',
    players = [],
    rsvpLinks = {}, // { [player_id]: { going, maybe, not_going } } — populated by send pipeline
    signoff_message = '',
    coaches = [],
    orgName = ORG_NAME_DEFAULT,
    eyebrowLink = ORG_WEBSITE_DEFAULT,
    contactEmail = ORG_CONTACT_DEFAULT,
    logoUrl = ORG_LOGO_DEFAULT,
  } = data;

  const sections = [
    { kind: 'header', eyebrow: `${orgName} · QUICK RSVP`, eyebrow_link: eyebrowLink, headline: (headline_override || `RSVP — ${eventTitle || 'Upcoming event'}`).toUpperCase(), goldStripe: true },
  ];
  const summary = summaryLine(eventTitle, eventTimeLabel, eventLocation);
  if (summary) sections.push({ kind: 'stats_narrative', body: summary });
  if (custom_message?.trim()) sections.push({ kind: 'stats_narrative', body: custom_message.trim() });

  // Per-player CTA group. Send pipeline supplies rsvpLinks; composer
  // emits a cta_buttons section with the 3 response URLs per player.
  for (const player of players || []) {
    const links = rsvpLinks[player.id] || {};
    sections.push({ kind: 'stats_narrative', body: `For ${player.name || 'your kid'}:` });
    sections.push({
      kind: 'cta_buttons',
      buttons: [
        { text: 'GOING', url: links.going || '#' },
        { text: 'MAYBE', url: links.maybe || '#' },
      ],
    });
    sections.push({
      kind: 'cta_buttons',
      buttons: [{ text: 'CAN’T MAKE IT', url: links.not_going || '#' }],
    });
  }

  if (signoff_message?.trim() || coaches.length) {
    sections.push({ kind: 'signoff', prose: signoff_message?.trim() || '', coaches: coaches.map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' })) });
  }
  sections.push({ kind: 'footer', logoUrl, orgName, websiteUrl: eyebrowLink, contactEmail });

  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">'
    + renderSections(sections) + '</div>';
  const plainText = renderSectionsPlainText(sections);
  const subject = `RSVP — ${eventTitle || 'upcoming event'}${eventTimeLabel ? ` · ${eventTimeLabel}` : ''}`;
  return { subject, html, plainText, sections };
}

export default composeRsvpNudge;
