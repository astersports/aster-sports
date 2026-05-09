// Template T1 — Hotel block urgency callout.
// Red left border + light cream-red bg. Days-remaining is computed at
// compose time and passed in; this renderer just renders.

import { escapeHtml } from './_util';

const NY_TZ = 'America/New_York';
const dateFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY_TZ, weekday: 'short', month: 'short', day: 'numeric',
});

function formatDeadline(iso) {
  if (!iso) return '';
  try { return dateFmt.format(new Date(iso + 'T12:00:00')); }
  catch { return iso; }
}

export default function render(section) {
  const days = Number.isFinite(section?.days_remaining) ? section.days_remaining : 0;
  const eyebrow = days <= 0
    ? 'HOTEL BLOCK CLOSES TODAY'
    : `HOTEL BLOCK CLOSES IN ${days} ${days === 1 ? 'DAY' : 'DAYS'}`;
  const deadline = formatDeadline(section?.deadline);
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding:14px 16px;background-color:#fef2f2;'
    + 'border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:6px;'
    + 'font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:11px;font-weight:700;color:#dc2626;letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;margin-bottom:6px;">${escapeHtml(eyebrow)}</div>`
    + `<div style="font-size:14px;color:#0f172a;line-height:1.5;">${escapeHtml(section?.hotel_info || '')}</div>`
    + (deadline ? `<div style="font-size:13px;font-weight:700;color:#dc2626;line-height:1.5;margin-top:6px;">Deadline: ${escapeHtml(deadline)}</div>` : '')
    + '</td></tr></table>';
  const plainText = [
    eyebrow,
    section?.hotel_info || '',
    deadline ? `Deadline: ${deadline}` : '',
  ].filter(Boolean).join('\n');
  return { html, plainText };
}
