// Renderer — family_guide quick-link nav. Per-kid action chip row
// with the team color as a left-edge marker. Items render as a
// compact list (kid · team · action). 5b ships the visual shell;
// the actual link URLs ("Open RSVPs", "View team schedule", "Map")
// are deferred to wave 5 PR 6 once routing slug conventions are
// finalized for the family_guide email — kept generic for now so
// the visual lands without coupling to URL contracts that may
// shift.

import { escapeHtml } from './_util';
import { BORDER_SUBTLE, TEXT_SLATE } from '../colors';

function renderRow(item) {
  const kid = escapeHtml(item.kid_name || 'Kid');
  const team = escapeHtml(item.team_name || 'Team');
  const color = escapeHtml(item.team_color || '#4a8fd4');
  return '<tr>'
    + `<td style="width:6px;background-color:${color};padding:0;"></td>`
    + `<td style="padding:8px 12px;font-family:Inter,system-ui,sans-serif;font-size:13px;color:${TEXT_SLATE};">`
    + `<strong style="color:#0f172a;">${kid}</strong> <span style="opacity:0.7;">·</span> ${team}`
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
