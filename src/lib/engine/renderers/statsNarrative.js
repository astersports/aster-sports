// Free-text wrapper F1 — Stats narrative paragraph.
// Operator-typed prose. Single <p>, navy text, 14px / 1.6 line-height.

import { escapeHtml } from './_util';

export default function render(section) {
  const body = section?.body || '';
  const html = '<p style="font-family:Inter,system-ui,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;margin:8px 0;padding:8px 0;">'
    + escapeHtml(body)
    + '</p>';
  return { html, plainText: body };
}
