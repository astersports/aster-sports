// Section renderer — schedule_change_diff. Compares before/after raw
// payloads (event row shape) and renders only the fields that changed.
//
// Section shape:
//   { kind: 'schedule_change_diff',
//     before: { start_at, end_at, location, status, ... },
//     after:  { start_at, end_at, location, status, ... },
//     eventTitle: 'Event title for context' }
//
// Fields handled:
//   - start_at + end_at  → rendered as time RANGE "7:35 PM – 9:05 PM"
//                          (so duration changes are visible)
//   - location           → location string
//   - status='cancelled' → big "CANCELLED" callout, suppresses range diff
//
// HTML: strikethrough old + bold new (color contrast per D-RSVP-1).
// Plain-text: uppercase PREVIOUS / UPDATED prefixes, no markup.
//
// Wave 3.8.1 hotfix: previously rendered start_at only, so end-only
// and location-only changes were invisible.

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, RSVP_OUT_RED, TEXT_GRAPHITE, TEXT_NAVY } from '../colors';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}
function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
}
function timeRange(start, end) {
  if (!start) return '';
  const date = fmtDate(start);
  const startT = fmtTime(start);
  const endT = end ? fmtTime(end) : '';
  return endT ? `${date} · ${startT} – ${endT}` : `${date} · ${startT}`;
}

function diffFields(before = {}, after = {}) {
  const changed = [];
  const timeChanged = (before.start_at || null) !== (after.start_at || null)
    || (before.end_at || null) !== (after.end_at || null);
  const locChanged = (before.location || null) !== (after.location || null);
  const oppChanged = (before.opponent || null) !== (after.opponent || null);
  const cancelled = after.status === 'cancelled' && before.status !== 'cancelled';
  if (cancelled) changed.push({ kind: 'cancelled' });
  else {
    if (timeChanged) changed.push({ kind: 'time', prev: timeRange(before.start_at, before.end_at), next: timeRange(after.start_at, after.end_at) });
    if (locChanged) changed.push({ kind: 'location', prev: before.location || '—', next: after.location || '—' });
    if (oppChanged) changed.push({ kind: 'opponent', prev: before.opponent || 'TBD', next: after.opponent || 'TBD' });
  }
  return changed;
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

function cancelledHtml() {
  return '<div style="margin:0 0 14px 0;">'
    + `<div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${RSVP_OUT_RED};margin:0 0 6px 0;">CANCELLED</div>`
    + `<div style="font-size:15px;color:${TEXT_NAVY};line-height:1.5;">This event has been cancelled.</div>`
    + '</div>';
}

const LABELS = { time: 'When', location: 'Where', opponent: 'Opponent' };

export default function render(section) {
  const title = section?.eventTitle || '';
  const changes = diffFields(section?.before, section?.after);
  if (!changes.length) return { html: '', plainText: '' };
  const titleHtml = title
    ? `<div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${TEXT_GRAPHITE};margin:0 0 8px 0;">${escapeHtml(title)}</div>`
    : '';
  const blocks = changes.map((c) => c.kind === 'cancelled' ? cancelledHtml() : rowHtml(LABELS[c.kind], c.prev, c.next)).join('');
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;margin:8px 0 16px 0;">`
    + `<tr><td style="padding:16px 20px;border:1px solid ${BORDER_DEFAULT};border-radius:10px;">`
    + titleHtml + blocks
    + '</td></tr></table>';
  const plainLines = [];
  if (title) plainLines.push(title);
  changes.forEach((c) => {
    if (c.kind === 'cancelled') plainLines.push('CANCELLED: This event has been cancelled.');
    else { plainLines.push(`PREVIOUS ${LABELS[c.kind]}: ${c.prev}`); plainLines.push(`UPDATED ${LABELS[c.kind]}: ${c.next}`); }
  });
  return { html, plainText: plainLines.join('\n') };
}
