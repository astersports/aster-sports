// Renderer — recap_game_cell (games_recap / game_recap framed treatment).
// One bordered cell PER GAME, with a LEFT RAIL in THAT GAME'S OWN team
// color (per-cell, not one shared color — this is the core fix the prior
// game_card route missed). Matches the mock's `.gcell`:
//   - left rail (4px) = section.team_color (read per game)
//   - date eyebrow (e.g. "Mon · May 18"), tracked caps
//   - matchup headline (team vs opponent), bold
//   - optional one-line context (venue or short stake), muted
//   - right: score (NN–NN, dash muted) + result pill (LOSS red / WIN green)
//
// Table-based + explicit light bg + dark text per element (§13, dark/light
// safety). Pure renderer: reads only its section fields.
//
// Shape: { kind: 'recap_game_cell', team_color, date_label, matchup,
//          context?, our_score, opponent_score, result }  // result: 'W'|'L'|'T'

import { escapeHtml } from './_util';
import {
  BORDER_DEFAULT, BRAND_GOLD, PILL_LOSS_BG, PILL_LOSS_TX, PILL_TIE_BG, PILL_TIE_TX,
  PILL_WIN_BG, PILL_WIN_TX, TEXT_MIST, TEXT_NAVY, TEXT_SLATE,
} from '../colors';

const PILL = {
  W: { bg: PILL_WIN_BG, tx: PILL_WIN_TX, label: 'WIN' },
  L: { bg: PILL_LOSS_BG, tx: PILL_LOSS_TX, label: 'LOSS' },
  T: { bg: PILL_TIE_BG, tx: PILL_TIE_TX, label: 'TIE' },
};

function resultPill(result) {
  const p = PILL[String(result || '').toUpperCase()];
  if (!p) return '';
  return `<span style="display:inline-block;margin-top:7px;font-size:11px;font-weight:700;letter-spacing:1px;`
    + `padding:3px 10px;border-radius:999px;background-color:${p.bg};color:${p.tx};">${p.label}</span>`;
}

function scoreBlock(our, opp) {
  if (our == null || opp == null) return '';
  return `<div style="font-size:24px;font-weight:700;color:${TEXT_NAVY};line-height:1;">`
    + `${escapeHtml(String(our))}<span style="color:${TEXT_MIST};">–</span>${escapeHtml(String(opp))}</div>`;
}

export default function renderRecapGameCell(section) {
  const { team_color, date_label, matchup, context, our_score, opponent_score, result } = section || {};
  const rail = team_color || BRAND_GOLD;
  const dateHtml = date_label
    ? `<div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${TEXT_SLATE};line-height:1.4;">${escapeHtml(date_label)}</div>`
    : '';
  const matchHtml = matchup
    ? `<div style="font-size:15px;font-weight:700;color:${TEXT_NAVY};line-height:1.3;margin-top:4px;">${escapeHtml(matchup)}</div>`
    : '';
  const ctxHtml = context
    ? `<div style="font-size:13px;font-weight:500;color:${TEXT_SLATE};line-height:1.4;margin-top:3px;">${escapeHtml(context)}</div>`
    : '';
  const rightHtml = scoreBlock(our_score, opponent_score) + resultPill(result);

  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;margin:10px 0;width:100%;border:1px solid ${BORDER_DEFAULT};border-radius:9px;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;">`
    + '<tr>'
    + `<td width="4" style="background-color:${escapeHtml(rail)};border-radius:9px 0 0 9px;font-size:0;line-height:0;">&nbsp;</td>`
    + `<td valign="middle" style="padding:14px 12px 14px 14px;min-height:80px;">${dateHtml}${matchHtml}${ctxHtml}</td>`
    + `<td valign="middle" align="right" style="padding:14px 15px 14px 8px;white-space:nowrap;">${rightHtml}</td>`
    + '</tr></table>';

  const score = (our_score != null && opponent_score != null) ? `${our_score}–${opponent_score}` : '';
  const pillWord = PILL[String(result || '').toUpperCase()]?.label || '';
  const plainParts = [date_label, matchup, context].filter(Boolean).join(' · ');
  const plainText = [plainParts, [score, pillWord].filter(Boolean).join(' ')].filter(Boolean).join(' — ');
  return { html, plainText };
}
