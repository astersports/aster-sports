// Wave 4.2-A-8b-b — rsvp_request atomic renderer. One per kid in
// the email body. Heading line "RSVP for <Kid>" + sub-context line
// (team, event label, urgency phrase) + 3 stacked buttons (going /
// maybe / not_going).
//
// Inputs from compose: kid_first_name (singular), player_id (used
// upstream by the substitute helper, not by the renderer itself),
// team_name, team_color, event_label, urgency_phrase. Substitute
// helper rewrites rsvp_token_placeholders -> rsvp_token_urls; the
// renderer reads rsvp_token_urls. Fail-loud fallback: if
// rsvp_token_urls is missing (substitution didn't happen), the
// buttons render with literal {{rsvp_*_url}} hrefs so smoke tests
// surface the bug instantly.
//
// Stacked rather than side-by-side: 3 buttons + multi-kid families
// would force narrow buttons. Stacked is also Resend-safe (no flex
// in email clients) and meets the 44px tap target lock.

import { escapeHtml } from './_util';

const BTN_BASE = [
  'display:inline-block',
  'color:#ffffff',
  'font-family:Inter,system-ui,sans-serif',
  'font-size:13px',
  'font-weight:700',
  'letter-spacing:1px',
  'text-transform:uppercase',
  'text-decoration:none',
  'padding:12px 24px',
  'border-radius:6px',
  'line-height:1.2',
  'min-width:120px',
  'box-sizing:border-box',
].join(';');

const COLORS = { going: '#16a34a', maybe: '#ca8a04', not_going: '#dc2626' };
const LABELS = { going: 'GOING', maybe: 'MAYBE', not_going: "CAN'T MAKE IT" };

function urls(section) {
  return section.rsvp_token_urls || {
    going: '{{rsvp_going_url}}', maybe: '{{rsvp_maybe_url}}', not_going: '{{rsvp_not_going_url}}',
  };
}

function renderButton(action, href) {
  return `<a href="${escapeHtml(href)}" style="${BTN_BASE};background-color:${COLORS[action]};">${LABELS[action]}</a>`;
}

export default function render(section) {
  const kid = section?.kid_first_name || '';
  const teamColor = section?.team_color || '#4a8fd4';
  const u = urls(section);
  const heading = `<h3 style="margin:24px 0 4px 0;font-family:Inter,system-ui,sans-serif;font-size:16px;font-weight:700;color:${escapeHtml(teamColor)};">RSVP for ${escapeHtml(kid)}</h3>`;
  const subContext = `<p style="margin:0 0 12px 0;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#6b7280;">${escapeHtml(section?.team_name || '')} ${escapeHtml(section?.event_label || '')} · ${escapeHtml(section?.urgency_phrase || '')}</p>`;
  const buttonRows = ['going', 'maybe', 'not_going']
    .map((action) => `<tr><td style="padding:4px 0;">${renderButton(action, u[action])}</td></tr>`)
    .join('');
  const buttonsTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0;">${buttonRows}</table>`;
  const html = `<div style="margin:0;">${heading}${subContext}${buttonsTable}</div>`;
  const plainText = [
    `RSVP for ${kid}`,
    `${section?.team_name || ''} ${section?.event_label || ''} - ${section?.urgency_phrase || ''}`,
    `Going: ${u.going}`,
    `Maybe: ${u.maybe}`,
    `Can't make it: ${u.not_going}`,
  ].join('\n');
  return { html, plainText };
}
