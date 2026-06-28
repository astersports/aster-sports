// Renderer — family_guide quick-link nav. Per-kid row linking to the
// team detail page (PR 5b-2 wired the URL via buildQuickLinkNav). Row
// content is wrapped in <a href> when item.url is present; falls back
// to non-link rendering when url is null (preserves the 5a/5b-1 visual
// for any cached fixtures or test paths that pre-date 5b-2). Single
// URL per kid keeps the visual compact; per-event URLs (RSVP, map)
// belong on the team detail page itself, not in this nav.

import { escapeHtml } from './_util';
import { BORDER_SUBTLE, TEXT_SLATE } from '../colors';

function renderRow(item) {
  const kid = escapeHtml(item.kid_name || 'Kid');
  const team = escapeHtml(item.team_name || 'Team');
  const color = escapeHtml(item.team_color || '#c9952e');
  const url = item.url ? escapeHtml(item.url) : null;
  const inner = `<strong style="color:#0f172a;">${kid}</strong> <span style="opacity:0.7;">·</span> ${team}`;
  const cellContent = url
    ? `<a href="${url}" style="color:${TEXT_SLATE};text-decoration:none;display:block;">${inner}</a>`
    : inner;
  return '<tr>'
    + `<td style="width:6px;background-color:${color};padding:0;"></td>`
    + `<td style="padding:8px 12px;font-family:Inter,system-ui,sans-serif;font-size:13px;color:${TEXT_SLATE};">`
    + cellContent
    + '</td></tr>';
}

export default function renderQuickLinkNav(section) {
  const items = section?.items || [];
  if (!items.length) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;margin:16px 0;border:1px solid ${BORDER_SUBTLE};border-radius:6px;overflow:hidden;">`
    + items.map(renderRow).join('')
    + '</table>';
  const plainText = items.map((i) => `${i.kid_name || 'Kid'} · ${i.team_name || 'Team'}`).join('\n');
  return { html, plainText };
}
