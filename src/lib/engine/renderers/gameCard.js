// Renderer #3 — Game card (4 variants).
// Variant determines container + rail styling. Tone of stake line is operator-picked.
// Map link is inline (not standalone button) per locked decision.

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const STAKE_TONES = {
  green: { color: '#16a34a', weight: '500' },
  red:   { color: '#dc2626', weight: '600' },
  amber: { color: '#d97706', weight: '600' },
  muted: { color: '#94a3b8', weight: null, italic: true },
};

const VARIANT_STYLES = {
  regular:      { border: '#d1d5db', bg: '',                       railBg: '#f8fafc', railBorder: '#e5e7eb', suffixColor: '#94a3b8' },
  mandatory:    { border: '#d1d5db', bg: '',                       railBg: '#f8fafc', railBorder: '#e5e7eb', suffixColor: '#94a3b8' },
  bonus:        { border: '#d1d5db', bg: '',                       railBg: '#f8fafc', railBorder: '#e5e7eb', suffixColor: '#94a3b8' },
  championship: { border: '#fbbf24', bg: 'background-color:#fffbeb;', railBg: '#fef3c7', railBorder: '#fbbf24', suffixColor: '#92400e' },
};

function renderRail(rail, vs) {
  if (rail.label) {
    const padding = '14px 12px';
    return `<td width="80" valign="top" align="center" style="padding:${padding};background-color:${vs.railBg};border-right:1px solid ${vs.railBorder};border-radius:8px 0 0 8px;font-family:Inter,system-ui,sans-serif;">`
      + `<div style="font-size:11px;font-weight:600;letter-spacing:1px;color:#4a8fd4;text-transform:uppercase;line-height:1.4;">${escapeHtml(rail.label)}</div>`
      + `<div style="font-size:18px;font-weight:700;color:#0f172a;line-height:1.2;margin-top:2px;">${escapeHtml(rail.timePrimary || '')}</div>`
      + '</td>';
  }
  const suffix = rail.timeSuffix
    ? `<div style="font-size:11px;font-weight:600;color:${vs.suffixColor};letter-spacing:1px;margin-top:4px;">${escapeHtml(rail.timeSuffix)}</div>`
    : '';
  return `<td width="80" valign="top" align="center" style="padding:16px 8px;background-color:${vs.railBg};border-right:1px solid ${vs.railBorder};border-radius:8px 0 0 8px;font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:18px;font-weight:700;color:#0f172a;line-height:1;">${escapeHtml(rail.timePrimary || '')}</div>`
    + suffix
    + '</td>';
}

function renderStakeLine({ text, tone }) {
  const t = STAKE_TONES[tone] || STAKE_TONES.muted;
  const parts = ['font-size:13px', `color:${t.color}`, 'line-height:1.5', 'margin-top:6px'];
  if (t.italic) parts.push('font-style:italic');
  if (t.weight) parts.push(`font-weight:${t.weight}`);
  return `<div style="${parts.join(';')};">${escapeHtml(text)}</div>`;
}

function renderSecondary(secondary) {
  if (!secondary?.text) return '';
  const link = secondary.link?.url
    ? ` &mdash; <a href="${escapeHtml(secondary.link.url)}" style="color:#4a8fd4;text-decoration:none;font-weight:500;">${escapeHtml(secondary.link.text || 'Map')}</a>`
    : '';
  return `<div style="font-size:13px;color:#64748b;line-height:1.5;margin-top:4px;">${escapeHtml(secondary.text)}${link}</div>`;
}

function renderBody({ primary, secondary, stakeLine, bonusBadge }) {
  const badge = bonusBadge
    ? '<span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:1px;background-color:#fef3c7;color:#92400e;padding:2px 6px;border-radius:3px;margin-left:6px;vertical-align:middle;">BONUS</span>'
    : '';
  const stake = stakeLine?.text ? renderStakeLine(stakeLine) : '';
  return '<td valign="top" style="padding:14px 16px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:15px;font-weight:700;color:#0f172a;line-height:1.4;">${escapeHtml(primary || '')}${badge}</div>`
    + renderSecondary(secondary)
    + stake
    + '</td>';
}

export function renderGameCard(section) {
  const variant = section.variant || 'regular';
  const vs = VARIANT_STYLES[variant] || VARIANT_STYLES.regular;
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;margin:8px 0;border:1px solid ${vs.border};border-radius:8px;${vs.bg}">`
    + '<tr>' + renderRail(section.rail || {}, vs) + renderBody(section) + '</tr>'
    + '</table>';
}
