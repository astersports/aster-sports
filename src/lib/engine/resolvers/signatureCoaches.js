// IO half of the team-aware voice signature (pure half: ../voiceSignature.js).
//
// Resolves the coaching staff that signs a briefing's narrative, data-driven
// per the architect decision (docs/ARCH_DECISIONS_HUB_S1.txt C3):
//   signature = org Program Director(s)  (org-level, always — Frank)
//             + the game's team's coaches (from team_staff — Kenny, and
//               Darien once he's added to 9U/8U team_staff)
//
// There is NO per-event coach assignment (events has no coach column, there
// is no event_staff table). Coaches live in team_staff(team_id, user_id,
// role) → staff_profiles(user_id, display_name, title, phone). So the team
// half resolves from team_staff for the event's team_id(s). The "& Coach
// Darien on 9U/8U" behavior is purely data-driven: it appears the moment
// Darien is in those teams' team_staff, with zero code change here.
//
// This is IO (a supabase fetch) — it runs in the resolve stage, which is
// already impure. The compose stage stays pure (AP #27): it receives the
// resolved coaches via context and only calls buildVoiceSignature on them.
//
// AP #36: destructure `error` and throw before trusting `data`.
// AP #37 exception: team_staff is FK-scoped via team_id → teams.org_id (no
// org_id column), so no .eq('org_id') on that chain. The team-coach
// staff_profiles fetch is keyed by the team_staff user_ids (.in('user_id'))
// — there is no FK between team_staff and staff_profiles, so a PostgREST
// embed cannot be used; the join is done in JS by user_id.

const PROGRAM_DIRECTOR_TITLE = 'Program Director';

// Order: head_coach before assistant before anything else, then by name.
function roleRank(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'head_coach') return 0;
  if (r === 'assistant_coach' || r === 'assistant') return 1;
  return 2;
}

// Returns [{ user_id, display_name, title, phone }] in signature order:
// org Program Director(s) first, then each team's coaches (head before
// assistant), deduped by user_id across both halves and across teams.
export async function fetchSignatureCoaches(supabase, orgId, teamIds) {
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  if (!orgId) return [];
  const ids = (Array.isArray(teamIds) ? teamIds : [teamIds]).filter(Boolean);

  // Org-level program leadership (Frank). Org-scoped table → org_id first.
  const { data: pdData, error: pdErr } = await supabase
    .from('staff_profiles')
    .select('user_id, display_name, title, phone')
    .eq('org_id', orgId)
    .eq('title', PROGRAM_DIRECTOR_TITLE)
    .not('display_name', 'is', null);
  if (pdErr) throw pdErr;

  // Team coaches (Kenny; Darien once on 9U/8U team_staff). FK-scoped via
  // team_id → teams.org_id, so no org_id filter on this chain (AP #37).
  // staff_profiles has NO FK from team_staff — a PostgREST embed throws
  // "Could not find a relationship". Fetch team_staff + staff_profiles
  // separately and join by user_id in JS (mirrors familyGuideCoaches).
  let teamRows = [];
  if (ids.length) {
    const { data: tsData, error: tsErr } = await supabase
      .from('team_staff')
      .select('user_id, role, team_id')
      .in('team_id', ids);
    if (tsErr) throw tsErr;
    const tsRows = tsData || [];
    const userIds = [...new Set(tsRows.map((r) => r.user_id).filter(Boolean))];
    let profByUser = new Map();
    if (userIds.length) {
      const { data: spData, error: spErr } = await supabase
        .from('staff_profiles')
        .select('user_id, display_name, title, phone')
        .in('user_id', userIds);
      if (spErr) throw spErr;
      profByUser = new Map((spData || []).map((p) => [p.user_id, p]));
    }
    teamRows = tsRows
      .map((r) => ({ ...r, profile: profByUser.get(r.user_id) || null }))
      .filter((r) => r.profile?.display_name)
      .sort((a, b) => {
        const rd = roleRank(a.role) - roleRank(b.role);
        if (rd !== 0) return rd;
        return (a.profile.display_name || '').localeCompare(b.profile.display_name || '');
      })
      .map((r) => ({
        user_id: r.user_id,
        display_name: r.profile.display_name,
        title: r.profile.title || '',
        phone: r.profile.phone || '',
      }));
  }

  const ordered = [...(pdData || []).map((p) => ({ ...p, title: p.title || '', phone: p.phone || '' })), ...teamRows];
  const seen = new Set();
  const out = [];
  for (const c of ordered) {
    if (c.user_id && seen.has(c.user_id)) continue;
    if (c.user_id) seen.add(c.user_id);
    out.push(c);
  }
  return out;
}
