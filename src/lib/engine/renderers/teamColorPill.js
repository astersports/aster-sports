// Renderer — coach_roundup per-team section header. Colored pill
// + team name + event-count badge. The team_color comes from the
// teams row (per CLAUDE.md §3, inline hex from DB is the one
// allowed inline-style exception); a fallback to cobalt is applied
// upstream so this renderer can trust the color is present.

import { escapeHtml } from './_util';
import { TEXT_NAVY, TEXT_SLATE } from '../colors';

export default function renderTeamColorPill(section) {
  const name = section?.team_name || 'Team';
  const color = section?.team_color || '#c9952e';
  const count = section?.event_count || 0;
  const countLabel = count === 1 ? '1 game' : `${count} games`;
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:20px 0 8px 0;">'
    + `<tr><td style="font-family:Inter,system-ui,sans-serif;">`
    + `<span style="display:inline-block;padding:4px 12px;background-color:${escapeHtml(color)};color:#ffffff;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(name)}</span>`
    + `<span style="display:inline-block;margin-left:10px;font-size:12px;color:${TEXT_SLATE};font-weight:500;">${escapeHtml(countLabel)}</span>`
    + '</td></tr></table>';
  const plainText = `${name.toUpperCase()} · ${countLabel}`;
  // TEXT_NAVY imported for future use; suppress unused-import lint.
  void TEXT_NAVY;
  return { html, plainText };
}
