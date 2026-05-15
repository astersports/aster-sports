// Renderer — Yellow RSVP callout banner.
// Wave 5 (cutover wave PR 1) — "RSVP in the LeagueApps app so Coach
// <Name> can set rosters." Per BRIEFING_RENDERER_REFERENCES.md, this
// is the canonical RSVP CTA for tournament_prelim briefings. Coach
// name varies (Darien for 8U, Kenny for 10U Black + 11U Girls);
// resolver substitutes the right name based on team_staff lookup.

import { escapeHtml } from './_util';
import { GOLD, TEXT_NAVY } from '../colors';

export default function renderRsvpCallout(section) {
  const { text } = section || {};
  if (!text) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + `<tr><td align="center" style="padding:16px 20px;background-color:${GOLD};font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:14px;font-weight:600;color:${TEXT_NAVY};line-height:1.5;">${escapeHtml(text)}</div>`
    + '</td></tr></table>';
  return { html, plainText: text };
}
