// Wave 5 PR 4a (cutover wave) — `coach_roundup` resolver + composer
// SKELETON. Per docs/CUTOVER_WAVE_GAP_AUDIT.md §5.3: a coach who
// runs multiple teams gets one weekly briefing showing all their
// teams' upcoming games on one canvas (multi-team header,
// per-team-color game rows, conflict callouts when two teams have
// overlapping start times).
//
// 4a ships the discoverability wire: schema migration (#wave5_pr4a)
// extends the three kind_check constraints, RESOLVER_REGISTRY gets
// an entry, kindMetadata lists it in the picker. Resolver here
// returns a placeholder body so the wizard end-to-end smoke passes.
// 4b replaces this with the real multi-team aggregation. 4c lands
// the rich Body component (coach picker + date range).
//
// Two-stage contract (locked across wave 4.2-A):
//   resolveCoachRoundup({ coachUserId, dateRange }, options)
//     -> { context, slices }
//   composeCoachRoundup(context, slice, overrides)
//     -> { subject, content_sections }

export async function resolveCoachRoundup({ coachUserId, dateRange }, { supabase } = {}) {
  if (!coachUserId) throw new Error('Missing coachUserId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');

  // 4a stub: minimal context fetch so the resolver pipeline doesn't
  // throw on a missing coach. 4b will walk team_staff → teams →
  // events for the date range and aggregate.
  const { data: coach, error: coachErr } = await supabase.from('staff_profiles')
    .select('user_id, display_name, org_id, phone, title').eq('user_id', coachUserId).maybeSingle();
  if (coachErr) throw coachErr;
  if (!coach) throw new Error(`Coach ${coachUserId} not found in staff_profiles`);

  return {
    context: { coach, dateRange: dateRange || null, teams: [], events_by_team: {} },
    // Single slice: the coach themselves is the audience anchor. 4b
    // may introduce per-team slices if the briefing fans out per-team
    // (TBD design call); for now the briefing renders as one document.
    slices: [{ recipient_user_id: coach.user_id, coach_name: coach.display_name }],
  };
}

export function composeCoachRoundup(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  // 4a stub: returns a single placeholder section so an admin who
  // selects this kind in the picker sees a coherent (if minimal)
  // preview. Real section emission lands in 4b once the section
  // renderers ship.
  void overrides;
  return {
    subject: `Coach Roundup — ${slice.coach_name || 'Coach'}`,
    content_sections: [
      {
        kind: 'ops_notes',
        title: 'COACH ROUNDUP (PREVIEW)',
        items: [
          `Coach: ${slice.coach_name || 'TBD'}`,
          'Multi-team aggregation lands in PR 4b.',
          'Per-team color rows + conflict callouts ship in PR 4b.',
        ],
      },
    ],
  };
}
