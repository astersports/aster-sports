// Free-text wrapper F2 — Signoff prose + signature block.
// Operator prose paragraph (optional), then HR divider, then per-coach
// rows: bold name + muted-gray title · phone.

import { escapeHtml } from './_util';

function renderProse(prose) {
  if (!prose) return '';
  return '<p style="font-family:Inter,system-ui,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;margin:8px 0;">'
    + escapeHtml(prose)
    + '</p>';
}

function renderDivider() {
  return '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />';
}

function renderCoach(c) {
  const meta = [c?.title, c?.phone].filter(Boolean).join(' · ');
  return '<div style="font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.6;margin:0 0 6px 0;">'
    + `<div style="font-weight:700;color:#0f172a;">${escapeHtml(c?.display_name || '')}</div>`
    + (meta ? `<div style="color:#64748b;font-size:13px;">${escapeHtml(meta)}</div>` : '')
    + '</div>';
}

function renderPlain({ prose, coaches }) {
  const lines = [];
  if (prose) { lines.push(prose); lines.push(''); }
  (coaches || []).forEach((c) => {
    const meta = [c?.title, c?.phone].filter(Boolean).join(' · ');
    lines.push(c?.display_name || '');
    if (meta) lines.push(meta);
  });
  return lines.join('\n').trimEnd();
}

export default function render(section) {
  const coaches = section?.coaches || [];
  const html = renderProse(section?.prose)
    + (coaches.length ? renderDivider() : '')
    + coaches.map(renderCoach).join('');
  return { html, plainText: renderPlain(section || {}) };
}
