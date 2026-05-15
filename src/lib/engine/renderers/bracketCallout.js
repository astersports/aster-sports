// Renderer — Bracket callout band.
// Wave 5 (cutover wave PR 1) — Yellow callout header for the bracket
// section, e.g. "BRACKET PLAY | IF ADVANCE" or "CHAMPIONSHIP | IF
// ADVANCE". Per BRIEFING_RENDERER_REFERENCES.md, the bracket section
// in Frank's hand-composed briefings starts with this band, then
// SEMI + ★ Championship rows render below as game_card sections
// (existing renderer reused with rail.label='SEMI' or '★').
//
// championshipScenarios renderer was evaluated and rejected: it's
// for outcome explanations ("if you win, you go to X"), not for
// bracket placeholder game rows. Different purpose entirely.

import { escapeHtml } from './_util';
import { CREAM, GOLD, TEXT_NAVY } from '../colors';

export default function renderBracketCallout(section) {
  const { text } = section || {};
  if (!text) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:24px 0 8px 0;">'
    + `<tr><td align="center" style="padding:12px 20px;background-color:${CREAM};border:1px solid ${GOLD};border-radius:4px;font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${TEXT_NAVY};text-transform:uppercase;line-height:1.4;">${escapeHtml(text)}</div>`
    + '</td></tr></table>';
  return { html, plainText: text.toUpperCase() };
}
