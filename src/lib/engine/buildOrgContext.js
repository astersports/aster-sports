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
//
// `signature_coaches` (optional) is the team-aware voice-signature staff
// (org Program Director + the game's team's team_staff coaches) resolved by
// fetchSignatureCoaches. It drives the narrative sign-off line ("Frank &
// Coach Kenny" / "& Coach Darien" on 9U/8U) and is DISTINCT from `coaches`
// (the org-wide contact block at the bottom of the signoff). When omitted,
// it falls back to `coaches` so callers not yet wired keep prior behavior.

import { ORG_CONTACT_DEFAULT, ORG_LOGO_DEFAULT, ORG_NAME_DEFAULT, ORG_WEBSITE_DEFAULT } from '../constants';

export function buildOrgContext({ orgId, org, coaches, signature_coaches }) {
  return {
    id: orgId,
    name: org?.display_name || org?.name || ORG_NAME_DEFAULT,
    branding: {
      eyebrowLink: ORG_WEBSITE_DEFAULT,
      contactEmail: ORG_CONTACT_DEFAULT,
      logoUrl: ORG_LOGO_DEFAULT,
      // G1 (CAN-SPAM): physical postal address, read live from
      // organizations.mailing_address; null -> footer omits the line.
      mailingAddress: org?.mailing_address || null,
    },
    voice_config: org?.voice_config || null,
    brand_colors: org?.brand_colors || null,
    coaches: coaches || [],
    signature_coaches: signature_coaches || coaches || [],
  };
}
