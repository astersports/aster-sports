// PR-D token chip — resolve the STATIC body-token URLs for the legacy
// (custom_message / announcement) single-body send path.
//
// Three tokens, three sources (per the §15 / publicUrls / mapsUrls infra):
//   schedule   — publicScheduleUrl(teamId): the unauthenticated public
//                /schedule/:teamId page. Resolved per the send's first team.
//   directions — getDirectionUrls(...).google for the anchor event's
//                location (location.google_maps_url > coords > address).
//   rsvp       — per-RECIPIENT signed token; NOT resolvable in the single-
//                body legacy path (needs the per-slice mint pipeline, like
//                rsvpNudge). Intentionally omitted here so the renderer's
//                fail-loud fallback shows the literal {{token:rsvp_url}}
//                rather than a fabricated link (AP #29). See PR-D report.
//
// "Latest briefing" has no source at all and is not in BODY_TOKENS, so it
// can never reach this resolver.

import { publicScheduleUrl } from '../publicUrls';
import { getDirectionUrls } from '../mapsUrls';

export async function resolveBodyTokenUrls(state, supabase) {
  const urls = {};

  const teamId = state.audience_filter?.team_ids?.[0]
    || (state.anchor_kind === 'team' ? state.anchor_id : null);
  if (teamId) urls.schedule = publicScheduleUrl(teamId);

  if (state.anchor_kind === 'event' && state.anchor_id) {
    const { data: event, error } = await supabase
      .from('events')
      .select('location, location_id, locations:location_id ( address, lat, lon, google_maps_url )')
      .eq('id', state.anchor_id)
      .maybeSingle();
    if (error) throw error;
    const loc = event?.locations || null;
    const dir = loc ? getDirectionUrls(loc.address, loc.lat, loc.lon, loc.google_maps_url) : null;
    if (dir?.google) urls.directions = dir.google;
  }

  return urls;
}

// PR-D — substitute the resolved static URLs into the composed sections
// (AP #29: body_token_placeholders -> body_token_urls) and re-render the
// dispatched html/plainText off the substituted sections. Render functions
// + wrapper are injected so this stays pure (no engine import cycle).
// Unresolved token kinds (e.g. per-recipient rsvp in the single-body path)
// are simply absent from body_token_urls, so the renderer's fail-loud
// literal fallback fires for them.
export function substituteAndRenderLegacy(composed, urlMap, { renderSections, renderSectionsPlainText, htmlOpen, htmlClose }) {
  const sections = (composed.sections || []).map((s) => {
    if (!Array.isArray(s.body_token_placeholders)) return s;
    const resolved = {};
    for (const kind of s.body_token_placeholders) {
      if (typeof urlMap[kind] === 'string' && urlMap[kind]) resolved[kind] = urlMap[kind];
    }
    const { body_token_placeholders, ...rest } = s;
    void body_token_placeholders;
    return { ...rest, body_token_urls: resolved };
  });
  return { ...composed, sections, html: htmlOpen + renderSections(sections) + htmlClose, plainText: renderSectionsPlainText(sections) };
}
