// Wave 5 (cutover wave PR 1) — section builders for tournament_prelim
// resolver. Each function takes resolver context + slice + overrides
// and returns a content_sections entry (or null to skip). Extracted
// from tournamentPrelim.js to keep both files under the 150-line cap
// per CLAUDE.md §0 rule 4.
//
// Builder fan-out (called by compose() in resolvers/tournamentPrelim.js):
//   header → rsvp_callout → venue_list → schedule rows (per day) →
//   bracket section → logistics_line → signoff (optional) →
//   tagline_footer → brand_footer

import { formatDayLabel, formatTime, trim } from './tournamentPrelimHelpers';

function uniqueVenues(events, locations) {
  const seen = new Set();
  const out = [];
  for (const ev of events || []) {
    const loc = locations[ev.location_id];
    if (!loc || seen.has(loc.id)) continue;
    seen.add(loc.id);
    out.push({ name: loc.name, city: cityFromAddress(loc.address), map_url: loc.google_maps_url, address: loc.address });
  }
  return out;
}

function cityFromAddress(address) {
  if (!address) return null;
  const parts = String(address).split(',').map((s) => s.trim());
  return parts.length >= 2 ? parts[1] : null;
}

export function buildHeaderSection(slice, tournament, overrides) {
  const headline = trim(overrides.headline) || 'TOURNAMENT WEEKEND';
  const subContext = trim(overrides.sub_context_line) || (tournament.primary_venue ? `${tournament.start_date} – ${tournament.end_date} | ${tournament.primary_venue}` : `${tournament.start_date} – ${tournament.end_date}`);
  return { kind: 'header', variant: 'cobalt_band', eyebrow: `${slice.team_name.toUpperCase()} | ${tournament.name.toUpperCase()}`, headline, sub_context: subContext, team_color: slice.team_color };
}

export function buildRsvpCalloutSection(overrides, defaultCoachName) {
  const coachName = trim(overrides.rsvp_coach_first_name) || defaultCoachName || 'Coach';
  return { kind: 'rsvp_callout', text: `RSVP in the LeagueApps app so Coach ${coachName} can set rosters.` };
}

export function buildVenueListSection(events, locations) {
  const venues = uniqueVenues(events, locations);
  if (!venues.length) return null;
  return { kind: 'venue_list', venues, single_with_address: venues.length === 1 };
}

export function buildScheduleSections(events, locations) {
  if (!events || !events.length) return [];
  const sections = [];
  const dayMap = new Map();
  const pool = []; const brackets = [];
  for (const ev of events) (ev.is_bracket_placeholder ? brackets : pool).push(ev);
  for (const ev of pool) {
    const label = formatDayLabel(ev.start_at);
    if (!dayMap.has(label)) dayMap.set(label, []);
    dayMap.get(label).push(ev);
  }
  let gameIdx = 0;
  for (const [day_label, dayEvents] of dayMap) {
    const venues = new Set(dayEvents.map((e) => locations[e.location_id]?.name).filter(Boolean));
    const venueSuffix = venues.size === 1 ? Array.from(venues)[0] : null;
    sections.push({ kind: 'day_header', label: day_label, venue_suffix: venueSuffix });
    for (const ev of dayEvents) sections.push(gameCardForEvent(ev, locations, ++gameIdx, venueSuffix));
  }
  return { schedule: sections, brackets };
}

function gameCardForEvent(ev, locations, gameIdx, dayVenueSuffix) {
  const loc = locations[ev.location_id] || null;
  const venueText = loc?.name && loc.name !== dayVenueSuffix ? `${loc.name} | ${ev.sub_location || ''}` : (ev.sub_location || 'TBD');
  const isBonus = ev.is_bonus_game;
  return {
    kind: 'game_card', variant: 'regular',
    rail: { label: isBonus ? 'BONUS' : `GAME ${gameIdx}`, timePrimary: formatTime(ev.start_at) },
    primary: `vs ${ev.opponent || 'TBD'}`,
    secondary: { text: venueText, link: loc?.google_maps_url ? { url: loc.google_maps_url, text: 'Map' } : null },
    stakeLine: isBonus ? { text: 'Does not count toward standings.', tone: 'muted' } : null,
  };
}

export function buildBracketSections(brackets, locations) {
  if (!brackets || !brackets.length) return [];
  const hasSemi = brackets.some((b) => /semi/i.test(b.bracket_label || ''));
  const calloutText = hasSemi ? 'BRACKET PLAY | IF ADVANCE' : 'CHAMPIONSHIP | IF ADVANCE';
  const out = [{ kind: 'bracket_callout', text: calloutText }];
  for (const ev of brackets) {
    const loc = locations[ev.location_id] || null;
    const isChamp = /championship/i.test(ev.bracket_label || '') || /championship/i.test(ev.bracket_placeholder_label || '');
    out.push({
      kind: 'game_card', variant: isChamp ? 'championship' : 'regular',
      rail: { label: isChamp ? '★' : (ev.bracket_label || 'SEMI').toUpperCase(), timePrimary: formatTime(ev.start_at) },
      primary: ev.bracket_placeholder_label || 'TBD',
      secondary: { text: `${loc?.name || 'TBD'}${ev.sub_location ? ' | ' + ev.sub_location : ''}`, link: loc?.google_maps_url ? { url: loc.google_maps_url, text: 'Map' } : null },
    });
  }
  return out;
}

export function buildLogisticsLine(overrides) {
  const arrivalMin = overrides.arrival_minutes || 15;
  const jersey = trim(overrides.jersey_note) || 'black side out';
  return { kind: 'logistics_line', text: `Arrive ${arrivalMin} minutes before each tip | Jersey: ${jersey}` };
}

export function buildTaglineFooter(overrides) {
  const text = trim(overrides.tagline);
  return text ? { kind: 'tagline_footer', text } : null;
}

export function buildBrandFooter(orgName) {
  return { kind: 'brand_footer', org_name: (orgName || 'Legacy Hoopers').toUpperCase(), tagline: 'GROW YOUR GAME · LEAVE YOUR LEGACY' };
}
