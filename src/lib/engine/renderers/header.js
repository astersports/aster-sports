// Renderer #1 — Universal header.
// Three slots: eyebrow (gold micro-context), headline (muted-gray atmospheric),
// sub_context (optional). Optional gold accent stripe under the gold rule.
// Color hierarchy locked: gold + navy are load-bearing; gray sets mood.
//
// Wave 3.5: optional `eyebrow_link` wraps the eyebrow text in an
// inline-styled <a> (target=_blank, rel=noopener). Plain text appends
// " · {hostFromUrl}" so screen readers + plain-text mail clients still
// see where the link goes. Backward-compat: omit eyebrow_link to render
// the eyebrow as plain text.
//
// Wave 5 (cutover wave PR 1): added the navy band variant for
// tournament_prelim (and similar marketing-style sends). Background
// becomes a full navy band, text becomes white, no underline border, no
// gold stripe (it's redundant inside the band). Accepted as
// `variant: 'brand_band'` (or the legacy `'cobalt_band'` alias, kept for
// back-compat — both render the same navy band). Default variant (omitted
// or 'underlined') is the white-bg + gold-underline + slate-headline
// pattern used by weekly_digest.

import { escapeHtml } from './_util';
import { safeHref } from './_safeHref';
import { BRAND_GOLD, BRAND_GOLD_TEXT, BRAND_NAVY, GOLD, TEXT_MIST, TEXT_SLATE } from '../colors';

function hostFromUrl(url) {
  try { return new URL(url).host.replace(/^www\./, ''); }
  catch { return ''; }
}

// A "band" header renders a full navy band with white text. Accepts the
// `brand_band` alias plus the legacy `cobalt_band` key (pre gold-on-navy
// rebrand) for back-compat — both map to the same navy band.
function isBand(variant) {
  return variant === 'cobalt_band' || variant === 'brand_band';
}

function renderEyebrow(eyebrow, eyebrow_link, variant) {
  if (!eyebrow) return '';
  const inner = escapeHtml(eyebrow);
  const text = eyebrow_link
    ? `<a href="${escapeHtml(safeHref(eyebrow_link))}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">${inner}</a>`
    : inner;
  const color = isBand(variant) ? '#ffffff' : BRAND_GOLD_TEXT;
  return `<div style="font-size:11px;font-weight:600;color:${color};letter-spacing:3px;text-transform:uppercase;line-height:1.4;margin:0 0 10px 0;">${text}</div>`;
}

function renderHeadline(headline, variant) {
  if (!headline) return '';
  const color = isBand(variant) ? '#ffffff' : TEXT_MIST;
  return `<div style="font-size:28px;font-weight:700;color:${color};letter-spacing:1px;line-height:1.2;text-transform:uppercase;margin:0 0 14px 0;">${escapeHtml(headline)}</div>`;
}

function renderSub(sub_context, variant) {
  if (!sub_context) return '';
  const color = isBand(variant) ? 'rgba(255,255,255,0.85)' : TEXT_SLATE;
  return `<div style="font-size:13px;color:${color};line-height:1.5;margin:0;">${escapeHtml(sub_context)}</div>`;
}

// Wave (recap-at-bar): optional record pill in the navy band variant —
// a rounded chip under the headline (e.g. "0–2 RECORD · MAY 18 – MAY 20").
// Only rendered inside the band; omitted otherwise. Backward-compat:
// headers without record_pill are byte-identical to before.
function renderRecordPill(record_pill, variant) {
  if (!record_pill || !isBand(variant)) return '';
  return '<div style="margin:6px 0 0 0;">'
    + '<span style="display:inline-block;background-color:rgba(0,0,0,0.18);border-radius:999px;'
    + `padding:6px 15px;font-size:12px;font-weight:700;letter-spacing:1px;color:#ffffff;">${escapeHtml(record_pill)}</span>`
    + '</div>';
}

export function renderHeader(section) {
  const { eyebrow, eyebrow_link, headline, sub_context, goldStripe, variant, record_pill } = section || {};
  const isBrandBand = isBand(variant);
  const tableStyle = isBrandBand
    ? `border-collapse:collapse;font-family:Inter,system-ui,sans-serif;background-color:${BRAND_NAVY};`
    : `border-collapse:collapse;font-family:Inter,system-ui,sans-serif;border-bottom:2px solid ${BRAND_GOLD};`;
  const headerTable =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="${tableStyle}">`
    + '<tr><td align="center" style="padding:32px 28px 20px 28px;">'
    + renderEyebrow(eyebrow, eyebrow_link, variant)
    + renderHeadline(headline, variant)
    + renderSub(sub_context, variant)
    + renderRecordPill(record_pill, variant)
    + '</td></tr></table>';
  const goldHtml = (goldStripe && !isBrandBand)
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
    record_pill ? String(record_pill).toUpperCase() : '',
    sub_context || '',
    '────────────────────────',
  ].filter(Boolean);
  return { html, plainText: plainLines.join('\n') };
}
