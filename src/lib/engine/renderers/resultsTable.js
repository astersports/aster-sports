// Renderer #5 — Saturday/Day-1 results table.
// 2-column (matchup + secondary / score + result letter). Color = green W,
// red L, muted T.

import { escapeHtml } from './_util';

const RESULT_COLORS = {
  W: '#16a34a',
  L: '#dc2626',
  T: '#94a3b8',
};

function renderRow(row, isLast) {
  const color = RESULT_COLORS[row?.result] || RESULT_COLORS.T;
  const bottom = isLast ? '' : 'border-bottom:1px solid #e5e7eb;';
  const score = `${row?.score_us ?? ''}-${row?.score_them ?? ''}`;
  return '<tr>'
    + `<td valign="middle" style="padding:14px 16px;${bottom}">`
    + `<div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.4;">${escapeHtml(row?.primary ?? '')}</div>`
    + `<div style="font-size:12px;color:#94a3b8;line-height:1.4;margin-top:2px;">${escapeHtml(row?.secondary ?? '')}</div>`
    + '</td>'
    + `<td align="right" valign="middle" style="padding:14px 16px;${bottom}width:120px;">`
    + `<div style="font-size:18px;font-weight:700;color:${color};line-height:1;">${escapeHtml(score)}</div>`
    + `<div style="font-size:11px;font-weight:700;color:${color};letter-spacing:1px;line-height:1.4;margin-top:4px;">${escapeHtml(row?.result ?? '')}</div>`
    + '</td>'
    + '</tr>';
}

function toTitleCase(s) {
  return String(s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderPlain(rows) {
  const lines = ['Saturday Results', '────────────────'];
  rows.forEach((r) => {
    const primary = toTitleCase(r?.primary || '').padEnd(34).slice(0, 34);
    const score = `${r?.score_us ?? ''}-${r?.score_them ?? ''}`.padStart(7);
    lines.push(`${primary}${score} (${r?.result || '?'})`);
  });
  return lines.join('\n');
}

export default function render(section) {
  const rows = section?.rows || [];
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:6px;font-family:Inter,system-ui,sans-serif;">'
    + rows.map((r, i) => renderRow(r, i === rows.length - 1)).join('')
    + '</table>';
  return { html, plainText: renderPlain(rows) };
}
