// Test-only mock for the Supabase client used by resolveWeeklyDigest.
// Each fixture maps to a table or RPC name. Chainable methods (eq, neq,
// gte, lt, in, not, order, select) all return the same chain so the
// resolver's PostgREST builder calls don't need to be intercepted
// individually -- the chain is thenable and resolves to {data, error}.
//
// Keep this thin: we don't simulate filter semantics. Fixtures must
// already be pre-shaped to what the resolver expects after PostgREST
// would have filtered.

function mockChain(rows) {
  const promise = Promise.resolve({ data: rows, error: null });
  const chain = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    gte: () => chain,
    lt: () => chain,
    in: () => chain,
    not: () => chain,
    order: () => chain,
    maybeSingle: () => Promise.resolve({ data: rows[0] || null, error: null }),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  return chain;
}

export function mockClient(fixtures) {
  // Single-event resolvers (game_recap) use `event`, `game_result`,
  // `player_of_game`, `tournament` (singular). Plural is for
  // weekly_digest's multi-event scope. Both shapes are accepted so
  // the mock serves both wave-1 and wave-2-A-2 tests.
  const eventsArr = fixtures.events || (fixtures.event ? [fixtures.event] : []);
  const tournamentsArr = fixtures.tournaments || (fixtures.tournament && fixtures.tournament.id ? [fixtures.tournament] : []);
  const tables = {
    events: eventsArr,
    tournaments: tournamentsArr,
    event_rsvps: fixtures.event_rsvps || [],
    staff_profiles: fixtures.coaches || [],
    organizations: fixtures.organization ? [fixtures.organization] : [],
    organization_settings: fixtures.organization_settings ? [fixtures.organization_settings] : [],
    player_guardians: fixtures.player_guardians || [],
    game_results: fixtures.game_result ? [fixtures.game_result] : (fixtures.game_results || []),
    players: fixtures.player_of_game ? [fixtures.player_of_game] : (fixtures.players || []),
  };
  return {
    from(table) { return mockChain(tables[table] || []); },
    rpc(name) {
      if (name === 'get_digest_recipients') return Promise.resolve({ data: fixtures.recipients || [], error: null });
      return Promise.resolve({ data: [], error: null });
    },
  };
}
