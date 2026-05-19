// Renderer — conflict callout. Amber-toned block surfacing pairs of
// overlapping events. Shared between coach_roundup (multi-team for the
// same coach: "team_a vs team_b") and family_guide (multi-team across
// different kids: "kid_a (team_a) vs kid_b (team_b)"). When the item
// carries kid_a / kid_b (family_guide path per PR 5b-3), they render
// in front of the team name; coach_roundup items omit kid_* and render
// team-only.

import { escapeHtml } from './_util';
import { AMBER_DEEP, CREAM, GOLD } from '../colors';

function renderSide(kid, team, time) {
  const k = escapeHtml(kid || '');
  const t = escapeHtml(team || '');
  const ti = escapeHtml(time || '');
  if (k) return `${k} (${t}) ${ti}`.trim();
  return `${t} ${ti}`.trim();
}

function renderItem(item) {
  const date = escapeHtml(item.date_label || '');
  const a = renderSide(item.kid_a, item.team_a || 'Team A', item.time_a);
  const b = renderSide(item.kid_b, item.team_b || 'Team B', item.time_b);
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
  const plainText = ['SCHEDULE CONFLICTS', ...items.map((i) => {
    const a = i.kid_a ? `${i.kid_a} (${i.team_a || ''}) ${i.time_a || ''}` : `${i.team_a || ''} ${i.time_a || ''}`;
    const b = i.kid_b ? `${i.kid_b} (${i.team_b || ''}) ${i.time_b || ''}` : `${i.team_b || ''} ${i.time_b || ''}`;
    return `${i.date_label || ''} — ${a.trim()} vs ${b.trim()}`;
  })].join('\n');
  return { html, plainText };
}
