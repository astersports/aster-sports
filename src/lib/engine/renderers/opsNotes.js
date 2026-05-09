// Template T5 — Operational notes.
// Navy eyebrow (operator-titled) + bullet list with cobalt bullets.

import { escapeHtml } from './_util';

function renderItem(text) {
  return '<tr><td style="padding:5px 0 5px 0;font-family:Inter,system-ui,sans-serif;font-size:14px;color:#0f172a;line-height:1.5;">'
    + '<span style="display:inline-block;width:6px;height:6px;background-color:#4a8fd4;border-radius:50%;margin-right:10px;vertical-align:middle;"></span>'
    + escapeHtml(text)
    + '</td></tr>';
}

export default function render(section) {
  const title = section?.title || 'NOTES';
  const items = section?.items || [];
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding-bottom:8px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:11px;font-weight:700;color:#0f172a;letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;">${escapeHtml(title)}</div>`
    + '</td></tr>'
    + items.map(renderItem).join('')
    + '</table>';
  const plainText = [
    title,
    ...items.map((i) => `• ${i}`),
  ].join('\n');
  return { html, plainText };
}
