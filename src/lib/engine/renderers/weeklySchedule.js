// Renderer #6 — Day-sectioned weekly schedule.
// Per-day blocks; each event row gets a 5px team-color left border. Empty
// days are skipped. tournament_placeholder variant uses cream bg + gold
// border + amber-bold "see [day] email" suffix span.
//
// Wave 3.5 additions per D2 + D4:
//   event.location_link  — when present, render " · map" (linked) inline
//                          after secondary text. Tournament placeholders
//                          pass null to omit the link.
//   event.rsvp_counts    — { going, maybe, out } when present, renders a
//                          third line "N going · M maybe · K out" (or
//                          "no RSVPs yet" when all zero). Omit field for
//                          back-compat (no third line rendered at all).

import { escapeHtml } from './_util';
import { AMBER_DEEP, BG_PAGE, BORDER_DEFAULT, COBALT, COBALT_DEEP, CREAM, GOLD, TEXT_GRAPHITE, TEXT_NAVY, TEXT_SLATE, TEXT_SLATE_DARK } from '../colors';

function renderDayHeader(label) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:24px 0 8px 0;">'
    + `<tr><td style="padding:0 0 6px 0;border-bottom:1px solid ${BORDER_DEFAULT};font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${COBALT_DEEP};text-transform:uppercase;line-height:1.4;">${escapeHtml(label)}</div>`
    + '</td></tr></table>';
}

function highlightEmailSuffix(text) {
  const safe = escapeHtml(text);
  return safe.replace(/(see\s+[A-Za-z]+\s+email)/gi,
    `<span style="color:${AMBER_DEEP};font-weight:500;">$1</span>`);
}

function renderMapLink(url) {
  if (!url) return '';
  return ` · <a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="color:${TEXT_SLATE_DARK};text-decoration:underline;">map</a>`;
}

function rsvpLine(counts) {
  if (!counts) return '';
  const { going = 0, maybe = 0, out = 0 } = counts;
  const text = (going + maybe + out) === 0
    ? 'no RSVPs yet'
    : `${going} going · ${maybe} maybe · ${out} out`;
  // Wave 3.6 §D2: bumped 12px→13px, color #94a3b8→TEXT_GRAPHITE (7.5:1).
  return `<div style="font-size:13px;color:${TEXT_GRAPHITE};line-height:1.5;margin-top:4px;">${escapeHtml(text)}</div>`;
}

function renderEvent(ev) {
  const isPlaceholder = ev?.variant === 'tournament_placeholder';
  const containerBg = isPlaceholder ? `background-color:${CREAM};` : `background-color:${BG_PAGE};`;
  const containerBorder = isPlaceholder ? `border:1px solid ${GOLD};` : `border:1px solid ${BORDER_DEFAULT};`;
  const teamColor = ev?.team_color || COBALT;
  const secondaryHtml = isPlaceholder
    ? highlightEmailSuffix(ev?.secondary || '')
    : escapeHtml(ev?.secondary || '');
  const mapHtml = isPlaceholder ? '' : renderMapLink(ev?.location_link);
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:8px 0 0 0;">'
    + '<tr><td style="padding:12px 14px;'
    + `${containerBg}${containerBorder}border-left:5px solid ${escapeHtml(teamColor)};`
    + 'border-radius:6px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:14px;font-weight:700;color:${TEXT_NAVY};line-height:1.4;">${escapeHtml(ev?.primary || '')}</div>`
    + `<div style="font-size:13px;color:${TEXT_SLATE};line-height:1.5;margin-top:3px;">${secondaryHtml}${mapHtml}</div>`
    + rsvpLine(ev?.rsvp_counts)
    + '</td></tr></table>';
}

function plainEventLines(ev) {
  const lines = [`  ${ev.primary}`];
  if (ev.secondary) {
    const map = ev?.location_link ? ` · ${ev.location_link}` : '';
    lines.push(`  ${ev.secondary}${map}`);
  }
  if (ev?.rsvp_counts) {
    const { going = 0, maybe = 0, out = 0 } = ev.rsvp_counts;
    lines.push(`  ${(going + maybe + out) === 0 ? 'no RSVPs yet' : `${going} going · ${maybe} maybe · ${out} out`}`);
  }
  return lines;
}

function renderPlain(days) {
  const lines = [];
  days.forEach((d) => {
    if (!d?.events?.length) return;
    lines.push(d.day_label);
    lines.push('────────────');
    d.events.forEach((ev) => { plainEventLines(ev).forEach((l) => lines.push(l)); });
    lines.push('');
  });
  return lines.join('\n').trimEnd();
}

export default function render(section) {
  const days = (section?.days || []).filter((d) => d?.events?.length);
  const html = days.map((d) => {
    return renderDayHeader(d.day_label) + (d.events || []).map(renderEvent).join('');
  }).join('');
  return { html, plainText: renderPlain(days) };
}
