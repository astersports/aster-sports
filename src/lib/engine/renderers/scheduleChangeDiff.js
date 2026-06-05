// Section renderer — schedule_change_diff. Renders the was/now swap card for
// a non-cancelled schedule change. The "cancelled" treatment is a separate
// `cancellation_card` section, so this renderer never handles cancellation.
//
// Section shape (PRODUCED BY composer buildDiffSection in
// resolvers/scheduleChangeHelpers.js — this renderer consumes it directly):
//   { kind: 'schedule_change_diff',
//     changed_fields: ['start_at','end_at','location','opponent'],  // event-row field names
//     before: { time: 'Mon, May 11 from 7:35 PM to 8:35 PM', label, location, opponent },
//     after:  { time: '...', label, location, opponent },
//     eventTitle?: 'optional context heading' }
//
// `time` is PRE-FORMATTED by the composer (DST-correct ET range). `start_at`
// and `end_at` in changed_fields both map to the single "When" (time) row.
//
// HTML: strikethrough old + bold new (color contrast per D-RSVP-1).
// Plain-text: uppercase PREVIOUS / UPDATED prefixes, no markup.

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, TEXT_GRAPHITE, TEXT_NAVY } from '../colors';

// Map each row kind to the before/after field it reads + its label.
const ROWS = [
  { kind: 'time', label: 'When', field: 'time', triggers: ['start_at', 'end_at'] },
  { kind: 'location', label: 'Where', field: 'location', triggers: ['location'] },
  { kind: 'opponent', label: 'Opponent', field: 'opponent', triggers: ['opponent'] },
];

function diffRows(changedFields = [], before = {}, after = {}) {
  const changed = new Set(changedFields);
  const rows = [];
  for (const r of ROWS) {
    if (!r.triggers.some((f) => changed.has(f))) continue;
    const prev = before?.[r.field];
    const next = after?.[r.field];
    rows.push({
      label: r.label,
      prev: prev == null || prev === '' ? '—' : String(prev),
      next: next == null || next === '' ? '—' : String(next),
    });
  }
  return rows;
}

function rowHtml(label, prev, next) {
  const labelStyle = `font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px 0;`;
  const prevStyle = `font-size:14px;color:${TEXT_GRAPHITE};text-decoration:line-through;line-height:1.5;`;
  const nextStyle = `font-size:15px;color:${TEXT_NAVY};font-weight:700;line-height:1.5;`;
  return '<div style="margin:0 0 14px 0;">'
    + `<div style="${labelStyle}color:${TEXT_GRAPHITE};">PREVIOUS · ${escapeHtml(label)}</div>`
    + `<div style="${prevStyle}">${escapeHtml(prev)}</div>`
    + `<div style="${labelStyle}color:${TEXT_NAVY};margin-top:6px;">UPDATED · ${escapeHtml(label)}</div>`
    + `<div style="${nextStyle}">${escapeHtml(next)}</div>`
    + '</div>';
}

export default function render(section) {
  const title = section?.eventTitle || '';
  const rows = diffRows(section?.changed_fields, section?.before, section?.after);
  if (!rows.length) return { html: '', plainText: '' };
  const titleHtml = title
    ? `<div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${TEXT_GRAPHITE};margin:0 0 8px 0;">${escapeHtml(title)}</div>`
    : '';
  const blocks = rows.map((r) => rowHtml(r.label, r.prev, r.next)).join('');
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;margin:8px 0 16px 0;">`
    + `<tr><td style="padding:16px 20px;border:1px solid ${BORDER_DEFAULT};border-radius:10px;">`
    + titleHtml + blocks
    + '</td></tr></table>';
  const plainLines = [];
  if (title) plainLines.push(title);
  rows.forEach((r) => {
    plainLines.push(`PREVIOUS ${r.label}: ${r.prev}`);
    plainLines.push(`UPDATED ${r.label}: ${r.next}`);
  });
  return { html, plainText: plainLines.join('\n') };
}
