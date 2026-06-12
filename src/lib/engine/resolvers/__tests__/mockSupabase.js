// Test-only mock for the Supabase client used by resolveWeeklyDigest.
// Each fixture maps to a table or RPC name. Chainable methods (eq, neq,
// gte, lt, in, not, order, select) all return the same chain so the
// resolver's PostgREST builder calls don't need to be intercepted
// individually -- the chain is thenable and resolves to {data, error}.
//
// Keep this thin: we don't simulate filter semantics. Fixtures must
// already be pre-shaped to what the resolver expects after PostgREST
// would have filtered.

function mockChain(rows, opts = {}) {
  // Thin filter awareness ONLY for the predicates fetchSignatureCoaches
  // depends on: title= (staff_profiles WHERE title='Program Director')
  // resolves to the PD subset; in('team_id', [...]) (team_staff scoped to a
  // slice's team) resolves to that team's coaches; in('user_id', [...])
  // (staff_profiles fetched by the team_staff user_ids — the JS-join half of
  // fetchSignatureCoaches, since there is NO FK between team_staff and
  // staff_profiles to embed) resolves to those coaches' profiles. All three
  // are narrowly column-gated so every other .eq()/.in() stays
  // filter-agnostic per the mock's "fixtures are pre-shaped" doctrine (e.g.
  // .in('id', eventIds) still returns the whole fixture).
  //
  // `opts.byUserId` (staff_profiles only): a SEPARATE dataset the
  // `.in('user_id', [...])` lookup resolves against — the union of
  // coaches.json + the per-team coach profiles. This models reality where a
  // team's assistant (Darien on 9U/8U) is resolvable by user_id for the
  // team-aware SIGNATURE while the org-wide CONTACT-block query (coaches.json)
  // legitimately differs. Pre-fix this came free via the PostgREST embed;
  // post-fix the JS-join needs the profile from the staff_profiles table.
  let current = rows;
  const settle = () => Promise.resolve({ data: current, error: null });
  const chain = {
    select: () => chain,
    eq: (col, val) => { if (col === 'title') current = (current || []).filter((r) => r.title === val); return chain; },
    neq: () => chain,
    gte: () => chain,
    lt: () => chain,
    in: (col, vals) => {
      if (col === 'team_id') { const set = new Set(vals || []); current = (current || []).filter((r) => set.has(r.team_id)); }
      else if (col === 'user_id') {
        const set = new Set(vals || []);
        const source = opts.byUserId || current;
        current = (source || []).filter((r) => set.has(r.user_id));
      }
      return chain;
    },
    not: () => chain,
    order: () => chain,
    maybeSingle: () => Promise.resolve({ data: (current || [])[0] || null, error: null }),
    then: (onF, onR) => settle().then(onF, onR),
    catch: (onR) => settle().catch(onR),
  };
  return chain;
}

export function mockClient(fixtures) {
  // Single-event resolvers (game_recap) use `event`, `game_result`,
  // `player_of_game`, `tournament` (singular). Plural is for
  // weekly_digest's multi-event scope. Both shapes are accepted so
  // the mock serves both wave-1 and wave-2-A-2 tests.
  // tournament_prelim adds `tournament_teams` + `locations` (plural)
  // for multi-team / multi-location queries.
  const eventsArr = fixtures.events || (fixtures.event ? [fixtures.event] : []);
  const tournamentsArr = fixtures.tournaments || (fixtures.tournament && fixtures.tournament.id ? [fixtures.tournament] : []);
  const locationsArr = fixtures.locations || (fixtures.location ? [fixtures.location] : []);
  const teamStaffArr = fixtures.team_staff || [];
  // staff_profiles resolvable BY USER ID = org-wide coaches.json UNION the
  // per-team coach profiles carried on team_staff fixtures (nested
  // `staff_profiles`). Deduped by user_id. fetchSignatureCoaches resolves the
  // team-aware signature against this set (.in('user_id', [...])) while the
  // org-wide CONTACT block keeps reading coaches.json (`fixtures.coaches`).
  const staffByUserId = (() => {
    const byId = new Map();
    for (const c of fixtures.coaches || []) if (c.user_id) byId.set(c.user_id, c);
    for (const ts of teamStaffArr) {
      const p = ts.staff_profiles;
      if (p?.user_id && !byId.has(p.user_id)) byId.set(p.user_id, p);
    }
    return [...byId.values()];
  })();
  const tables = {
    events: eventsArr,
    tournaments: tournamentsArr,
    tournament_teams: fixtures.tournament_teams || [],
    locations: locationsArr,
    event_rsvps: fixtures.event_rsvps || [],
    event_change_audit: fixtures.event_change_audit || [],
    team_players: fixtures.team_players || [],
    staff_profiles: fixtures.coaches || [],
    team_staff: teamStaffArr,
    organizations: fixtures.organization ? [fixtures.organization] : [],
    organization_settings: fixtures.organization_settings ? [fixtures.organization_settings] : [],
    player_guardians: fixtures.player_guardians || [],
    player_activations: fixtures.player_activations || [],
    game_results: fixtures.game_result ? [fixtures.game_result] : (fixtures.game_results || []),
    players: fixtures.player_of_game ? [fixtures.player_of_game] : (fixtures.player ? [fixtures.player] : (fixtures.players || [])),
  };
  return {
    from(table) {
      const opts = table === 'staff_profiles' ? { byUserId: staffByUserId } : {};
      return mockChain(tables[table] || [], opts);
    },
    rpc(name, args) {
      if (name === 'get_digest_recipients') {
        const all = fixtures.recipients || [];
        const filtered = args?.p_pilot_only ? all.filter((r) => r.is_pilot_family) : all;
        return Promise.resolve({ data: filtered, error: null });
      }
      return Promise.resolve({ data: [], error: null });
    },
  };
}
