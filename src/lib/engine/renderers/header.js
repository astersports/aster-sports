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
//
// Wave 5 (cutover wave PR 1): added `variant: 'cobalt_band'` for
// tournament_prelim (and similar marketing-style sends). Background
// becomes full cobalt, text becomes white, no underline border, no
// gold stripe (it's redundant inside the cobalt band). Default
// variant (omitted or 'underlined') is the existing white-bg +
// cobalt-underline + slate-headline pattern used by weekly_digest.

import { escapeHtml } from './_util';
import { COBALT, COBALT_DEEP, GOLD, TEXT_MIST, TEXT_SLATE } from '../colors';

function hostFromUrl(url) {
  try { return new URL(url).host.replace(/^www\./, ''); }
  catch { return ''; }
}

function renderEyebrow(eyebrow, eyebrow_link, variant) {
  if (!eyebrow) return '';
  const inner = escapeHtml(eyebrow);
  const text = eyebrow_link
    ? `<a href="${escapeHtml(eyebrow_link)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">${inner}</a>`
    : inner;
  const color = variant === 'cobalt_band' ? '#ffffff' : COBALT_DEEP;
  return `<div style="font-size:11px;font-weight:600;color:${color};letter-spacing:3px;text-transform:uppercase;line-height:1.4;margin:0 0 10px 0;">${text}</div>`;
}

function renderHeadline(headline, variant) {
  if (!headline) return '';
  const color = variant === 'cobalt_band' ? '#ffffff' : TEXT_MIST;
  return `<div style="font-size:28px;font-weight:700;color:${color};letter-spacing:1px;line-height:1.2;text-transform:uppercase;margin:0 0 14px 0;">${escapeHtml(headline)}</div>`;
}

function renderSub(sub_context, variant) {
  if (!sub_context) return '';
  const color = variant === 'cobalt_band' ? 'rgba(255,255,255,0.85)' : TEXT_SLATE;
  return `<div style="font-size:13px;color:${color};line-height:1.5;margin:0;">${escapeHtml(sub_context)}</div>`;
}

export function renderHeader(section) {
  const { eyebrow, eyebrow_link, headline, sub_context, goldStripe, variant } = section || {};
  const isCobaltBand = variant === 'cobalt_band';
  const tableStyle = isCobaltBand
    ? `border-collapse:collapse;font-family:Inter,system-ui,sans-serif;background-color:${COBALT};`
    : `border-collapse:collapse;font-family:Inter,system-ui,sans-serif;border-bottom:2px solid ${COBALT_DEEP};`;
  const headerTable =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="${tableStyle}">`
    + '<tr><td align="center" style="padding:32px 28px 20px 28px;">'
    + renderEyebrow(eyebrow, eyebrow_link, variant)
    + renderHeadline(headline, variant)
    + renderSub(sub_context, variant)
    + '</td></tr></table>';
  const goldHtml = (goldStripe && !isCobaltBand)
    ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
      + ' style="border-collapse:collapse;">'
      + `<tr><td style="height:3px;background-color:${GOLD};line-height:3px;font-size:0;">&nbsp;</td></tr>`
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
