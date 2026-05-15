// Renderer — coach_roundup per-event row. Left border-stripe in
// team color + day + time + opponent + venue. Compact, scannable —
// the coach's eye should fall on the day/time first, the venue
// second, the opponent third. Stripe + name pill make the team
// trivially distinguishable when 4-5 teams' games are interleaved
// in a single document.

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, TEXT_NAVY, TEXT_SLATE, TEXT_SLATE_DARK } from '../colors';

export default function renderColorStripedRow(section) {
  const color = section?.team_color || '#4a8fd4';
  const day = section?.day_label || 'TBD';
  const time = section?.time || '';
  const primary = section?.primary || 'TBD';
  const secondary = section?.secondary || '';
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:4px 0;">'
    + `<tr><td style="border-left:4px solid ${escapeHtml(color)};padding:10px 14px;background-color:#ffffff;border-top:1px solid ${BORDER_DEFAULT};border-right:1px solid ${BORDER_DEFAULT};border-bottom:1px solid ${BORDER_DEFAULT};border-radius:0 4px 4px 0;font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:11px;font-weight:700;color:${TEXT_NAVY};letter-spacing:1px;text-transform:uppercase;line-height:1.4;">${escapeHtml(day)}${time ? ` <span style="color:${TEXT_SLATE_DARK};font-weight:600;">· ${escapeHtml(time)}</span>` : ''}</div>`
    + `<div style="font-size:15px;font-weight:600;color:${TEXT_NAVY};line-height:1.4;margin-top:2px;">${escapeHtml(primary)}</div>`
    + (secondary ? `<div style="font-size:12px;color:${TEXT_SLATE};line-height:1.4;margin-top:2px;">${escapeHtml(secondary)}</div>` : '')
    + '</td></tr></table>';
  const plainText = `${day}${time ? ` · ${time}` : ''} — ${primary}${secondary ? ` (${secondary})` : ''}`;
  return { html, plainText };
}
