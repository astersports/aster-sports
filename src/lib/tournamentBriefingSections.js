// Section renderers for Tournament Briefing HTML output. Kept separate so
// tournamentBriefing.js stays under 150 lines. All inline-styled for email.

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function jerseyList(events) {
  const items = (events || [])
    .map((e, i) => (e.jersey ? `Game ${i + 1} ${e.jersey.toLowerCase()}` : null))
    .filter(Boolean);
  return items.length ? `Jerseys: ${items.join(', ')}.` : '';
}

export function renderSurvivalGuide(events, survivalText) {
  const jerseys = jerseyList(events);
  const jerseyLine = jerseys
    ? `<div style="margin-bottom:6px;"><strong style="color:#4a8fd4;">${escapeHtml(jerseys)}</strong></div>`
    : '';
  const body = (survivalText || '').trim()
    || 'Arrive 15 min early for every game. Pack water, snacks, and a warm layer for between games. Bring cash for concessions, entry may be cash-only at the door.';
  return '<div style="background:#ffffff;padding:14px 16px;border-top:1px solid #e8e8e8;">'
    + '<div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#1a1a2e;text-align:center;margin-bottom:10px;">Parent Survival Guide</div>'
    + '<div style="font-size:13px;color:#1a1a2e;line-height:1.6;">'
    + jerseyLine
    + `<div>${escapeHtml(body)}</div>`
    + '</div></div>';
}

export function renderCoachKeys(keysText) {
  const trimmed = (keysText || '').trim();
  if (!trimmed) return '';
  const body = trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<div style="margin:6px 0;">\u2022 ${escapeHtml(line)}</div>`)
    .join('');
  return '<div style="background:#1a1a2e;padding:14px 16px;border-top:1px solid #e8e8e8;">'
    + '<div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#4a8fd4;text-align:center;margin-bottom:10px;">Coach Kenny\u2019s Keys</div>'
    + `<div style="font-size:13px;color:#ffffff;line-height:1.6;">${body}</div>`
    + '</div>';
}

export function renderContactFooter() {
  return '<div style="background:#ffffff;padding:12px 16px;text-align:center;border-top:1px solid #e8e8e8;">'
    + '<div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#666;margin-bottom:4px;">Questions?</div>'
    + '<div style="font-size:12px;color:#1a1a2e;line-height:1.5;">'
    + '<strong>Frank Samaritano</strong> 914-555-0100 \u00b7 <strong>Coach Kenny</strong> 914-555-0101'
    + '</div></div>';
}
