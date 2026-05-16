// Renderer — family_guide VIP banner. Same cobalt-band shape as
// coachHeader but tuned for the parent audience: parent name +
// date range + kid-names line + "(N games · K conflicts)" badge.
// Conflict count surfaces in the eyebrow when nonzero so the
// parent sees the headline before scrolling.

import { escapeHtml } from './_util';
import { COBALT_DEEP } from '../colors';

export default function renderVipHeader(section) {
  const parent = section?.parent_name || 'Parent';
  const range = section?.date_range_label || '';
  const kidNames = section?.kid_names || [];
  const eventCount = section?.event_count || 0;
  const conflictCount = section?.conflict_count || 0;
  const eyebrow = `FAMILY GUIDE${range ? ` · ${escapeHtml(range)}` : ''}`;
  const headline = escapeHtml(parent);
  const kidsLine = kidNames.length
    ? kidNames.map((k) => escapeHtml(k)).join(' · ')
    : 'NO KIDS THIS WINDOW';
  const gamesLabel = eventCount === 1 ? '1 GAME' : `${eventCount} GAMES`;
  const conflictLabel = conflictCount ? ` · ${conflictCount} CONFLICT${conflictCount === 1 ? '' : 'S'}` : '';
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:0 0 16px 0;">'
    + `<tr><td style="padding:24px 20px;background-color:${COBALT_DEEP};color:#ffffff;font-family:Inter,system-ui,sans-serif;text-align:center;">`
    + `<div style="font-size:11px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;line-height:1.4;opacity:0.85;margin-bottom:6px;">${eyebrow}</div>`
    + `<div style="font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;letter-spacing:-0.2px;">${headline}</div>`
    + `<div style="font-size:13px;font-weight:500;color:#ffffff;line-height:1.4;opacity:0.9;margin-top:4px;">${kidsLine}</div>`
    + `<div style="font-size:12px;font-weight:600;color:#ffffff;letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;opacity:0.75;margin-top:6px;">${gamesLabel}${conflictLabel}</div>`
    + '</td></tr></table>';
  const plainText = [
    `FAMILY GUIDE${range ? ` · ${range}` : ''}`,
    parent,
    kidsLine,
    `${gamesLabel}${conflictLabel}`,
  ].join('\n');
  return { html, plainText };
}
