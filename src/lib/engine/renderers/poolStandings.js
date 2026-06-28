// Renderer — pool standings (tournament_prelim gold standard).
//
// Reference: docs/BRIEFING_FULL_PRESENTATION.html §2 — .ebar.gold bar
// ("Division 3 Orange") + .standrow rows, with the home team's row
// highlighted (.standrow.me: gold wash + bold gold text).
//
// Inline-styled + table-based per CLAUDE.md §13. Each row is one
// pasted standings line (resolver parses line-per-row, heuristic v1).
// section.rows[].is_home drives the highlight.

import { escapeHtml } from './_util';
import { goldBarHtml } from './_goldBar';
import { BORDER_DEFAULT, BRAND_GOLD_TEXT, TEXT_NAVY } from '../colors';

const HOME_BG = '#FBF3DC'; // gold wash (Hub gold-soft; was cobalt #eef4fb) — pairs with BRAND_GOLD_TEXT

function rowHtml(row, isLast) {
  const home = !!row.is_home;
  const border = isLast ? '' : `border-bottom:1px solid ${BORDER_DEFAULT};`;
  const bg = home ? `background-color:${HOME_BG};` : '';
  const color = home ? BRAND_GOLD_TEXT : TEXT_NAVY;
  const weight = home ? 800 : 500;
  return `<tr><td style="padding:9px 13px;${border}${bg}font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:${weight};color:${color};">`
    + escapeHtml(row.text)
    + '</td></tr>';
}

export default function renderPoolStandings(section) {
  const rows = (section?.rows || []).filter((r) => r && r.text);
  if (!rows.length) return { html: '', plainText: '' };
  const body = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;border:1px solid ${BORDER_DEFAULT};border-radius:6px;overflow:hidden;margin:0 0 8px 0;">`
    + rows.map((r, i) => rowHtml(r, i === rows.length - 1)).join('')
    + '</table>';
  const html = goldBarHtml(section.bar_label || 'Standings') + body;
  const plainText = `${(section.bar_label || 'Standings').toUpperCase()}\n`
    + rows.map((r) => (r.is_home ? `→ ${r.text}` : r.text)).join('\n');
  return { html, plainText };
}
