// Wave 5 PR 5a / 5b — section builders for the family_guide resolver.
// Each function takes context bits and returns a content_sections
// entry (or null to skip). Extracted from familyGuide.js to keep
// both files under the 150-line cap.
//
// Builder fan-out (called by composeFamilyGuide):
//   vip_header → conflict_callout (5b-3, when conflicts > 0) →
//   per kid (5b-2): kid_color_pill → color_striped_row x N →
//   quick_link_nav → signoff → brand_footer
//
// 5a shipped placeholder shapes. 5b-1 added kind-aware label.
// 5b-3 added conflict_callout section. 5b-2 (this PR) finally lands
// per-event color_striped_row rows under each kid_color_pill +
// wires the quick_link_nav URLs to the team detail page.

import { formatDateRange, formatDayLabel, formatTime, summarizeEventKinds } from './familyGuideHelpers';
import { APP_BASE_URL, ORG_CONTACT_DEFAULT, ORG_LOGO_DEFAULT, ORG_WEBSITE_DEFAULT } from '../../constants';

const FALLBACK_TEAM_COLOR = '#4a8fd4';

function trim(s) { return typeof s === 'string' ? s.trim() : ''; }

// PR 5b-3 — Family Guide gets its own conflict_callout section, mirroring
// Coach Roundup's pattern. detectConflicts produces items with kid_a /
// kid_b in addition to team_a / team_b — the shared renderer was
// updated to surface kid names when present (and stay team-only for
// the coach audience case). Empty conflicts → null (composer skips).
export function buildConflictCalloutSection(conflicts) {
  if (!conflicts || !conflicts.length) return null;
  return { kind: 'conflict_callout', items: conflicts };
}

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

// PR 5b-2 — per-kid block expands to: kid_color_pill (summary chip)
// + color_striped_row per event (mirrors coachRoundupSections.buildTeamSections).
// Events are already sorted chronologically by groupEventsByKid in
// familyGuideHelpers, so day_label progresses naturally from earliest
// to latest within each kid block. Same kid on two teams produces two
// adjacent blocks (different team_color = visual separation).
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
    for (const ev of k.events) {
      out.push({
        kind: 'color_striped_row',
        team_color: k.team_color || FALLBACK_TEAM_COLOR,
        day_label: formatDayLabel(ev.start_at),
        time: formatTime(ev.start_at),
        primary: ev.opponent ? `vs ${ev.opponent}` : (ev.title || 'TBD'),
        secondary: ev.sub_location
          ? `${ev.location || ''} | ${ev.sub_location}`.trim().replace(/^\|\s*/, '')
          : (ev.location || ''),
      });
    }
  }
  return out;
}

// PR 5b-2 — quick_link_nav each row links to the per-kid team detail
// page at /teams/<team_id>. That URL is auth-gated (Protected route in
// App.jsx); parents land on the team page where they can drill into
// individual events for RSVPs / maps. Single URL per kid keeps the
// visual compact; per-event URLs (RSVP signed-tokens, map deep-links)
// already live on the color_striped_row's parent route, so the nav
// stays focused on team-level navigation.
export function buildQuickLinkNav(kidsWithEvents) {
  if (!(kidsWithEvents || []).length) return null;
  return {
    kind: 'quick_link_nav',
    items: kidsWithEvents.map((k) => ({
      kid_name: k.first_name || 'Kid',
      team_name: k.team_name || 'Team',
      team_color: k.team_color || FALLBACK_TEAM_COLOR,
      player_id: k.player_id || null,
      team_id: k.team_id || null,
      url: k.team_id ? `${APP_BASE_URL}/teams/${k.team_id}` : null,
    })),
  };
}

// "Your coaches" reference block — per-team coach contact groups. teamCoaches
// is already deduped + sorted (oldest-to-youngest) by buildTeamCoaches. Each
// group carries team_name + coaches [{ display_name, title, phone }]. Returns
// null when no team has a coach (composer skips — no fabrication, AP #27).
export function buildCoachesBlockSection(teamCoaches) {
  const teams = (teamCoaches || []).filter((g) => (g.coaches || []).length);
  if (!teams.length) return null;
  return {
    kind: 'coaches_block',
    teams: teams.map((g) => ({
      team_name: g.team_name || 'Team',
      coaches: g.coaches.map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' })),
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

// Decision 2 (architect, 2026-06-08): family_guide is parent-facing bulk email,
// so it carries the SAME compliant footer as the other guardian-facing kinds —
// the full `footer` kind (logo + contact + the {{UNSUBSCRIBE_URL}} block that
// renderFooter emits and queueComposedMessages substitutes per-recipient), NOT
// the tagline-only brand_footer which had no unsubscribe link. No physical
// address (operator directive: the org address is internal-only / tax).
export function buildFamilyGuideFooter(orgName, branding = {}) {
  return {
    kind: 'footer',
    logoUrl: branding.logoUrl || ORG_LOGO_DEFAULT,
    orgName: orgName || 'Legacy Hoopers',
    websiteUrl: branding.eyebrowLink || ORG_WEBSITE_DEFAULT,
    contactEmail: branding.contactEmail || ORG_CONTACT_DEFAULT,
  };
}
