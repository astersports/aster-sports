// Renderer — coach_roundup conflict callout. Amber-toned block
// surfacing pairs of overlapping games across the coach's teams.
// Surfaces every conflicting pair distinctly; coach can decide
// downstream which game to delegate (PR 6 will add the
// event_coach_assignments table for in-app delegation).

import { escapeHtml } from './_util';
import { AMBER_DEEP, CREAM, GOLD } from '../colors';

function renderItem(item) {
  const date = escapeHtml(item.date_label || '');
  const a = `${escapeHtml(item.team_a || 'Team A')} ${escapeHtml(item.time_a || '')}`.trim();
  const b = `${escapeHtml(item.team_b || 'Team B')} ${escapeHtml(item.time_b || '')}`.trim();
  return `<tr><td style="padding:6px 0;font-family:Inter,system-ui,sans-serif;font-size:14px;color:${AMBER_DEEP};line-height:1.5;">`
    + `<strong>${date}</strong> — ${a} <span style="opacity:0.7;">vs</span> ${b}`
    + '</td></tr>';
}

export default function renderConflictCallout(section) {
  const items = section?.items || [];
  if (!items.length) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;margin:12px 0;background-color:${CREAM};border:1px solid ${GOLD};border-radius:6px;">`
    + '<tr><td style="padding:14px 18px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:11px;font-weight:700;color:${AMBER_DEEP};letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;margin-bottom:8px;">SCHEDULE CONFLICTS</div>`
    + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${items.map(renderItem).join('')}</table>`
    + '</td></tr></table>';
  const plainText = ['SCHEDULE CONFLICTS', ...items.map((i) => `${i.date_label || ''} — ${i.team_a || ''} ${i.time_a || ''} vs ${i.team_b || ''} ${i.time_b || ''}`)].join('\n');
  return { html, plainText };
}
