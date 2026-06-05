// Shared org-context builder for every briefing resolver.
//
// AP #63 (PATTERN A — same concept, divergent source/scope across surfaces):
// the org display name is ONE concept that every kind renders (eyebrow,
// footer orgName). Before this helper, 5 kinds hardcoded ORG_NAME_DEFAULT
// even though they SELECTed the org row, and the rest read
// `display_name || name` inline — so the same multi-tenant org could render
// its real name in some briefings and the Legacy-Hoopers default in others.
// Routing every kind through this one helper makes the name DB-sourced and
// identical everywhere.
//
// Pass the org row from `.select('id, name, display_name, brand_colors, voice_config')`
// (widen the select to include display_name) plus the org's coaches array.
// `org` may be null (e.g. orgId unresolved) — the defaults then apply.

import { ORG_CONTACT_DEFAULT, ORG_LOGO_DEFAULT, ORG_NAME_DEFAULT, ORG_WEBSITE_DEFAULT } from '../constants';

export function buildOrgContext({ orgId, org, coaches }) {
  return {
    id: orgId,
    name: org?.display_name || org?.name || ORG_NAME_DEFAULT,
    branding: {
      eyebrowLink: ORG_WEBSITE_DEFAULT,
      contactEmail: ORG_CONTACT_DEFAULT,
      logoUrl: ORG_LOGO_DEFAULT,
    },
    voice_config: org?.voice_config || null,
    brand_colors: org?.brand_colors || null,
    coaches: coaches || [],
  };
}
