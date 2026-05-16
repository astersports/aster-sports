// Renderer — placement_block. Used by tournament_recap composer
// (resolvers/tournamentRecap.js via tournamentRecapHelpers.js:10).
// Hero "Finished #1" banner with optional W-L record line.
//
// Shape: { team_color, final_place, record? }
// final_place: 1, 2, 3... (integer rank)
// record: "5-2" string, omitted if no games played

import { escapeHtml } from './_util';
import { GOLD, TEXT_NAVY, TEXT_SLATE_DARK } from '../colors';

function ordinalSuffix(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return 'th';
  switch (n % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
}

export default function renderPlacementBlock(section) {
  const place = section?.final_place;
  if (!place) return { html: '', plainText: '' };
  const teamColor = section?.team_color || '#4a8fd4';
  const record = section?.record || '';
  const isChamp = place === 1;
  const bgColor = isChamp ? GOLD : '#ffffff';
  const stripeColor = isChamp ? '#92400e' : teamColor;
  const placeLabel = isChamp ? 'CHAMPIONS' : `${place}${ordinalSuffix(place)} PLACE`;

  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + `<tr><td align="center" style="padding:20px 16px;background-color:${bgColor};border-top:4px solid ${escapeHtml(stripeColor)};border-radius:6px;font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:13px;font-weight:700;letter-spacing:2px;color:${TEXT_SLATE_DARK};text-transform:uppercase;line-height:1.2;">FINAL STANDING</div>`
    + `<div style="font-size:24px;font-weight:700;color:${TEXT_NAVY};line-height:1.2;margin-top:6px;">${placeLabel}</div>`
    + (record
        ? `<div style="font-size:14px;font-weight:600;color:${TEXT_SLATE_DARK};line-height:1.4;margin-top:6px;">${escapeHtml(record)} record</div>`
        : '')
    + '</td></tr></table>';

  const plainText = `Final standing: ${placeLabel}${record ? ` (${record} record)` : ''}`;
  return { html, plainText };
}
