// Renderer — event_card. Used by rsvp_nudge + academy_callup_notice
// composers (resolvers/rsvpNudge.js + resolvers/academyCallupNotice.js).
// Single-event quick-look: team_color rail + date + time + venue (with
// optional map link) + optional opponent.
//
// Wave 4.2-A doctrine: composer pushes literal field values; renderer
// is pure HTML/plainText.

import { escapeHtml } from './_util';
import { safeHref } from './_safeHref';
import { BORDER_DEFAULT, BRAND_GOLD_TEXT, TEXT_NAVY, TEXT_SLATE, TEXT_SLATE_DARK } from '../colors';

export default function renderEventCard(section) {
  const color = section?.team_color || '#c9952e';
  const date = section?.date || '';
  const time = section?.time || '';
  const locationName = section?.location_name || '';
  const locationMapUrl = section?.location_map_url || '';
  const opponent = section?.opponent || '';

  const dateLine = [date, time].filter(Boolean).join(' · ');
  const venue = locationName
    ? (locationMapUrl
        ? `<a href="${escapeHtml(safeHref(locationMapUrl))}" style="color:${BRAND_GOLD_TEXT};text-decoration:none;font-weight:500;">${escapeHtml(locationName)}</a>`
        : escapeHtml(locationName))
    : '';
  const opponentLine = opponent ? `vs. ${escapeHtml(opponent)}` : '';

  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:12px 0;">'
    + `<tr><td style="border-left:4px solid ${escapeHtml(color)};padding:14px 16px;background-color:#ffffff;border-top:1px solid ${BORDER_DEFAULT};border-right:1px solid ${BORDER_DEFAULT};border-bottom:1px solid ${BORDER_DEFAULT};border-radius:0 6px 6px 0;font-family:Inter,system-ui,sans-serif;">`
    + (dateLine
        ? `<div style="font-size:13px;font-weight:600;color:${TEXT_NAVY};line-height:1.4;">${escapeHtml(dateLine)}</div>`
        : '')
    + (opponentLine
        ? `<div style="font-size:15px;font-weight:700;color:${TEXT_NAVY};line-height:1.4;margin-top:4px;">${opponentLine}</div>`
        : '')
    + (venue
        ? `<div style="font-size:13px;color:${TEXT_SLATE_DARK};line-height:1.4;margin-top:4px;">${venue}</div>`
        : `<div style="font-size:13px;color:${TEXT_SLATE};font-style:italic;line-height:1.4;margin-top:4px;">Location TBD</div>`)
    + '</td></tr></table>';

  const plainLines = [];
  if (dateLine) plainLines.push(dateLine);
  if (opponentLine) plainLines.push(`vs. ${opponent}`);
  if (locationName) {
    plainLines.push(locationMapUrl ? `${locationName} — ${locationMapUrl}` : locationName);
  } else {
    plainLines.push('Location TBD');
  }

  return { html, plainText: plainLines.join('\n') };
}
