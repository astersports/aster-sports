// Template T3 — Standalone tiebreaker explainer.
// Same shape as the embedded tiebreaker block in renderer #8 (championship
// scenarios) — light gray bg, no left-color stripe. Standalone version is
// usable when scenarios aren't being rendered above it.

import { escapeHtml } from './_util';

const DEFAULT_LABEL = 'How tiebreakers work:';

export default function render(section) {
  const label = section?.label || DEFAULT_LABEL;
  const body = section?.body || '';
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding:14px 16px;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:4px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.4;margin:0 0 6px 0;">${escapeHtml(label)}</div>`
    + `<div style="font-size:13px;color:#334155;line-height:1.6;margin:0;">${escapeHtml(body)}</div>`
    + '</td></tr></table>';
  const plainText = `${label}\n${body}`;
  return { html, plainText };
}
