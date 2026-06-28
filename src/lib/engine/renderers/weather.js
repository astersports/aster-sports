// Renderer — weather strip (tournament_prelim gold standard).
//
// Reference: docs/BRIEFING_FULL_PRESENTATION.html §2 — .ebar.gold bar
// ("Weather · Waltham, MA") + .wx / .wxd per-day cells: day label,
// emoji icon, temp, rain%. Auto-sourced (Open-Meteo, fetched at
// resolve time via the injected fetcher — AP #27).
//
// Inline-styled + table-based per CLAUDE.md §13. Cells render as
// equal-width <td>s in one row (the email-safe analog of the mockup's
// flex .wx). section.days[] = { day, em, tp, rn }.

import { escapeHtml } from './_util';
import { goldBarHtml } from './_goldBar';
import { BORDER_DEFAULT, BRAND_GOLD_TEXT, TEXT_NAVY, TEXT_SLATE } from '../colors';

function cellHtml(d, isLast) {
  const border = isLast ? '' : `border-right:1px solid ${BORDER_DEFAULT};`;
  const rain = d.rn
    ? `<div style="font-size:10.5px;font-weight:700;color:${BRAND_GOLD_TEXT};margin-top:3px;">${escapeHtml(d.rn)}</div>`
    : '';
  return `<td align="center" valign="top" style="padding:11px 6px;${border}font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:10px;font-weight:700;letter-spacing:0.6px;color:${TEXT_SLATE};text-transform:uppercase;">${escapeHtml(d.day || '')}</div>`
    + `<div style="font-size:20px;margin:5px 0;line-height:1;">${escapeHtml(d.em || '')}</div>`
    + `<div style="font-size:15px;font-weight:800;color:${TEXT_NAVY};">${escapeHtml(d.tp || '')}</div>`
    + rain
    + '</td>';
}

export default function renderWeather(section) {
  const days = (section?.days || []).filter(Boolean);
  if (!days.length) return { html: '', plainText: '' };
  const strip = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;border:1px solid ${BORDER_DEFAULT};border-radius:8px;overflow:hidden;margin:0 0 8px 0;">`
    + '<tr>' + days.map((d, i) => cellHtml(d, i === days.length - 1)).join('') + '</tr>'
    + '</table>';
  const html = goldBarHtml(section.bar_label || 'Weather') + strip;
  const plainText = `${(section.bar_label || 'Weather').toUpperCase()}\n`
    + days.map((d) => `${d.day}: ${d.tp}${d.rn ? ` (${d.rn})` : ''}`).join('\n');
  return { html, plainText };
}
