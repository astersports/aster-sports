// Renderer — section_bar (games_recap / game_recap framed treatment).
// Full-width bar with a 2px cobalt top-border + a filled light bar bg +
// a centered tracked-caps cobalt label. Matches the mock's `.secbar`
// ("The Weekend" / "From the Sideline"). Distinct from dayHeader (which
// is a bottom-bordered, unfilled grouping header used by
// tournament_prelim) so neither renderer disturbs the other.
//
// Explicit light bar bg + cobalt text — reads in both light and dark
// email clients.

import { escapeHtml } from './_util';
import { BG_PAGE, BRAND_GOLD, BRAND_GOLD_TEXT } from '../colors';

export default function renderSectionBar(section) {
  const label = section?.label || '';
  if (!label) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;">'
    + `<tr><td align="center" style="background-color:${BG_PAGE};border-top:2px solid ${BRAND_GOLD};padding:11px 18px;">`
    + `<div style="font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${BRAND_GOLD_TEXT};line-height:1.4;">${escapeHtml(label)}</div>`
    + '</td></tr></table>';
  return { html, plainText: `── ${label.toUpperCase()} ──` };
}
