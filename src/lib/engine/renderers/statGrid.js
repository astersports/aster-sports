// Renderer #2 — 4-up stat grid.
// Exactly 4 cells, each = big number + small label. Tone tints the number
// only (cobalt default / green positive / red negative).

import { escapeHtml } from './_util';
import { COBALT } from '../colors';

const TONE_COLORS = {
  neutral:  COBALT,
  positive: '#16a34a',
  negative: '#dc2626',
};

function renderCell(cell, isLast) {
  const tone = TONE_COLORS[cell?.tone] || TONE_COLORS.neutral;
  const borderRight = isLast ? '' : 'border-right:1px solid #e5e7eb;';
  return '<td width="25%" valign="top" align="center"'
    + ` style="padding:18px 8px;${borderRight}">`
    + `<div style="font-size:28px;font-weight:700;color:${tone};line-height:1;margin-bottom:8px;">${escapeHtml(cell?.value ?? '')}</div>`
    + '<div style="font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;">'
    + escapeHtml(cell?.label ?? '')
    + '</div></td>';
}

export default function render(section) {
  const cells = (section?.cells || []).slice(0, 4);
  // Pad to 4 with blanks so the grid layout stays even.
  while (cells.length < 4) cells.push({ value: '', label: '' });
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;font-family:Inter,system-ui,sans-serif;">'
    + '<tr>'
    + cells.map((c, i) => renderCell(c, i === 3)).join('')
    + '</tr></table>';
  const plainText = cells
    .filter((c) => c.label || c.value)
    .map((c) => `${c.label} ${c.value}`.trim())
    .join(' · ');
  return { html, plainText };
}
