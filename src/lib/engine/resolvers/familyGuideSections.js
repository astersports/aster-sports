// Wave 5 PR 5a — section builders for the family_guide resolver.
// Each function takes context bits and returns a content_sections
// entry (or null to skip). Extracted from familyGuide.js to keep
// both files under the 150-line cap.
//
// Builder fan-out (called by composeFamilyGuide):
//   vip_header → kid_color_pill x N (one per kid) →
//   quick_link_nav → signoff → brand_footer
//
// 5a ships placeholder shapes — real per-event row builders land
// in 5b (kid_color_pill expands to color-striped event rows per
// kid, similar to coach_roundup's color_striped_row).

import { formatDateRange, summarizeEventKinds } from './familyGuideHelpers';

const FALLBACK_TEAM_COLOR = '#4a8fd4';

function trim(s) { return typeof s === 'string' ? s.trim() : ''; }

export function buildVipHeaderSection(parent, kidsWithEvents, dateRange, conflicts) {
  const kidNames = (kidsWithEvents || []).map((k) => k.first_name || 'Kid');
  const allEvents = (kidsWithEvents || []).flatMap((k) => k.events || []);
  return {
    kind: 'vip_header',
    parent_name: parent?.first_name || 'Parent',
    kid_names: kidNames,
    date_range_label: formatDateRange(dateRange),
    event_count: allEvents.length,
    events_label: summarizeEventKinds(allEvents),
    conflict_count: (conflicts || []).length,
  };
}

export function buildKidColorPillSections(kidsWithEvents) {
  const out = [];
  for (const k of kidsWithEvents || []) {
    if (!(k.events || []).length) continue;
    out.push({
      kind: 'kid_color_pill',
      kid_name: k.first_name || 'Kid',
      team_name: k.team_name || 'Team',
      team_color: k.team_color || FALLBACK_TEAM_COLOR,
      event_count: k.events.length,
      events_label: summarizeEventKinds(k.events),
    });
  }
  return out;
}

export function buildQuickLinkNav(kidsWithEvents) {
  // Renders 1-3 quick-action chips per kid: open RSVPs, view team
  // schedule, jump to map. 5a stub returns null when no kids; 5b
  // wires per-kid links once the resolver supplies real player_id /
  // team_id values to embed in the URL slugs.
  if (!(kidsWithEvents || []).length) return null;
  return {
    kind: 'quick_link_nav',
    items: kidsWithEvents.map((k) => ({
      kid_name: k.first_name || 'Kid',
      team_name: k.team_name || 'Team',
      team_color: k.team_color || FALLBACK_TEAM_COLOR,
      player_id: k.player_id || null,
      team_id: k.team_id || null,
    })),
  };
}

export function buildSignoffSection(overrides, coaches) {
  const prose = trim(overrides?.signoff_message);
  const validCoaches = (coaches || []).filter((c) => c.display_name && c.phone)
    .map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  if (!prose && !validCoaches.length) return null;
  return { kind: 'signoff', prose, coaches: validCoaches };
}

export function buildBrandFooter(orgName) {
  return { kind: 'brand_footer', org_name: (orgName || 'Legacy Hoopers').toUpperCase(), tagline: 'GROW YOUR GAME · LEAVE YOUR LEGACY' };
}
