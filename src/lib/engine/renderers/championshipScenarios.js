// Renderer #8 — Championship scenarios.
// Outcome boxes color-coded by left border + label color (positive/negative/neutral).
// Tiebreaker explainer: light gray bg, no left-color stripe — visually an aside.

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const OUTCOME_TONES = {
  positive: '#16a34a',
  negative: '#dc2626',
  neutral:  '#d97706',
};

function renderOutcome({ tone, label, body }) {
  const color = OUTCOME_TONES[tone] || OUTCOME_TONES.neutral;
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:8px 0;">'
    + '<tr><td style="padding:14px 16px;background-color:#ffffff;'
    + `border:1px solid #e5e7eb;border-left:4px solid ${color};`
    + 'border-radius:4px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:14px;font-weight:700;color:${color};line-height:1.4;margin:0 0 6px 0;">${escapeHtml(label)}</div>`
    + `<div style="font-size:13px;color:#334155;line-height:1.6;margin:0;">${escapeHtml(body)}</div>`
    + '</td></tr></table>';
}

function renderTiebreaker({ label, body }) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0 8px 0;">'
    + '<tr><td style="padding:14px 16px;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:4px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.4;margin:0 0 6px 0;">${escapeHtml(label)}</div>`
    + `<div style="font-size:13px;color:#334155;line-height:1.6;margin:0;">${escapeHtml(body)}</div>`
    + '</td></tr></table>';
}

export function renderChampionshipScenarios({ outcomes = [], tiebreaker }) {
  const sectionHeader = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;margin:24px 0 8px 0;">'
    + '<tr><td align="center" style="padding:0 0 12px 0;">'
    + '<div style="font-size:11px;font-weight:700;color:#4a8fd4;letter-spacing:2px;text-transform:uppercase;line-height:1.4;">CHAMPIONSHIP SCENARIOS</div>'
    + '</td></tr></table>';
  const outcomesHtml = (outcomes || []).map(renderOutcome).join('');
  const tiebreakerHtml = tiebreaker ? renderTiebreaker(tiebreaker) : '';
  return sectionHeader + outcomesHtml + tiebreakerHtml;
}
