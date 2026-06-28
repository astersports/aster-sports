// Renderer — rules (tournament_prelim gold standard).
//
// Reference: docs/BRIEFING_FULL_PRESENTATION.html §2 — .ebar.gold bar
// ("Zero Gravity Rules · 4th grade") + .rule rows: a cobalt .dot
// bullet + .rt text, with a bold cobalt lead label when the pasted
// line is "Label: text" (mockup: "Format:", "Fouls:", "Arrive 20
// minutes early.").
//
// Inline-styled + table-based per CLAUDE.md §13. Standard &#8226;
// bullet rendered as a small cobalt dot cell.

import { escapeHtml } from './_util';
import { goldBarHtml } from './_goldBar';
import { BRAND_GOLD, BRAND_GOLD_TEXT, TEXT_NAVY } from '../colors';

function ruleHtml(rule, isLast) {
  const lead = rule.lead
    ? `<b style="color:${BRAND_GOLD_TEXT};font-weight:700;">${escapeHtml(rule.lead)}</b> `
    : '';
  const mb = isLast ? '0' : '9px';
  return '<tr>'
    + `<td valign="top" style="width:13px;padding:0 8px 0 0;"><div style="width:5px;height:5px;border-radius:50%;background-color:${BRAND_GOLD};margin-top:7px;"></div></td>`
    + `<td valign="top" style="padding:0 0 ${mb} 0;font-family:Inter,system-ui,sans-serif;font-size:12.5px;line-height:1.5;color:${TEXT_NAVY};">${lead}${escapeHtml(rule.text)}</td>`
    + '</tr>';
}

export default function renderRules(section) {
  const rules = (section?.rules || []).filter((r) => r && r.text);
  if (!rules.length) return { html: '', plainText: '' };
  const body = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:0 0 8px 0;">'
    + rules.map((r, i) => ruleHtml(r, i === rules.length - 1)).join('')
    + '</table>';
  const html = goldBarHtml(section.bar_label || 'Rules') + body;
  const plainText = `${(section.bar_label || 'Rules').toUpperCase()}\n`
    + rules.map((r) => `• ${r.lead ? `${r.lead} ` : ''}${r.text}`).join('\n');
  return { html, plainText };
}
