import { renderCoachKeys, renderContactFooter, renderSurvivalGuide } from './tournamentBriefingSections';

const NY_TZ = 'America/New_York';

const dateKeyFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY_TZ, year: 'numeric', month: 'numeric', day: 'numeric',
});
const dayLabelFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY_TZ, weekday: 'long', month: 'long', day: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true,
});

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function matchup(teamName, opponent, homeAway) {
  if (!opponent) return 'TBD';
  return homeAway === 'away'
    ? `${teamName} @ ${opponent}`
    : `${teamName} vs ${opponent}`;
}

function splitTime(startAt) {
  const [digits, meridiem] = timeFmt.format(new Date(startAt)).split(' ');
  return { digits, meridiem };
}

function groupByLocalDate(events) {
  const groups = new Map();
  for (const ev of events) {
    const key = dateKeyFmt.format(new Date(ev.start_at));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ev);
  }
  return groups;
}

function renderRow(ev, leftCell, teamName) {
  const { digits, meridiem } = splitTime(ev.start_at);
  const mText = escapeHtml(matchup(teamName, ev.opponent, ev.home_away).toUpperCase());
  const loc = escapeHtml(ev.location || 'TBD');
  const courtPart = ev.sub_location ? `, Court ${escapeHtml(ev.sub_location)}` : '';
  const mapLink = ev.maps_url
    ? ` <a href="${escapeHtml(ev.maps_url)}" style="color:#4a8fd4;font-weight:bold;text-decoration:none;">Map</a>`
    : '';
  return '<tr>'
    + `<td style="width:46px;background:#1a1a2e;text-align:center;vertical-align:middle;padding:12px 0;">${leftCell}</td>`
    + '<td style="padding:12px 14px;vertical-align:middle;">'
    + `<div style="font-size:18px;font-weight:bold;text-transform:uppercase;color:#1a1a2e;">${mText}</div>`
    + `<div style="font-size:12px;color:#666;margin-top:4px;">\u25cf ${loc}${courtPart}${mapLink}</div>`
    + '</td>'
    + '<td style="width:80px;background:#1a1a2e;text-align:center;vertical-align:middle;padding:8px 0;">'
    + `<div style="color:#ffffff;font-size:24px;font-weight:bold;">${escapeHtml(digits)}</div>`
    + `<div style="color:#4a8fd4;font-size:11px;">${escapeHtml(meridiem)}</div>`
    + '</td></tr>';
}

function renderDay(dayEvents, teamName) {
  const dayLabel = escapeHtml(
    dayLabelFmt.format(new Date(dayEvents[0].start_at)).toUpperCase()
  );
  const regulars = dayEvents.filter((e) => e.event_type !== 'bracket');
  const brackets = dayEvents.filter((e) => e.event_type === 'bracket');
  let rows = '';
  regulars.forEach((ev, i) => {
    const cell = `<span style="color:#4a8fd4;font-size:20px;font-weight:bold;">${i + 1}</span>`;
    rows += renderRow(ev, cell, teamName);
  });
  if (brackets.length) {
    rows += '<tr><td colspan="3" style="background:#f0d050;color:#1a1a2e;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;text-align:center;padding:6px 0;">Bracket Game</td></tr>';
    brackets.forEach((ev) => {
      const star = '<span style="color:#f0d050;font-size:20px;">\u2605</span>';
      rows += renderRow(ev, star, teamName);
    });
  }
  return `<tr><td colspan="3" style="background:#4a8fd4;color:#ffffff;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:3px;text-align:center;padding:8px 0;">${dayLabel}</td></tr>${rows}`;
}

function renderPlain(groups, teamName) {
  const lines = [];
  for (const [, evs] of groups) {
    lines.push(dayLabelFmt.format(new Date(evs[0].start_at)).toUpperCase());
    for (const ev of evs) {
      const t = timeFmt.format(new Date(ev.start_at));
      const m = matchup(teamName, ev.opponent, ev.home_away);
      const loc = ev.location || 'TBD';
      const court = ev.sub_location ? `, Court ${ev.sub_location}` : '';
      lines.push(`\u2022 ${t} \u2014 ${m} \u2014 ${loc}${court}`);
    }
    lines.push('');
  }
  lines.push('Arrive 15 minutes before tip-off.');
  return lines.join('\n');
}

export function generateTournamentBriefing({
  teamName,
  tournamentName,
  dateLabel,
  events,
  coachKeys = '',
  orgName = 'Legacy Hoopers',
}) {
  const groups = groupByLocalDate(events);
  const tName = escapeHtml(teamName);
  const tourn = escapeHtml(tournamentName);
  const dLabel = escapeHtml(dateLabel);
  const org = escapeHtml(orgName);
  const title = `${tName} \u2014 ${tourn}`.toUpperCase();

  let body = '';
  for (const [, evs] of groups) body += renderDay(evs, teamName);

  const html = '<div style="max-width:520px;margin:0 auto;border:3px solid #1a1a2e;border-radius:6px;font-family:Arial,sans-serif;background:#ffffff;overflow:hidden;">'
    + '<div style="background:#1a1a2e;border-bottom:5px solid #4a8fd4;text-align:center;padding:20px 16px;">'
    + `<div style="color:#4a8fd4;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">${org} Presents</div>`
    + `<div style="color:#ffffff;font-size:26px;text-transform:uppercase;font-weight:bold;margin:10px 0;line-height:1.2;">${title}</div>`
    + `<div style="display:inline-block;background:#f0d050;color:#1a1a2e;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:4px;border:1px solid rgba(74,143,212,0.4);">${dLabel}</div>`
    + '</div>'
    + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${body}</table>`
    + renderSurvivalGuide(events)
    + renderCoachKeys(coachKeys)
    + '<div style="background:#f5f7fa;text-align:center;padding:12px;font-size:13px;color:#1a1a2e;font-weight:bold;">Arrive 15 minutes before tip-off</div>'
    + renderContactFooter()
    + `<div style="background:#1a1a2e;text-align:center;padding:10px;font-size:11px;color:#666;">${org} \u2014 Westchester, NY</div>`
    + '</div>';

  const plainText = renderPlain(groups, teamName);
  const subject = `${teamName} \u2014 ${tournamentName} Weekend`;

  return { html, plainText, subject };
}
