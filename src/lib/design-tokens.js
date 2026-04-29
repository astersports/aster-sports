/**
 * Skyfire design tokens — single source of truth for design primitives.
 *
 * Cockpit mode (existing app) consumes --sf-* CSS vars from index.css.
 * Broadcast mode (Records, Team detail, Tournaments) consumes --sf-bc-* CSS vars
 * from src/styles/broadcast.css, scoped to the .bc-root wrapper.
 * Email templates (Wave 4) consume the JS constants below to produce
 * inline-styled HTML for Outlook/Gmail compatibility.
 *
 * Decision 44: typography AND color tokens have screen vs email values.
 * Decision 68: email templates use brand cobalt always, never team_color.
 *
 * Anti-pattern compliance: domain constants live in lib/constants.js.
 * This module holds only design system primitives (palette, fonts,
 * helper fns) plus a convenience re-export of TEAM_COLORS.
 */

import { TEAM_COLORS } from './constants';

export const colors = {
  brandCobalt:      '#4a8fd4',
  brandCobaltHover: '#5BA0E0',

  bcBg:        '#070d17',
  bcCard:      '#0e1e33',
  bcCardAlt:   '#132845',
  bcBorder:    'rgba(74,143,212,0.18)',
  bcGlow:      'rgba(74,143,212,0.25)',
  bcHeroFrom:  '#091c36',
  bcHeroTo:    '#0d2a50',
  bcStatFrom:  '#0b1f3a',
  bcStatTo:    '#122d52',

  bcGold:  '#f59e0b',
  bcGreen: '#22c55e',
  bcRed:   '#ef4444',

  emailBorder:   '#4a8fd4',
  emailHeaderBg: '#4a8fd4',
  emailFooterBg: '#4a8fd4',
};

export const fonts = {
  email:         'Arial, Helvetica, sans-serif',
  screen:        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  screenDisplay: "'Barlow Condensed', 'Barlow', -apple-system, BlinkMacSystemFont, sans-serif",
};

// Re-export for ergonomic single-import access. Source of truth is constants.js.
export const teamColors = TEAM_COLORS;

export function teamGlow(hex, alpha = 0.25) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return `rgba(74,143,212,${alpha})`;
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}
