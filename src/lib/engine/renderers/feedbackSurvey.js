// Cutover PR 7b-1 — feedback_survey atomic renderer. 5 stacked star
// buttons (1-5) below a heading. Recipients tap once to rate the
// briefing; the cutover-gate metric aggregates ratings into a ≥4.0
// average over recent sends.
//
// Mirror of callupResponse / rsvpRequest pattern. Substitute helper
// rewrites feedback_token_placeholders -> feedback_token_urls; the
// renderer reads feedback_token_urls. Fail-loud fallback per AP #29:
// if feedback_token_urls is missing (substitution didn't happen), the
// buttons render with literal {{feedback_*_url}} hrefs so smoke tests
// surface the bug instantly.
//
// Stacked (not side-by-side) to stay Resend-safe (no flex in email
// clients) + meet the 44px tap target lock + leave room for the rating
// label next to each star.

import { escapeHtml } from './_util';

const BTN_BASE = [
  'display:inline-block',
  'color:#ffffff',
  'font-family:Inter,system-ui,sans-serif',
  'font-size:13px',
  'font-weight:700',
  'letter-spacing:1px',
  'text-decoration:none',
  'padding:12px 24px',
  'border-radius:6px',
  'line-height:1.2',
  'min-width:200px',
  'box-sizing:border-box',
].join(';');

// Cobalt gradient by rating — higher rating = warmer/brighter. Visual
// affordance that 5 is the high end without requiring stars in copy
// (some email clients reflow unicode stars; literal labels are safe).
const COLORS = {
  1: '#94a3b8', 2: '#64748b', 3: '#475569', 4: '#1e3a5f', 5: '#0f2940',
};
const LABELS = {
  1: '★ — Not useful',
  2: '★★ — Could be better',
  3: '★★★ — Decent',
  4: '★★★★ — Good',
  5: '★★★★★ — Excellent',
};

function urls(section) {
  return section.feedback_token_urls || {
    1: '{{feedback_1_url}}', 2: '{{feedback_2_url}}',
    3: '{{feedback_3_url}}', 4: '{{feedback_4_url}}',
    5: '{{feedback_5_url}}',
  };
}

function renderButton(rating, href) {
  return `<a href="${escapeHtml(href)}" style="${BTN_BASE};background-color:${COLORS[rating]};">${LABELS[rating]}</a>`;
}

export default function render(section) {
  const u = urls(section);
  const heading = `<h3 style="margin:32px 0 4px 0;font-family:Inter,system-ui,sans-serif;font-size:16px;font-weight:700;color:#1f2937;">How was this briefing?</h3>`;
  const subContext = `<p style="margin:0 0 12px 0;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#6b7280;">One tap. Helps us tune what shows up here.</p>`;
  const buttonRows = [1, 2, 3, 4, 5]
    .map((rating) => `<tr><td style="padding:4px 0;">${renderButton(rating, u[rating])}</td></tr>`)
    .join('');
  const buttonsTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0;">${buttonRows}</table>`;
  const html = `<div style="margin:0;">${heading}${subContext}${buttonsTable}</div>`;
  const plainText = [
    'How was this briefing? (One tap below.)',
    `1 star: ${u[1]}`,
    `2 stars: ${u[2]}`,
    `3 stars: ${u[3]}`,
    `4 stars: ${u[4]}`,
    `5 stars: ${u[5]}`,
  ].join('\n');
  return { html, plainText };
}
