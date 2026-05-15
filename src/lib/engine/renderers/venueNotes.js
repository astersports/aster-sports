// Wave 5 PR 3a — per-venue notes section. Surfaces operator-curated
// prose on locations (notes / parking_notes / entry_instructions)
// inside the tournament_prelim briefing so parents see local tips
// (e.g. "Casa Bianca Pizza next door") before they arrive.
//
// Resolver emits this section after venue_list. Builder filters
// out venues with no notes data so the section disappears entirely
// when there's nothing to surface — keeps the briefing tight when
// no tips have been entered yet.

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, COBALT, TEXT_NAVY, TEXT_SLATE_DARK } from '../colors';

const LABELS = { notes: 'Tip', parking_notes: 'Parking', entry_instructions: 'Entry' };

function renderNoteLine(label, text) {
  return `<tr><td style="padding:4px 0;font-family:Inter,system-ui,sans-serif;font-size:14px;color:${TEXT_SLATE_DARK};line-height:1.5;">`
    + `<span style="display:inline-block;width:6px;height:6px;background-color:${COBALT};border-radius:50%;margin-right:10px;vertical-align:middle;"></span>`
    + `<strong style="color:${TEXT_NAVY};">${escapeHtml(label)}:</strong> ${escapeHtml(text)}`
    + '</td></tr>';
}

function renderVenueBlock(v) {
  const rows = [];
  for (const key of ['notes', 'parking_notes', 'entry_instructions']) {
    const text = v[key]; if (!text) continue;
    rows.push(renderNoteLine(LABELS[key], String(text).trim()));
  }
  if (!rows.length) return '';
  return '<tr><td style="padding:12px 16px;background-color:#ffffff;border:1px solid ' + BORDER_DEFAULT + ';border-radius:6px;margin-bottom:8px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:12px;font-weight:700;color:${TEXT_NAVY};letter-spacing:1px;text-transform:uppercase;line-height:1.4;margin-bottom:8px;">${escapeHtml(v.name)}</div>`
    + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${rows.join('')}</table>`
    + '</td></tr>';
}

export default function renderVenueNotes(section) {
  const venues = (section?.venues || []).filter((v) => v && (v.notes || v.parking_notes || v.entry_instructions));
  if (!venues.length) return { html: '', plainText: '' };
  const blocks = venues.map(renderVenueBlock).filter(Boolean).join('');
  if (!blocks) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:separate;border-spacing:0 8px;margin:12px 0;">'
    + blocks
    + '</table>';
  const plainText = venues.map((v) => {
    const lines = [];
    for (const key of ['notes', 'parking_notes', 'entry_instructions']) {
      if (v[key]) lines.push(`${LABELS[key]}: ${String(v[key]).trim()}`);
    }
    return lines.length ? `${v.name}\n  ${lines.join('\n  ')}` : '';
  }).filter(Boolean).join('\n');
  return { html, plainText };
}
