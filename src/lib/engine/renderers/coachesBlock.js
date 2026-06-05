// Renderer — family_guide "Your coaches" reference block. Per-team
// coach contact groups: a team-name label, then one row per coach
// reusing the signoff row style (bold name + muted-gray title · phone).
// Table-based, inline-styled, no <style> blocks (§13). Team groups are
// already deduped + sorted upstream by buildTeamCoaches.

import { escapeHtml } from './_util';
import { COBALT_DEEP, TEXT_NAVY, TEXT_SLATE } from '../colors';

function renderCoachRow(c) {
  const meta = [c?.title, c?.phone].filter(Boolean).join(' · ');
  return `<tr><td style="font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.6;padding:0 0 6px 0;">`
    + `<span style="display:block;font-weight:700;color:${TEXT_NAVY};">${escapeHtml(c?.display_name || '')}</span>`
    + (meta ? `<span style="display:block;color:${TEXT_SLATE};font-size:13px;">${escapeHtml(meta)}</span>` : '')
    + '</td></tr>';
}

function renderTeamGroup(g) {
  const label = `<tr><td style="font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;`
    + `letter-spacing:1.5px;text-transform:uppercase;color:${COBALT_DEEP};padding:0 0 6px 0;">`
    + `${escapeHtml(g?.team_name || 'Team')}</td></tr>`;
  const rows = (g?.coaches || []).map(renderCoachRow).join('');
  return label + rows;
}

function renderPlain(teams) {
  const lines = ['Your coaches', ''];
  (teams || []).forEach((g) => {
    lines.push(g?.team_name || 'Team');
    (g?.coaches || []).forEach((c) => {
      const meta = [c?.title, c?.phone].filter(Boolean).join(' · ');
      lines.push(c?.display_name || '');
      if (meta) lines.push(meta);
    });
    lines.push('');
  });
  return lines.join('\n').trimEnd();
}

export default function renderCoachesBlock(section) {
  const teams = section?.teams || [];
  if (!teams.length) return { html: '', plainText: '' };
  const heading = `<tr><td style="font-family:Inter,system-ui,sans-serif;font-size:17px;font-weight:700;`
    + `color:${TEXT_NAVY};padding:0 0 12px 0;">Your coaches</td></tr>`;
  const groups = teams
    .map((g) => `${renderTeamGroup(g)}<tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>`)
    .join('');
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:20px 0 0 0;">'
    + heading + groups
    + '</table>';
  return { html, plainText: renderPlain(teams) };
}
