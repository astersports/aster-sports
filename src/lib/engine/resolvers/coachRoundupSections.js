// Wave 5 PR 4b — section builders for the coach_roundup resolver.
// Each function takes context bits and returns a content_sections
// entry (or null to skip). Extracted from coachRoundup.js to keep
// both files under the 150-line cap.
//
// Builder fan-out (called by composeCoachRoundup):
//   coach_header → conflict_callout (if any) →
//   per team: team_color_pill → color_striped_row x N →
//   signoff → brand_footer

import { formatDateRange, formatDayLabel, formatTime } from './coachRoundupHelpers';

const FALLBACK_TEAM_COLOR = '#4a8fd4';

export function buildCoachHeaderSection(coach, teamsWithEvents, dateRange) {
  const teamCount = (teamsWithEvents || []).filter((t) => (t.events || []).length).length;
  return {
    kind: 'coach_header',
    coach_name: coach?.display_name || 'Coach',
    date_range_label: formatDateRange(dateRange),
    team_count: teamCount,
  };
}

export function buildConflictCalloutSection(conflicts) {
  if (!conflicts || !conflicts.length) return null;
  return { kind: 'conflict_callout', items: conflicts };
}

export function buildTeamSections(teamsWithEvents) {
  const out = [];
  for (const t of teamsWithEvents || []) {
    if (!(t.events || []).length) continue;
    out.push({
      kind: 'team_color_pill',
      team_name: t.team_name || 'Team',
      team_color: t.team_color || FALLBACK_TEAM_COLOR,
      event_count: t.events.length,
    });
    for (const ev of t.events) {
      out.push({
        kind: 'color_striped_row',
        team_color: t.team_color || FALLBACK_TEAM_COLOR,
        day_label: formatDayLabel(ev.start_at),
        time: formatTime(ev.start_at),
        primary: ev.opponent ? `vs ${ev.opponent}` : (ev.title || 'TBD'),
        secondary: ev.sub_location ? `${ev.location || ''} | ${ev.sub_location}`.trim().replace(/^\|\s*/, '') : (ev.location || ''),
      });
    }
  }
  return out;
}

export function buildBrandFooter(orgName) {
  return { kind: 'brand_footer', org_name: (orgName || 'Aster AAU').toUpperCase(), tagline: 'GROW YOUR GAME · OWN YOUR FUTURE' };
}
