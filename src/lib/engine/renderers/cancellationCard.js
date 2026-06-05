// PR-D cancellation card — schedule_change "cancelled" treatment.
// Per BRIEFING_FULL_PRESENTATION §4: a card with a WARN-tone (NOT red) left
// border, an amber "Cancelled" label pill (.cxlabel), the event title
// (.cxt), the STRUCK old time (.cxm .strike), and the reason text. No action
// buttons — render only.
//
// Section shape:
//   { kind: 'cancellation_card',
//     title: '8U Boys · Practice',
//     old_time: 'Tomorrow · 5:30 PM',   // struck
//     reason: 'Sportsplex double-booked. Back to normal Thursday.' }
//
// SCOPE (PR-D): this card is the render treatment only. The retirement of
// the legacy cancellation auto-email path is item 1f and awaits Frank's GO.

import { escapeHtml } from './_util';
import { WARN, WARN_LINE, WARN_WASH } from '../colors';

const CARD = [
  `background-color:${WARN_WASH}`, `border:1px solid ${WARN_LINE}`,
  `border-left:3px solid ${WARN}`, 'border-radius:8px', 'padding:13px 14px',
].join(';');
const LABEL = [
  'display:inline-block', `color:${WARN}`, 'font-size:11px', 'font-weight:700',
  'letter-spacing:0.04em', 'text-transform:uppercase',
].join(';');

export default function render(section) {
  const title = section?.title || '';
  const oldTime = section?.old_time || '';
  const reason = section?.reason || '';

  const titleHtml = title
    ? `<div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:6px;">${escapeHtml(title)}</div>`
    : '';
  const timeHtml = oldTime
    ? `<div style="font-size:13px;color:#475569;margin-top:3px;"><span style="text-decoration:line-through;">${escapeHtml(oldTime)}</span></div>`
    : '';
  const reasonHtml = reason
    ? `<div style="font-size:12.5px;color:#475569;margin-top:9px;line-height:1.5;">${escapeHtml(reason)}</div>`
    : '';

  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;margin:8px 0 16px 0;">'
    + `<tr><td style="${CARD}">`
    + `<span style="${LABEL}">&#9888; Cancelled</span>`
    + titleHtml + timeHtml + reasonHtml
    + '</td></tr></table>';

  const plainLines = ['CANCELLED'];
  if (title) plainLines.push(title);
  if (oldTime) plainLines.push(`Was: ${oldTime}`);
  if (reason) plainLines.push(reason);

  return { html, plainText: plainLines.join('\n') };
}
