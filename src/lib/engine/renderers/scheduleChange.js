// Kind composer — schedule_change. Personalized per-family email when an
// admin moves a single instance, this+future, or whole series of an event.
//
// Returns: { subject, html, plainText, sections }
// Pilot mode: dispatched through send-tournament-message v13 — the same
// gate that protects weekly_digest applies automatically.
//
// Wave 3.8 §5.2.

import { renderSections, renderSectionsPlainText } from '../composer';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

function buildHeader(orgName, eyebrowLink) {
  return {
    kind: 'header',
    eyebrow: `${orgName} · SCHEDULE CHANGE`,
    eyebrow_link: eyebrowLink,
    headline: 'SCHEDULE UPDATE',
    goldStripe: true,
  };
}

function buildSummaryLine(summary) {
  if (!summary || !summary.trim()) return null;
  return { kind: 'stats_narrative', body: summary.trim() };
}

function buildDiff(before, after, eventTitle) {
  return { kind: 'schedule_change_diff', before, after, eventTitle };
}

function buildSignoff(prose, coaches) {
  const hasProse = !!(prose && prose.trim());
  const hasCoaches = !!(coaches && coaches.length);
  if (!hasProse && !hasCoaches) return null;
  return {
    kind: 'signoff',
    prose: hasProse ? prose.trim() : '',
    coaches: (coaches || []).map((c) => ({
      display_name: c.display_name || '',
      title: c.title || '',
      phone: c.phone || '',
    })),
  };
}

function buildFooter(orgName, websiteUrl, contactEmail, logoUrl) {
  return { kind: 'footer', logoUrl, orgName, websiteUrl, contactEmail };
}

export function composeScheduleChange(data = {}) {
  const {
    summary = '',
    before = {},
    after = {},
    eventTitle = '',
    signoff_message = '',
    coaches = [],
    subject: subjectOverride,
    orgName = ORG_NAME_DEFAULT,
    eyebrowLink = ORG_WEBSITE_DEFAULT,
    contactEmail = ORG_CONTACT_DEFAULT,
    logoUrl = ORG_LOGO_DEFAULT,
  } = data;

  const sections = [];
  sections.push(buildHeader(orgName, eyebrowLink));
  const summarySection = buildSummaryLine(summary);
  if (summarySection) sections.push(summarySection);
  sections.push(buildDiff(before, after, eventTitle));
  const signoffSection = buildSignoff(signoff_message, coaches);
  if (signoffSection) sections.push(signoffSection);
  sections.push(buildFooter(orgName, eyebrowLink, contactEmail, logoUrl));

  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">'
    + renderSections(sections)
    + '</div>';
  const plainText = renderSectionsPlainText(sections);
  const subject = subjectOverride || `Schedule update — ${eventTitle || 'event updated'}`;

  return { subject, html, plainText, sections };
}
