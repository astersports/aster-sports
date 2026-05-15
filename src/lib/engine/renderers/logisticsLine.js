// Renderer — Logistics line.
// Wave 5 (cutover wave PR 1) — Single-line "Arrive 15 minutes before
// each tip | Jersey: black side out" between bracket section and
// tagline footer. Centered, muted text.

import { escapeHtml } from './_util';
import { TEXT_SLATE } from '../colors';

export default function renderLogisticsLine(section) {
  const { text } = section || {};
  if (!text) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td align="center" style="padding:8px 20px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:13px;color:${TEXT_SLATE};line-height:1.5;">${escapeHtml(text)}</div>`
    + '</td></tr></table>';
  return { html, plainText: text };
}
