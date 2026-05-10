// Wave 4.2-A-8c — callup_response atomic renderer. Two stacked
// buttons (accept = green, decline = neutral gray) below a heading
// and an optional response-window line.
//
// Mirror of the rsvpRequest renderer pattern from wave 4.2-A-8b-b.
// Inputs from compose: window_label (optional), deadline_at (not
// shown on the section itself; the response-window helper formats
// window_label as a complete sentence). Post-substitution renderer
// reads callup_token_urls; if absent, falls back to literal
// {{callup_*_url}} hrefs as a fail-loud smoke-test signal.

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
  'min-width:160px',
  'box-sizing:border-box',
].join(';');

const COLORS = { accept: '#16a34a', decline: '#6b7280' };
const LABELS = { accept: 'ACCEPT CALL-UP', decline: 'DECLINE' };

function urls(section) {
  return section.callup_token_urls || {
    accept: '{{callup_accept_url}}', decline: '{{callup_decline_url}}',
  };
}

function renderButton(action, href) {
  return `<a href="${escapeHtml(href)}" style="${BTN_BASE};background-color:${COLORS[action]};">${LABELS[action]}</a>`;
}

export default function render(section) {
  const u = urls(section);
  const windowLabel = section?.window_label || '';
  const heading = `<h3 style="margin:24px 0 4px 0;font-family:Inter,system-ui,sans-serif;font-size:16px;font-weight:700;color:#1f2937;">Respond to this call-up</h3>`;
  const subContext = windowLabel
    ? `<p style="margin:0 0 12px 0;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#6b7280;">${escapeHtml(windowLabel)}</p>`
    : '';
  const buttonRows = ['accept', 'decline']
    .map((action) => `<tr><td style="padding:4px 0;">${renderButton(action, u[action])}</td></tr>`)
    .join('');
  const buttonsTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0;">${buttonRows}</table>`;
  const html = `<div style="margin:0;">${heading}${subContext}${buttonsTable}</div>`;
  const plainText = [
    'Respond to this call-up',
    windowLabel,
    `Accept: ${u.accept}`,
    `Decline: ${u.decline}`,
  ].filter(Boolean).join('\n');
  return { html, plainText };
}
