// Renderer — Day header band for tournament_prelim game schedule.
// Wave 5 (cutover wave PR 1) — extracted as a standalone section type
// so resolver can emit per-day grouping with optional venue suffix
// (e.g. "SATURDAY, MAY 16 | ANSONIA"). Pattern matches Frank's
// hand-composed briefings; differs from weeklySchedule's internal
// day-grouping because tournament_prelim uses game_card rows below
// each day header rather than the weeklySchedule layout.

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, BRAND_GOLD_TEXT } from '../colors';

export default function renderDayHeader(section) {
  const { label, venue_suffix } = section || {};
  if (!label) return { html: '', plainText: '' };
  const fullLabel = venue_suffix ? `${label} | ${venue_suffix}` : label;
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:24px 0 8px 0;">'
    + `<tr><td style="padding:0 0 6px 0;border-bottom:1px solid ${BORDER_DEFAULT};font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${BRAND_GOLD_TEXT};text-transform:uppercase;line-height:1.4;text-align:center;">${escapeHtml(fullLabel)}</div>`
    + '</td></tr></table>';
  return { html, plainText: fullLabel.toUpperCase() };
}
