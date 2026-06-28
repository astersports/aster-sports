// Template T6 — CTA buttons (1 or 2).
// Inline-styled <a> elements (email-safe, not <button>). Cobalt-filled,
// white text, 6px radius. Two buttons sit side-by-side with 12px gap.

import { escapeHtml } from './_util';
import { safeHref } from './_safeHref';
import { COBALT } from '../colors';

const BTN_STYLE = [
  'display:inline-block',
  `background-color:${COBALT}`,
  'color:#ffffff',
  'font-family:Inter,system-ui,sans-serif',
  'font-size:13px',
  'font-weight:700',
  'letter-spacing:1px',
  'text-transform:uppercase',
  'text-decoration:none',
  'padding:12px 24px',
  'border-radius:6px',
  'line-height:1.2',
].join(';');

function renderButton(btn, isLast) {
  const margin = isLast ? '' : 'margin-right:12px;';
  return `<a href="${escapeHtml(safeHref(btn?.url || '#'))}" style="${BTN_STYLE};${margin}">${escapeHtml(btn?.text || '')}</a>`;
}

export default function render(section) {
  const buttons = (section?.buttons || []).slice(0, 2);
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:20px 0;">'
    + '<tr><td align="center" style="padding:0;">'
    + buttons.map((b, i) => renderButton(b, i === buttons.length - 1)).join('')
    + '</td></tr></table>';
  const plainText = buttons
    .map((b) => `${b?.text || ''}: ${b?.url || ''}`)
    .filter(Boolean)
    .join('\n');
  return { html, plainText };
}
