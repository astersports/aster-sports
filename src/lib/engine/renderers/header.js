// Renderer #1 — Universal header.
// Three slots: eyebrow (cobalt micro-context), headline (muted-gray atmospheric),
// sub_context (optional). Optional gold accent stripe under the cobalt rule.
// Color hierarchy locked: cobalt + navy are load-bearing; gray sets mood.

import { escapeHtml } from './_util';

export function renderHeader(section) {
  const { eyebrow, headline, sub_context, goldStripe } = section || {};
  const eyebrowHtml = eyebrow
    ? `<div style="font-size:11px;font-weight:600;color:#4a8fd4;letter-spacing:3px;text-transform:uppercase;line-height:1.4;margin:0 0 10px 0;">${escapeHtml(eyebrow)}</div>`
    : '';
  const headlineHtml = headline
    ? `<div style="font-size:28px;font-weight:700;color:#94a3b8;letter-spacing:1px;line-height:1.2;text-transform:uppercase;margin:0 0 14px 0;">${escapeHtml(headline)}</div>`
    : '';
  const subHtml = sub_context
    ? `<div style="font-size:13px;color:#64748b;line-height:1.5;margin:0;">${escapeHtml(sub_context)}</div>`
    : '';
  const headerTable =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;'
    + 'border-bottom:2px solid #4a8fd4;">'
    + '<tr><td align="center" style="padding:32px 28px 20px 28px;">'
    + eyebrowHtml + headlineHtml + subHtml
    + '</td></tr></table>';
  const goldHtml = goldStripe
    ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
      + ' style="border-collapse:collapse;">'
      + '<tr><td style="height:3px;background-color:#fbbf24;line-height:3px;font-size:0;">&nbsp;</td></tr>'
      + '</table>'
    : '';
  const html = headerTable + goldHtml;
  const plainLines = [
    eyebrow ? String(eyebrow).toUpperCase() : '',
    headline ? String(headline).toUpperCase() : '',
    sub_context || '',
    '────────────────────────',
  ].filter(Boolean);
  return { html, plainText: plainLines.join('\n') };
}

// Default export so wave-2-style dispatch (default fn) and wave-1 named-import
// (renderHeader) callers both keep working.
export default renderHeader;
