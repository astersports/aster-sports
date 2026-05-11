// Renderer #7 — Labeled keys box.
// Bordered box, optional cobalt eyebrow title, then N "{label}. {body}"
// rows. Used by Coach's Keys, Rules-of-Play, etc. — title is operator-set.

import { escapeHtml } from './_util';
import { COBALT } from '../colors';

function renderTitle(title) {
  if (!title) return '';
  return `<div style="font-size:11px;font-weight:700;color:${COBALT};letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(title)}</div>`;
}

function renderItem(item, isLast) {
  const margin = isLast ? '0' : '8px';
  const label = escapeHtml(item?.label || '').replace(/\.+\s*$/, '');
  return `<div style="font-size:14px;color:#334155;line-height:1.6;margin-bottom:${margin};">`
    + `<span style="font-weight:700;color:#0f172a;">${label}.</span> `
    + escapeHtml(item?.body || '')
    + '</div>';
}

function renderPlain({ title, items }) {
  const lines = [];
  if (title) {
    lines.push(title);
    lines.push('─'.repeat(Math.min(title.length, 40)));
  }
  (items || []).forEach((it) => {
    const label = String(it?.label || '').replace(/\.+\s*$/, '');
    lines.push(`${label}. ${it?.body || ''}`.trim());
  });
  return lines.join('\n');
}

export default function render(section) {
  const items = section?.items || [];
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding:18px 20px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:6px;font-family:Inter,system-ui,sans-serif;">'
    + renderTitle(section?.title)
    + items.map((it, i) => renderItem(it, i === items.length - 1)).join('')
    + '</td></tr></table>';
  return { html, plainText: renderPlain(section || {}) };
}
