// Renderer — callup_card. Used by academy_callup_notice composer
// (resolvers/academyCallupNotice.js:117). The narrative paragraph
// is the primary content; a small team-color visual row below makes
// the call-up direction (home futures → receiving active) scannable.
//
// Same-team variant (kid moves from same team's Futures Academy to
// the same team's active roster) renders a single team pill.
// Cross-team variant renders two pills with an arrow between them.

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, TEXT_NAVY, TEXT_SLATE_DARK } from '../colors';

function pill(color, name) {
  const c = color || '#c9952e';
  return `<span style="display:inline-block;padding:4px 12px;background-color:${escapeHtml(c)};color:#ffffff;font-size:12px;font-weight:600;letter-spacing:0.5px;border-radius:9999px;line-height:1.4;">${escapeHtml(name || 'TEAM')}</span>`;
}

export default function renderCallupCard(section) {
  const narrative = section?.narrative || '';
  const urgency = section?.urgency_phrase || '';
  const isSameTeam = !!section?.is_same_team;
  const homeName = section?.home_team_name || '';
  const homeColor = section?.home_team_color;
  const recvName = section?.receiving_team_name || '';
  const recvColor = section?.receiving_team_color;

  const teamRow = isSameTeam
    ? `<div style="margin-top:12px;text-align:center;">${pill(homeColor, homeName)} <span style="font-size:13px;color:${TEXT_SLATE_DARK};margin:0 6px;">Futures → Active</span></div>`
    : `<div style="margin-top:12px;text-align:center;">${pill(homeColor, homeName)} <span style="font-size:14px;color:${TEXT_SLATE_DARK};margin:0 8px;">→</span> ${pill(recvColor, recvName)}</div>`;

  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:12px 0;">'
    + `<tr><td style="padding:16px 20px;background-color:#ffffff;border:1px solid ${BORDER_DEFAULT};border-radius:8px;font-family:Inter,system-ui,sans-serif;">`
    + (narrative
        ? `<div style="font-size:15px;color:${TEXT_NAVY};line-height:1.5;">${escapeHtml(narrative)}</div>`
        : '')
    + teamRow
    + (urgency
        ? `<div style="margin-top:10px;text-align:center;font-size:12px;font-weight:600;letter-spacing:1px;color:${TEXT_SLATE_DARK};text-transform:uppercase;">${escapeHtml(urgency)}</div>`
        : '')
    + '</td></tr></table>';

  const directionPlain = isSameTeam
    ? `${homeName} Futures → ${homeName} Active`
    : `${homeName} Futures → ${recvName}`;
  const plainLines = [narrative, directionPlain, urgency].filter(Boolean);

  return { html, plainText: plainLines.join('\n') };
}
