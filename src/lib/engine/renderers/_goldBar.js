// Shared .ebar.gold section-bar renderer for the tournament_prelim
// gold-standard showcase sections (standings / weather / rules).
//
// Mirrors the CREAM/GOLD band used by bracketCallout (the existing
// .ebar treatment in the briefing email theme), centered uppercase
// label. Inline-styled + table-based per CLAUDE.md §13 (LeagueApps
// strips <style> blocks). The label text is the per-section bar_label
// (e.g. "Division 3 Orange", "Weather · Waltham, MA", "Rules").

import { escapeHtml } from './_util';
import { CREAM, GOLD, TEXT_NAVY } from '../colors';

export function goldBarHtml(label) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:24px 0 8px 0;">'
    + `<tr><td align="center" style="padding:10px 16px;background-color:${CREAM};border-top:2px solid ${GOLD};font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:11px;font-weight:800;letter-spacing:1.6px;color:${TEXT_NAVY};text-transform:uppercase;line-height:1.4;">${escapeHtml(label)}</div>`
    + '</td></tr></table>';
}
