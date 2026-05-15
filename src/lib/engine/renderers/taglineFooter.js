// Renderer — Tagline footer band.
// Wave 5 (cutover wave PR 1) — Per-team free-text closing line on
// cobalt band (e.g. "27 days of work. Time to show it." or
// "Tournament 3. These boys are ready."). Tagline storage is a body
// field on TournamentPrelimBody (NOT a comms_messages column —
// per audit §9.5).

import { escapeHtml } from './_util';
import { COBALT } from '../colors';

export default function renderTaglineFooter(section) {
  const { text } = section || {};
  if (!text) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:24px 0 0 0;">'
    + `<tr><td align="center" style="padding:20px 28px;background-color:${COBALT};font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:15px;font-weight:600;color:#ffffff;line-height:1.5;letter-spacing:0.3px;">${escapeHtml(text)}</div>`
    + '</td></tr></table>';
  return { html, plainText: text };
}
