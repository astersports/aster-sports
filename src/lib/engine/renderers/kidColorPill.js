// Renderer — family_guide per-kid section header. Mirrors
// teamColorPill but the colored pill bears the KID's name and the
// secondary label shows the team they're playing on for these games.
// Kid color = team_color of that game (per audit rec — same kid on
// 11U Girls renders purple; same kid on 9U Boys renders blue).
// Resolver computes the dominant or per-event color upstream; this
// renderer trusts the value is present.

import { escapeHtml } from './_util';
import { TEXT_NAVY, TEXT_SLATE } from '../colors';

export default function renderKidColorPill(section) {
  const kid = section?.kid_name || 'Kid';
  const team = section?.team_name || 'Team';
  const color = section?.team_color || '#4a8fd4';
  const count = section?.event_count || 0;
  const countLabel = count === 1 ? '1 game' : `${count} games`;
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:20px 0 8px 0;">'
    + `<tr><td style="font-family:Inter,system-ui,sans-serif;">`
    + `<span style="display:inline-block;padding:4px 12px;background-color:${escapeHtml(color)};color:#ffffff;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(kid)}</span>`
    + `<span style="display:inline-block;margin-left:10px;font-size:12px;color:${TEXT_SLATE};font-weight:500;">${escapeHtml(team)} · ${escapeHtml(countLabel)}</span>`
    + '</td></tr></table>';
  const plainText = `${kid.toUpperCase()} · ${team} · ${countLabel}`;
  void TEXT_NAVY;
  return { html, plainText };
}
