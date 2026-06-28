// Renderer — Venue list block.
// Wave 5 (cutover wave PR 1) — Top-of-email venue list. Each venue
// renders as "{Name} | {City} | Map" (multi-venue) OR
// "All games at {Name} / {Address} | Map" (single-venue with address).
// Resolver computes single vs multi from distinct locations across
// the tournament's events.

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, BRAND_GOLD_TEXT, TEXT_NAVY, TEXT_SLATE } from '../colors';

function renderVenueRow(v) {
  const mapLink = v.map_url
    ? ` | <a href="${escapeHtml(v.map_url)}" target="_blank" rel="noopener" style="color:${BRAND_GOLD_TEXT};text-decoration:none;">Map</a>`
    : '';
  const cityPart = v.city ? ` | ${escapeHtml(v.city)}` : '';
  return `<div style="font-size:14px;color:${TEXT_NAVY};line-height:1.6;text-align:center;">`
    + `<strong>${escapeHtml(v.name)}</strong>${cityPart}${mapLink}`
    + '</div>';
}

function renderSingleWithAddress(v) {
  const mapLink = v.map_url
    ? ` | <a href="${escapeHtml(v.map_url)}" target="_blank" rel="noopener" style="color:${BRAND_GOLD_TEXT};text-decoration:none;">Map</a>`
    : '';
  return `<div style="font-size:14px;font-weight:600;color:${TEXT_NAVY};line-height:1.6;text-align:center;">All games at ${escapeHtml(v.name)}</div>`
    + `<div style="font-size:13px;color:${TEXT_SLATE};line-height:1.5;text-align:center;margin-top:2px;">${escapeHtml(v.address || '')}${mapLink}</div>`;
}

export default function renderVenueList(section) {
  const { venues = [], single_with_address = false } = section || {};
  if (!venues.length) return { html: '', plainText: '' };
  const inner = single_with_address && venues.length === 1
    ? renderSingleWithAddress(venues[0])
    : venues.map(renderVenueRow).join('');
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + `<tr><td style="padding:14px 20px;background-color:#ffffff;border:1px solid ${BORDER_DEFAULT};border-radius:6px;font-family:Inter,system-ui,sans-serif;">`
    + inner
    + '</td></tr></table>';
  const plainText = venues.map((v) => `${v.name}${v.city ? ' · ' + v.city : ''}${v.map_url ? ' · ' + v.map_url : ''}`).join('\n');
  return { html, plainText };
}
