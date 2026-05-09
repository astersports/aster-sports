// Renderer #6 — Day-sectioned weekly schedule.
// Per-day blocks; each event row gets a 5px team-color left border. Empty
// days are skipped. tournament_placeholder variant uses cream bg + gold
// border + amber-bold "see [day] email" suffix span.

import { escapeHtml } from './_util';

function renderDayHeader(label) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:24px 0 8px 0;">'
    + '<tr><td style="padding:0 0 6px 0;border-bottom:1px solid #e5e7eb;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#4a8fd4;text-transform:uppercase;line-height:1.4;">${escapeHtml(label)}</div>`
    + '</td></tr></table>';
}

function highlightEmailSuffix(text) {
  // Replace any "see <something> email" run with an amber-bold span. Operator
  // can encode the cue freely; rendering catches the conventional phrase.
  const safe = escapeHtml(text);
  return safe.replace(/(see\s+[A-Za-z]+\s+email)/gi,
    '<span style="color:#92400e;font-weight:500;">$1</span>');
}

function renderEvent(ev) {
  const isPlaceholder = ev?.variant === 'tournament_placeholder';
  const containerBg = isPlaceholder ? 'background-color:#fffbeb;' : 'background-color:#f8fafc;';
  const containerBorder = isPlaceholder ? 'border:1px solid #fbbf24;' : 'border:1px solid #e5e7eb;';
  const teamColor = ev?.team_color || '#4a8fd4';
  const secondary = isPlaceholder
    ? highlightEmailSuffix(ev?.secondary || '')
    : escapeHtml(ev?.secondary || '');
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:8px 0 0 0;">'
    + '<tr><td style="padding:12px 14px;'
    + `${containerBg}${containerBorder}border-left:5px solid ${escapeHtml(teamColor)};`
    + 'border-radius:6px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.4;">${escapeHtml(ev?.primary || '')}</div>`
    + `<div style="font-size:13px;color:#64748b;line-height:1.5;margin-top:3px;">${secondary}</div>`
    + '</td></tr></table>';
}

function renderPlain(days) {
  const lines = [];
  days.forEach((d) => {
    if (!d?.events?.length) return;
    lines.push(d.day_label);
    lines.push('────────────');
    d.events.forEach((ev) => {
      lines.push(`  ${ev.primary}`);
      if (ev.secondary) lines.push(`  ${ev.secondary}`);
    });
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
