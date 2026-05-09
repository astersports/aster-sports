// Kind composer — academy_callup_notice. Single-family targeted email built
// from header (#1) + game card (#3) atomic renderers, plus inline intro / what-
// to-bring / CTA / signoff. Templates and free-text wrappers are wave-2 work,
// so the inline glue here is intentionally minimal.

import { renderHeader } from './header';
import { renderGameCard } from './gameCard';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function paragraph(text, marginTop = '16px') {
  return `<p style="font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#334155;margin:${marginTop} 28px 0 28px;">${escapeHtml(text)}</p>`;
}

function whatToBring(jerseyColor) {
  return '<div style="margin:20px 28px 0 28px;font-family:Inter,system-ui,sans-serif;">'
    + '<div style="font-size:11px;font-weight:700;color:#4a8fd4;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">What to bring</div>'
    + `<div style="font-size:14px;color:#334155;line-height:1.6;">Jersey: <strong>${escapeHtml(jerseyColor || 'team color')}</strong>. Water, snacks, and a warm layer for between games.</div>`
    + '</div>';
}

function ctaButton(url) {
  if (!url) return '';
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:20px 28px;">'
    + '<tr><td align="center">'
    + `<a href="${escapeHtml(url)}" style="display:inline-block;background-color:#4a8fd4;color:#ffffff;text-decoration:none;font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;letter-spacing:0.5px;">RSVP NOW</a>`
    + '</td></tr></table>';
}

function plainBody(d) {
  const lines = [
    `${(d.teamName || '').toUpperCase()} · CALL-UP`,
    `${(d.playerFirstName || '').toUpperCase()} IS IN`,
    `${d.eventDate || ''} · ${d.eventName || ''}`,
    '',
    `${d.coachName || 'Coach'} has a spot open for ${d.playerFirstName || 'your child'} on ${d.teamName || 'the team'} for ${d.eventName || 'this event'}.`,
    '',
  ];
  const card = d.gameCard || {};
  if (card.primary) lines.push(`Game: ${card.primary}`);
  if (card.rail?.timePrimary) {
    const suffix = card.rail.timeSuffix ? ` ${card.rail.timeSuffix}` : '';
    lines.push(`Time: ${card.rail.timePrimary}${suffix}`);
  }
  if (card.secondary?.text) lines.push(`Where: ${card.secondary.text}`);
  lines.push('', `Jersey: ${d.jerseyColor || 'team color'}. Water, snacks, warm layer.`);
  if (d.rsvpUrl) lines.push('', `RSVP: ${d.rsvpUrl}`);
  lines.push('', `Thanks — ${d.coachName || d.orgName || 'Legacy Hoopers'}`);
  return lines.join('\n');
}

export function composeAcademyCallupNotice(data = {}) {
  const team = (data.teamName || '').toUpperCase();
  const player = (data.playerFirstName || '').toUpperCase();
  const headerHtml = renderHeader({
    eyebrow: `${team} · CALL-UP`,
    headline: `${player} IS IN`,
    sub_context: data.eventName ? `${data.eventDate || ''} · ${data.eventName}`.trim() : data.eventDate,
    goldStripe: false,
  });
  const intro = paragraph(
    `${data.coachName || 'Coach'} has a spot open for ${data.playerFirstName || 'your child'} on ${data.teamName || 'the team'} for ${data.eventName || 'this event'}. Here's what you need to know:`
  );
  const card = data.gameCard
    ? `<div style="margin:16px 28px 0 28px;">${renderGameCard(data.gameCard)}</div>`
    : '';
  const signoff = paragraph(`Thanks — ${data.coachName || data.orgName || 'Legacy Hoopers'}`, '24px');
  const html = '<div style="background-color:#f7f8fa;padding:24px 0;">'
    + '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">'
    + headerHtml + intro + card + whatToBring(data.jerseyColor) + ctaButton(data.rsvpUrl) + signoff
    + '<div style="height:24px;"></div></div></div>';
  const subject = `Call-Up: ${data.playerFirstName || 'Player'} for ${data.eventName || 'Tournament'}`;
  return { html, plainText: plainBody(data), subject };
}
