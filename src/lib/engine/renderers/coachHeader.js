// Renderer — coach_roundup top banner. Cobalt band with the coach
// name + date range + "(N teams)" badge. Mirrors the cobalt_band
// header variant used by tournament_prelim but tuned for the
// multi-team scope (no headline; the rangle + count IS the context).

import { escapeHtml } from './_util';
import { COBALT_DEEP } from '../colors';

export default function renderCoachHeader(section) {
  const coach = section?.coach_name || 'Coach';
  const range = section?.date_range_label || '';
  const count = section?.team_count || 0;
  const eyebrow = `COACH ROUNDUP${range ? ` · ${escapeHtml(range)}` : ''}`;
  const headline = `${escapeHtml(coach)}`;
  const teamsLabel = count ? `${count} TEAM${count === 1 ? '' : 'S'}` : 'NO TEAMS THIS WINDOW';
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:0 0 16px 0;">'
    + `<tr><td style="padding:24px 20px;background-color:${COBALT_DEEP};color:#ffffff;font-family:Inter,system-ui,sans-serif;text-align:center;">`
    + `<div style="font-size:11px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;line-height:1.4;opacity:0.85;margin-bottom:6px;">${eyebrow}</div>`
    + `<div style="font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;letter-spacing:-0.2px;">${headline}</div>`
    + `<div style="font-size:12px;font-weight:600;color:#ffffff;letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;opacity:0.75;margin-top:6px;">${teamsLabel}</div>`
    + '</td></tr></table>';
  const plainText = [
    `COACH ROUNDUP${range ? ` · ${range}` : ''}`,
    coach,
    teamsLabel,
  ].join('\n');
  return { html, plainText };
}
