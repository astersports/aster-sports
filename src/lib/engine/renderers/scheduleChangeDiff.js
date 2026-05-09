// Section renderer — schedule_change_diff. Renders an "old vs new" event
// diff block: previous values strikethrough in muted slate, new values
// bolded in navy. Used by the schedule_change kind composer.
//
// Section shape:
//   { kind: 'schedule_change_diff',
//     before: { label, time, location },   // any subset; missing fields skip
//     after:  { label, time, location } }
//
// Plain-text path uses uppercase PREVIOUS / UPDATED prefixes — no markup.

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, TEXT_NAVY, TEXT_SLATE } from '../colors';

function rowHtml(side, fields) {
  const isPrev = side === 'previous';
  const labelColor = isPrev ? TEXT_SLATE : TEXT_NAVY;
  const labelStyle = isPrev
    ? `font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${TEXT_SLATE};margin:0 0 4px 0;`
    : `font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${TEXT_NAVY};margin:0 0 4px 0;`;
  const valueStyle = isPrev
    ? `font-size:14px;color:${labelColor};text-decoration:line-through;line-height:1.5;`
    : `font-size:15px;color:${labelColor};font-weight:700;line-height:1.5;`;
  const lines = [fields?.label, fields?.time, fields?.location].filter(Boolean);
  if (!lines.length) return '';
  const lineHtml = lines.map((l) => escapeHtml(l)).join('<br>');
  return `<div style="margin:0 0 12px 0;">`
    + `<div style="${labelStyle}">${isPrev ? 'PREVIOUS' : 'UPDATED'}</div>`
    + `<div style="${valueStyle}">${lineHtml}</div>`
    + '</div>';
}

function rowText(side, fields) {
  const lines = [fields?.label, fields?.time, fields?.location].filter(Boolean);
  if (!lines.length) return '';
  const prefix = side === 'previous' ? 'PREVIOUS' : 'UPDATED';
  return `${prefix}: ${lines.join(' · ')}`;
}

export default function render(section) {
  const before = section?.before || {};
  const after = section?.after || {};
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;margin:8px 0 16px 0;">`
    + '<tr><td style="padding:16px 20px;border:1px solid ' + BORDER_DEFAULT + ';border-radius:10px;">'
    + rowHtml('previous', before)
    + rowHtml('updated', after)
    + '</td></tr></table>';
  const plainText = [rowText('previous', before), rowText('updated', after)].filter(Boolean).join('\n');
  return { html, plainText };
}
