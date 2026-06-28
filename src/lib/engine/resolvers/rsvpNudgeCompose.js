// Pure compose half of the rsvp_nudge resolver pair (split out of
// rsvpNudge.js to keep that file under the AP #6 150-line cap). No IO —
// same input + context + slice + overrides => deeply-equal output (AP #27).
//
// Body overrides consumed: coach_note, parent_shoutout (each -> a
// stats_narrative), and signoff_message (-> the signoff section).
// The one-tap RSVP button URLs are emitted as literal {{rsvp_*_url}}
// placeholders and substituted per-recipient by the send pipeline (AP #29).

import { deriveEventLabel, joinKidNames, trim } from './rsvpNudgeHelpers';
import { buildSignoffSection } from '../buildSignoffSection';

export function composeRsvpNudge(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { event, team, location, urgency, org } = context;
  const eventLabel = deriveEventLabel(event);
  const subjectLabel = event.title || `${team?.name || ''} ${eventLabel}`.trim();
  const kids = slice.unresponded_kids || [];
  const namesJoined = joinKidNames(kids.map((k) => k.first_name));
  const sections = [];
  sections.push({ kind: 'header', eyebrow: `${team?.name || org.name} · RSVP NEEDED`, eyebrow_link: org.branding.eyebrowLink, headline: 'QUICK RSVP', urgency_label: (urgency.day_label || '').toUpperCase(), goldStripe: true });
  for (const kid of kids) {
    sections.push({ kind: 'rsvp_request', kid_first_name: kid.first_name, player_id: kid.player_id, team_name: team?.name || '', team_color: team?.team_color || '#c9952e', event_label: eventLabel, urgency_phrase: `${urgency.day_label} at ${urgency.time_label}`, rsvp_token_placeholders: { going: '{{rsvp_going_url}}', maybe: '{{rsvp_maybe_url}}', not_going: '{{rsvp_not_going_url}}' } });
  }
  sections.push({ kind: 'event_card', team_color: team?.team_color || '#c9952e', date: ((iso) => iso ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(iso)) : '')(event.start_at), time: urgency.time_range_label, location_name: location?.name || event.location || null, location_map_url: location?.google_maps_url || null, opponent: event.opponent || null });
  for (const key of ['coach_note', 'parent_shoutout']) {
    const v = trim(overrides[key]); if (v) sections.push({ kind: 'stats_narrative', body: v });
  }
  const signoff = buildSignoffSection({ overrides });
  if (signoff) sections.push(signoff);
  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail });
  const subject = `RSVP needed for ${namesJoined}: ${subjectLabel}`;
  return { subject, content_sections: sections };
}
