// Renderer #4 — Pool standings table.
// 4-column (TEAM / W / L / PD), bordered. Own-team row highlighted with
// light-cobalt bg, navy bold text, and a 3px cobalt left border.

import { escapeHtml } from './_util';

const TH_BASE = 'padding:10px 12px;font-size:11px;font-weight:700;color:#4a8fd4;letter-spacing:1.5px;text-transform:uppercase;border-bottom:2px solid #4a8fd4;';
const TD_BASE = 'padding:10px 12px;font-size:14px;border-bottom:1px solid #e5e7eb;';

function pdColor(pd) {
  const s = String(pd ?? '').trim();
  if (s.startsWith('+')) return '#16a34a';
  if (s.startsWith('-')) return '#dc2626';
  return '#94a3b8';
}

function renderRow(row, isLast) {
  const own = !!row?.is_own;
  const bg = own ? 'background-color:#eff6ff;' : '';
  const teamColor = own ? 'color:#1e3a8a;font-weight:700;' : 'color:#0f172a;';
  const teamBorder = own ? 'border-left:3px solid #4a8fd4;' : '';
  const numColor = own ? 'color:#1e3a8a;font-weight:700;' : 'color:#0f172a;';
  const pdWeight = own ? 'font-weight:700;' : 'font-weight:600;';
  const lastBorder = isLast ? 'border-bottom:none;' : '';
  return `<tr style="${bg}">`
    + `<td align="left" style="${TD_BASE}${lastBorder}${teamColor}${teamBorder}">${escapeHtml(row?.team_name ?? '')}</td>`
    + `<td align="right" style="${TD_BASE}${lastBorder}${numColor}width:50px;">${escapeHtml(row?.w ?? '')}</td>`
    + `<td align="right" style="${TD_BASE}${lastBorder}${numColor}width:50px;">${escapeHtml(row?.l ?? '')}</td>`
    + `<td align="right" style="${TD_BASE}${lastBorder}color:${pdColor(row?.pd)};${pdWeight}width:60px;">${escapeHtml(row?.pd ?? '')}</td>`
    + '</tr>';
}

function renderPlain(rows) {
  const lines = ['TEAM                  W  L   PD'];
  rows.forEach((r) => {
    const name = String(r?.team_name ?? '').padEnd(20).slice(0, 20);
    const w = String(r?.w ?? '').padStart(2);
    const l = String(r?.l ?? '').padStart(2);
    const pd = String(r?.pd ?? '').padStart(4);
    const star = r?.is_own ? ' *' : '';
    lines.push(`${name}${star}  ${w} ${l}  ${pd}`);
  });
  if (rows.some((r) => r?.is_own)) lines.push('(* = own team)');
  return lines.join('\n');
}

export default function render(section) {
  const rows = section?.rows || [];
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:6px;font-family:Inter,system-ui,sans-serif;overflow:hidden;">'
    + '<tr style="background-color:#f8fafc;">'
    + `<th align="left" style="${TH_BASE}">Team</th>`
    + `<th align="right" style="${TH_BASE}width:50px;">W</th>`
    + `<th align="right" style="${TH_BASE}width:50px;">L</th>`
    + `<th align="right" style="${TH_BASE}width:60px;">PD</th>`
    + '</tr>'
    + rows.map((r, i) => renderRow(r, i === rows.length - 1)).join('')
    + '</table>';
  return { html, plainText: renderPlain(rows) };
}
