// Wave 4.3-K — split composeWeeklyDigest out of weeklyDigest.js to keep
// the resolver module under the 150-line cap (CLAUDE.md §6 / §11). The
// public re-export from weeklyDigest.js preserves the import surface for
// existing consumers (tests, send pipeline, registry).

import { formatSubject } from '../digestPeriod';
import { buildScheduleSection } from './weeklyDigestSchedule';
import { buildVoiceSignature } from '../voiceSignature';

const HEADLINE_DEFAULT = 'WEEK AHEAD';

export function composeWeeklyDigest(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { body_notes = '', signoff_message = '', ops_notes = '', audience_team_ids = null } = overrides;
  // Wave 4.3-K: audience anchor enforcement. Pre-4.3-K, body events were
  // scoped to slice.team_ids only — which meant multi-team families and
  // pilot-test synthetic rows rendered events from whichever team_id the
  // slice happened to carry, ignoring the message's audience anchor. Now
  // intersect: when audience_team_ids is provided (team/multi_team kinds),
  // the body filters to the intersection. org_all sends pass null → no
  // intersection (slice.team_ids drives, as before).
  let effectiveTeamIds = slice.team_ids || [];
  if (Array.isArray(audience_team_ids) && audience_team_ids.length) {
    const audienceSet = new Set(audience_team_ids);
    effectiveTeamIds = effectiveTeamIds.filter((t) => audienceSet.has(t));
  }
  const teamSet = new Set(effectiveTeamIds);
  const familyEvents = (context.events || []).filter((e) => teamSet.has(e.team_id));
  const sections = [];
  sections.push({ kind: 'header', eyebrow: context.org.name, eyebrow_link: context.org.branding.eyebrowLink, headline: HEADLINE_DEFAULT, sub_context: context.period.label, goldStripe: true });
  if (body_notes && body_notes.trim()) sections.push({ kind: 'stats_narrative', body: body_notes.trim() });
  const schedule = buildScheduleSection({ events: familyEvents, teams: context.teams, tournaments: context.tournaments, rsvpCountsByEvent: context.rsvpCountsByEvent });
  if (schedule) sections.push(schedule);
  const opsItems = (ops_notes || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (opsItems.length) sections.push({ kind: 'ops_notes', title: 'BEFORE YOU GO', items: opsItems });
  const validCoaches = (context.org.coaches || []).filter((c) => c.display_name && c.phone).map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  const signature = buildVoiceSignature(context.org.signature_coaches);
  const hasSignoff = (signoff_message && signoff_message.trim()) || signature || validCoaches.length;
  if (hasSignoff) sections.push({ kind: 'signoff', prose: (signoff_message || '').trim(), signature, coaches: validCoaches });
  sections.push({ kind: 'footer', logoUrl: context.org.branding.logoUrl, orgName: context.org.name, websiteUrl: context.org.branding.eyebrowLink, contactEmail: context.org.branding.contactEmail });
  return { subject: formatSubject(context.period), content_sections: sections };
}
