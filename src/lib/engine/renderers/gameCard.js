// Renderer #3 — Game card (4 variants).
// Variant determines container + rail styling. Tone of stake line is operator-picked.
// Map link is inline (not standalone button) per locked decision.

import { escapeHtml } from './_util';
import { AMBER_DEEP, BRAND_GOLD_TEXT, TEXT_NAVY, TEXT_SLATE, TEXT_SLATE_DARK } from '../colors';

const STAKE_TONES = {
  green: { color: '#16a34a', weight: '500' },
  red:   { color: '#dc2626', weight: '600' },
  amber: { color: '#d97706', weight: '600' },
  muted: { color: TEXT_SLATE, weight: null, italic: true },
};

// Wave 3.6 §D2: regular/mandatory/bonus suffixColor #94a3b8 → TEXT_SLATE_DARK
// (#334155, 11.7:1) so 11px rail timeSuffix passes WCAG AA on white.
const VARIANT_STYLES = {
  regular:      { border: '#d1d5db', bg: '',                       railBg: '#f8fafc', railBorder: '#e5e7eb', suffixColor: TEXT_SLATE_DARK },
  mandatory:    { border: '#d1d5db', bg: '',                       railBg: '#f8fafc', railBorder: '#e5e7eb', suffixColor: TEXT_SLATE_DARK },
  bonus:        { border: '#d1d5db', bg: '',                       railBg: '#f8fafc', railBorder: '#e5e7eb', suffixColor: TEXT_SLATE_DARK },
  championship: { border: '#fbbf24', bg: 'background-color:#fffbeb;', railBg: '#fef3c7', railBorder: '#fbbf24', suffixColor: AMBER_DEEP },
};

function renderRail(rail, vs) {
  if (rail.label) {
    return `<td width="80" valign="top" align="center" style="padding:14px 12px;background-color:${vs.railBg};border-right:1px solid ${vs.railBorder};border-radius:8px 0 0 8px;font-family:Inter,system-ui,sans-serif;">`
      + `<div style="font-size:11px;font-weight:600;letter-spacing:1px;color:${BRAND_GOLD_TEXT};text-transform:uppercase;line-height:1.4;">${escapeHtml(rail.label)}</div>`
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
    ? ` &mdash; <a href="${escapeHtml(secondary.link.url)}" style="color:${BRAND_GOLD_TEXT};text-decoration:none;font-weight:500;">${escapeHtml(secondary.link.text || 'Map')}</a>`
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

function buildPlain(section) {
  const rail = section.rail || {};
  const railText = rail.label || `${rail.timePrimary || ''}${rail.timeSuffix ? ' ' + rail.timeSuffix : ''}`.trim();
  const lines = [];
  const badge = section.bonusBadge ? ' [BONUS]' : '';
  lines.push(`${railText ? railText + ': ' : ''}${section.primary || ''}${badge}`);
  if (section.secondary?.text) {
    const linkPart = section.secondary.link?.url ? ` [${section.secondary.link.url}]` : '';
    lines.push(`  ${section.secondary.text}${linkPart}`);
  }
  if (section.stakeLine?.text) lines.push(`  ${section.stakeLine.text}`);
  return lines.join('\n');
}

export function renderGameCard(section) {
  const variant = section?.variant || 'regular';
  const vs = VARIANT_STYLES[variant] || VARIANT_STYLES.regular;
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;margin:8px 0;border:1px solid ${vs.border};border-radius:8px;${vs.bg}">`
    + '<tr>' + renderRail(section?.rail || {}, vs) + renderBody(section || {}) + '</tr>'
    + '</table>';
  return { html, plainText: buildPlain(section || {}) };
}
