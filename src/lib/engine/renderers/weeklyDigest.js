// Kind composer — weekly_digest. Per-family composition: each guardian
// gets a personalized digest with only the events relevant to their kids'
// teams. Multi-team families get interleaved chronological schedules.
//
// Returns: { subject, html, plainText, teams_included }
// teams_included is captured into comms_message_recipients.teams_included
// so the per-recipient row records which teams contributed to that body.

import { renderSections, renderSectionsPlainText } from '../composer';
import { buildScheduleSection } from '../resolvers/weeklyDigestSchedule';
import { formatPeriodLabel, formatSubject } from '../digestPeriod';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const HEADLINE_DEFAULT = 'WEEK AHEAD';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
// Vercel-hosted Knight logo (240x240 PNG, ~12 KB) — Legacy Hoopers org
// brand mark. Wave 3.7 swap: previously pointed at apple-touch-icon.png
// (Phoenix / Aster Sports PWA shell), which is wrong for post-auth org-specific
// digest. Multi-tenant follow-up: add organization_settings.brand_logo_url
// column when 2nd org onboards.
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

function buildHeader(period, orgName, eyebrowLink) {
  return {
    kind: 'header',
    // Wave 4.3-H: brand pass dropped redundant "WEEKLY DIGEST" subhead.
    // "WEEK AHEAD" headline carries the digest context.
    eyebrow: orgName,
    eyebrow_link: eyebrowLink,
    headline: HEADLINE_DEFAULT,
    sub_context: formatPeriodLabel(period),
    goldStripe: true,
  };
}

function buildFooter(orgName, websiteUrl, contactEmail, logoUrl) {
  return {
    kind: 'footer',
    logoUrl,
    orgName,
    websiteUrl,
    contactEmail,
  };
}

function buildBodyNotes(text) {
  if (!text || !text.trim()) return null;
  return { kind: 'stats_narrative', body: text.trim() };
}

function buildOpsNotes(text) {
  const items = (text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (!items.length) return null;
  return { kind: 'ops_notes', title: 'BEFORE YOU GO', items };
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

export function composeWeeklyDigest(data = {}) {
  const {
    family = {},
    events = [],
    period,
    teams = [],
    tournaments = [],
    body_notes = '',
    signoff_message = '',
    ops_notes = '',
    coaches = [],
    orgName = ORG_NAME_DEFAULT,
    rsvpCountsByEvent,
    eyebrowLink = ORG_WEBSITE_DEFAULT,
    contactEmail = ORG_CONTACT_DEFAULT,
    logoUrl = ORG_LOGO_DEFAULT,
  } = data;

  const sections = [];
  sections.push(buildHeader(period, orgName, eyebrowLink));
  const bodySection = buildBodyNotes(body_notes);
  if (bodySection) sections.push(bodySection);
  const scheduleSection = buildScheduleSection({ events, teams, tournaments, rsvpCountsByEvent });
  if (scheduleSection) sections.push(scheduleSection);
  const opsSection = buildOpsNotes(ops_notes);
  if (opsSection) sections.push(opsSection);
  const signoffSection = buildSignoff(signoff_message, coaches);
  if (signoffSection) sections.push(signoffSection);
  sections.push(buildFooter(orgName, eyebrowLink, contactEmail, logoUrl));

  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">'
    + renderSections(sections)
    + '</div>';
  const plainText = renderSectionsPlainText(sections);
  const subject = formatSubject(period);

  return {
    subject,
    html,
    plainText,
    teams_included: family.team_ids || [],
    sections, // exposed so the dispatcher can persist content_sections JSONB
  };
}
