// Template T4 — Other games to watch.
// Cobalt eyebrow + bullet list "{time} — {team_a} vs {team_b} ({court})".

import { escapeHtml } from './_util';
import { COBALT } from '../colors';

function renderItem(g) {
  const courtSpan = g?.court ? ` <span style="color:#94a3b8;">(${escapeHtml(g.court)})</span>` : '';
  return '<tr><td style="padding:6px 0 6px 0;font-family:Inter,system-ui,sans-serif;font-size:14px;color:#0f172a;line-height:1.5;">'
    + `<span style="display:inline-block;width:6px;height:6px;background-color:${COBALT};border-radius:50%;margin-right:10px;vertical-align:middle;"></span>`
    + escapeHtml(g?.time || '') + ' &mdash; '
    + escapeHtml(g?.team_a || '') + ' vs ' + escapeHtml(g?.team_b || '')
    + courtSpan
    + '</td></tr>';
}

function renderPlain(games) {
  const lines = ['Other games to watch:'];
  (games || []).forEach((g) => {
    const court = g?.court ? ` (${g.court})` : '';
    lines.push(`• ${g?.time || ''} — ${g?.team_a || ''} vs ${g?.team_b || ''}${court}`);
  });
  return lines.join('\n');
}

export default function render(section) {
  const games = section?.games || [];
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding-bottom:8px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:11px;font-weight:700;color:${COBALT};letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;">OTHER GAMES TO WATCH</div>`
    + '</td></tr>'
    + games.map(renderItem).join('')
    + '</table>';
  return { html, plainText: renderPlain(games) };
}
