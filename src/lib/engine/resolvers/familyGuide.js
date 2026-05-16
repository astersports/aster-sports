// Wave 5 PR 5a — family_guide resolver + composer (STUB).
// One parent → N kids → N teams → N events. Single briefing per
// parent collapses all their kids' upcoming schedule into one VIP-
// style preview with cross-kid conflict detection.
//
// 5a ships the schema + skeleton (this file + helpers + sections).
// 5b replaces the stub aggregation with the real walk through
// player_guardians → players → team_players → events. 5c adds the
// UI body component (parent picker + date range).
//
// Two-stage contract:
//   resolveFamilyGuide({ parentUserId, dateRange }, { supabase })
//     -> { context, slices }
//   composeFamilyGuide(context, slice, overrides)
//     -> { subject, content_sections }

import {
  buildBrandFooter, buildKidColorPillSections, buildQuickLinkNav,
  buildSignoffSection, buildVipHeaderSection,
} from './familyGuideSections';

export async function resolveFamilyGuide({ parentUserId, dateRange }, { supabase } = {}) {
  if (!parentUserId) throw new Error('Missing parentUserId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');

  // 5a stub — real walk lands in 5b. Returns a sentinel context that
  // the composer can render as a placeholder briefing so the registry
  // wiring + composer pipeline can be exercised end-to-end before the
  // aggregation is wired.
  const { data: parent, error: pErr } = await supabase.from('guardians')
    .select('id, first_name, last_name, email, org_id').eq('user_id', parentUserId).maybeSingle();
  if (pErr) throw pErr;
  if (!parent) throw new Error(`Parent ${parentUserId} not found in guardians`);

  return {
    context: {
      parent,
      kidsWithEvents: [],
      conflicts: [],
      dateRange: dateRange || null,
      coaches: [],
      orgName: 'Legacy Hoopers',
    },
    slices: [{ recipient_user_id: parentUserId, parent_name: parent.first_name || 'Parent', parent_email: parent.email }],
  };
}

export function composeFamilyGuide(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { parent, kidsWithEvents, conflicts, dateRange, coaches, orgName } = context;
  const sections = [buildVipHeaderSection(parent, kidsWithEvents, dateRange, conflicts)];
  sections.push(...buildKidColorPillSections(kidsWithEvents));
  const navSection = buildQuickLinkNav(kidsWithEvents);
  if (navSection) sections.push(navSection);
  const signoff = buildSignoffSection(overrides, coaches);
  if (signoff) sections.push(signoff);
  sections.push(buildBrandFooter(orgName));
  return {
    subject: `Your family guide — ${slice.parent_name || parent?.first_name || 'Family'}`,
    content_sections: sections,
  };
}
