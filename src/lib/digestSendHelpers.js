// Cutover PR 7b-2.5 — pure helpers extracted from digestSend.js to keep
// the orchestrator under the 150-line cap (CLAUDE.md §6 / §11). Mirrors
// the Wave 4.3-K pattern that split composeWeeklyDigest out of
// weeklyDigest.js for the same reason.
//
// Pure functions only. No DB / Supabase access.

import { renderSections, renderSectionsPlainText } from './engine/composer';
import { formatPeriodLabel } from './engine/digestPeriod';
import { composeWeeklyDigest } from './engine/resolvers/weeklyDigest';
import { EMAIL_WRAPPER_CLOSE, EMAIL_WRAPPER_OPEN } from './emailWrapper';
import { ORG_CONTACT_DEFAULT, ORG_LOGO_DEFAULT, ORG_NAME_DEFAULT, ORG_WEBSITE_DEFAULT } from './constants';


export function buildContext({ orgId, period, events, teams, tournaments, coaches, rsvpCountsByEvent }) {
  const counts = rsvpCountsByEvent instanceof Map ? rsvpCountsByEvent : new Map(Object.entries(rsvpCountsByEvent || {}));
  return {
    org: {
      id: orgId, name: ORG_NAME_DEFAULT,
      branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
      voice_config: null, brand_colors: null,
      coaches: coaches || [],
    },
    period: { start: period.start, end: period.end, label: formatPeriodLabel(period) },
    events: events || [], teams: teams || [], tournaments: tournaments || [],
    rsvpCountsByEvent: counts,
  };
}

// E1 (Platform PR ε, L99 audit PART 2.3): tag is_synthetic at slice producer
// so carve-out reads an explicit flag, not the fragile guardian_id==null.
export function buildSlicesFromRecipients(recipients) {
  return (recipients || [])
    .map((r) => ({ kind: 'family', guardian_id: r.guardian_id, email: r.email, kid_first_names: r.kid_first_names || [], team_ids: (r.team_ids || []).slice(), is_synthetic: r.guardian_id == null }))
    .sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
}

export function renderSlice(context, slice, overrides) {
  const { subject, content_sections } = composeWeeklyDigest(context, slice, overrides);
  const html = EMAIL_WRAPPER_OPEN + renderSections(content_sections) + EMAIL_WRAPPER_CLOSE;
  const plainText = renderSectionsPlainText(content_sections);
  return { subject, html, plainText, sections: content_sections, teams_included: slice.team_ids };
}
