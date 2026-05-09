// Template T2 — Tournament champion callout.
// Gold-bordered cream box, centered. Big trophy emoji, team name uppercase
// 24px navy, tournament name underneath in muted.

import { escapeHtml } from './_util';

export default function render(section) {
  const team = String(section?.team_name || '').toUpperCase();
  const tourn = section?.tournament_name || '';
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:24px 0;">'
    + '<tr><td align="center" style="padding:28px 20px;background-color:#fffbeb;'
    + 'border:2px solid #fbbf24;border-radius:8px;font-family:Inter,system-ui,sans-serif;">'
    + '<div style="font-size:40px;line-height:1;margin-bottom:10px;">&#127942;</div>'
    + `<div style="font-size:24px;font-weight:700;color:#0f172a;letter-spacing:1px;text-transform:uppercase;line-height:1.2;">${escapeHtml(team)} &mdash; CHAMPIONS</div>`
    + (tourn ? `<div style="font-size:13px;color:#64748b;line-height:1.5;margin-top:8px;">${escapeHtml(tourn)}</div>` : '')
    + '</td></tr></table>';
  const plainText = [
    `[Trophy] ${team} — CHAMPIONS`,
    tourn,
  ].filter(Boolean).join('\n');
  return { html, plainText };
}
