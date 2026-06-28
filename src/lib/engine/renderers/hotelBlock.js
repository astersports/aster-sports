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
  // Append noon-local only for a bare YYYY-MM-DD; a full timestamp parses
  // as-is (appending 'T12:00:00' to it would yield Invalid Date).
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date(iso);
  try { return dateFmt.format(d); }
  catch { return iso; }
}

export default function render(section) {
  // Body accepts hotel_info (structured path) OR text (the prelim override
  // path emits { text } with no days_remaining). Show the red countdown
  // eyebrow ONLY when a real day-count is present — otherwise an override
  // with no deadline defaulted days to 0 → false "CLOSES TODAY".
  const body = section?.hotel_info || section?.text || '';
  const hasDays = Number.isFinite(section?.days_remaining);
  const eyebrow = !hasDays
    ? 'HOTEL BLOCK'
    : section.days_remaining <= 0
      ? 'HOTEL BLOCK CLOSES TODAY'
      : `HOTEL BLOCK CLOSES IN ${section.days_remaining} ${section.days_remaining === 1 ? 'DAY' : 'DAYS'}`;
  const deadline = formatDeadline(section?.deadline);
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding:14px 16px;background-color:#fef2f2;'
    + 'border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:6px;'
    + 'font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:11px;font-weight:700;color:#dc2626;letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;margin-bottom:6px;">${escapeHtml(eyebrow)}</div>`
    + `<div style="font-size:14px;color:#0f172a;line-height:1.5;">${escapeHtml(body)}</div>`
    + (deadline ? `<div style="font-size:13px;font-weight:700;color:#dc2626;line-height:1.5;margin-top:6px;">Deadline: ${escapeHtml(deadline)}</div>` : '')
    + '</td></tr></table>';
  const plainText = [
    eyebrow,
    body,
    deadline ? `Deadline: ${deadline}` : '',
  ].filter(Boolean).join('\n');
  return { html, plainText };
}
