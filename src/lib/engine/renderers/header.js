// Renderer #1 — Universal header.
// Three slots: eyebrow (cobalt micro-context), headline (muted-gray atmospheric),
// sub_context (optional). Optional gold accent stripe under the cobalt rule.
// Color hierarchy locked: cobalt + navy are load-bearing; gray sets mood.
//
// Wave 3.5: optional `eyebrow_link` wraps the eyebrow text in an
// inline-styled <a> (target=_blank, rel=noopener). Plain text appends
// " · {hostFromUrl}" so screen readers + plain-text mail clients still
// see where the link goes. Backward-compat: omit eyebrow_link to render
// the eyebrow as plain text.

import { escapeHtml } from './_util';

function hostFromUrl(url) {
  try { return new URL(url).host.replace(/^www\./, ''); }
  catch { return ''; }
}

function renderEyebrow(eyebrow, eyebrow_link) {
  if (!eyebrow) return '';
  const inner = escapeHtml(eyebrow);
  const text = eyebrow_link
    ? `<a href="${escapeHtml(eyebrow_link)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">${inner}</a>`
    : inner;
  return `<div style="font-size:11px;font-weight:600;color:#4a8fd4;letter-spacing:3px;text-transform:uppercase;line-height:1.4;margin:0 0 10px 0;">${text}</div>`;
}

export function renderHeader(section) {
  const { eyebrow, eyebrow_link, headline, sub_context, goldStripe } = section || {};
  const eyebrowHtml = renderEyebrow(eyebrow, eyebrow_link);
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
  const eyebrowLine = eyebrow
    ? `${String(eyebrow).toUpperCase()}${eyebrow_link ? ' · ' + hostFromUrl(eyebrow_link) : ''}`
    : '';
  const plainLines = [
    eyebrowLine,
    headline ? String(headline).toUpperCase() : '',
    sub_context || '',
    '────────────────────────',
  ].filter(Boolean);
  return { html, plainText: plainLines.join('\n') };
}

export default renderHeader;
