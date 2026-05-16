// Renderer — game_log. Used by tournament_recap composer
// (resolvers/tournamentRecap.js via tournamentRecapHelpers.js:38, 46).
// Per-day game listing with result, opponent, venue (map link), and
// optional player-of-game + coach_highlight.
//
// Shape: { team_color, days: [{ day_label, rows: [{ time, opponent,
//   location_name, location_map_url, result?, our_score?,
//   opponent_score?, player_of_game?, coach_highlight?, status? }] }],
//   placeholder? }

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, COBALT, STATUS_LOSS, STATUS_WIN, TEXT_NAVY, TEXT_SLATE, TEXT_SLATE_DARK } from '../colors';

function resultBadge(row) {
  if (!row.result) return `<span style="font-size:11px;font-weight:600;color:${TEXT_SLATE};font-style:italic;">${escapeHtml(row.status || 'Pending')}</span>`;
  const isWin = String(row.result).toUpperCase() === 'W';
  const color = isWin ? STATUS_WIN : (String(row.result).toUpperCase() === 'L' ? STATUS_LOSS : TEXT_SLATE_DARK);
  const score = (row.our_score != null && row.opponent_score != null) ? ` ${row.our_score}-${row.opponent_score}` : '';
  return `<span style="font-size:13px;font-weight:700;color:${color};">${escapeHtml(String(row.result).toUpperCase())}${escapeHtml(score)}</span>`;
}

function venue(row) {
  if (!row.location_name) return '';
  return row.location_map_url
    ? `<a href="${escapeHtml(row.location_map_url)}" style="color:${COBALT};text-decoration:none;">${escapeHtml(row.location_name)}</a>`
    : escapeHtml(row.location_name);
}

function renderRow(row) {
  const meta = [row.time, `vs ${row.opponent || 'TBD'}`].filter(Boolean).join(' · ');
  const venueLine = venue(row);
  const secondaries = [];
  if (row.player_of_game) secondaries.push(`POG: ${escapeHtml(row.player_of_game)}`);
  if (row.coach_highlight) secondaries.push(escapeHtml(row.coach_highlight));
  const secondaryHtml = secondaries.length
    ? `<div style="font-size:12px;color:${TEXT_SLATE_DARK};line-height:1.4;margin-top:2px;">${secondaries.join(' &middot; ')}</div>`
    : '';
  return '<tr><td style="padding:10px 14px;border-bottom:1px solid ' + BORDER_DEFAULT + ';font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:13px;font-weight:600;color:${TEXT_NAVY};line-height:1.4;">${escapeHtml(meta)} &middot; ${resultBadge(row)}</div>`
    + (venueLine ? `<div style="font-size:12px;color:${TEXT_SLATE};line-height:1.4;margin-top:2px;">${venueLine}</div>` : '')
    + secondaryHtml
    + '</td></tr>';
}

function renderDay(day) {
  const header = `<tr><td style="padding:10px 14px;background-color:#f8fafc;border-bottom:1px solid ${BORDER_DEFAULT};font-family:Inter,system-ui,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:${TEXT_SLATE_DARK};text-transform:uppercase;">${escapeHtml(day.day_label || '')}</td></tr>`;
  const rows = (day.rows || []).map(renderRow).join('');
  return header + rows;
}

export default function renderGameLog(section) {
  const days = section?.days || [];
  const teamColor = section?.team_color || '#4a8fd4';
  if (!days.length) {
    const placeholder = section?.placeholder || 'No games played';
    const html = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:12px 0;"><tr><td style="border-left:4px solid ${escapeHtml(teamColor)};padding:14px 16px;background-color:#ffffff;border-top:1px solid ${BORDER_DEFAULT};border-right:1px solid ${BORDER_DEFAULT};border-bottom:1px solid ${BORDER_DEFAULT};border-radius:0 6px 6px 0;font-family:Inter,system-ui,sans-serif;font-size:13px;color:${TEXT_SLATE};font-style:italic;">${escapeHtml(placeholder)}</td></tr></table>`;
    return { html, plainText: placeholder };
  }

  const dayHtml = days.map(renderDay).join('');
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;margin:12px 0;border:1px solid ${BORDER_DEFAULT};border-left:4px solid ${escapeHtml(teamColor)};border-radius:0 6px 6px 0;background-color:#ffffff;">`
    + dayHtml
    + '</table>';

  const plainLines = [];
  for (const day of days) {
    plainLines.push((day.day_label || '').toUpperCase());
    for (const row of day.rows || []) {
      const result = row.result ? ` — ${String(row.result).toUpperCase()}${(row.our_score != null && row.opponent_score != null) ? ` ${row.our_score}-${row.opponent_score}` : ''}` : ` — ${row.status || 'Pending'}`;
      plainLines.push(`  ${row.time || ''} vs ${row.opponent || 'TBD'}${result}`);
      if (row.location_name) plainLines.push(`    ${row.location_name}${row.location_map_url ? ` (${row.location_map_url})` : ''}`);
      if (row.player_of_game) plainLines.push(`    POG: ${row.player_of_game}`);
      if (row.coach_highlight) plainLines.push(`    ${row.coach_highlight}`);
    }
  }
  return { html, plainText: plainLines.join('\n') };
}
