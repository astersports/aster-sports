// Wave 4.2-A-1 contract tests for the resolver pair. Locks the
// invariants every resolver in 4.2-A must satisfy:
//   1. Pure (resolver) -- same input, same output
//   2. Pure (compose) -- same context+slice, same output
//   3. Slice ordering -- guardian_id ASC, stable under input perm
//   4. Time-injectable -- options.now drives only time-dependent diffs
//   5. No fabrication -- null location/coach renders graceful, not made up

import { describe, expect, it } from 'vitest';
import { composeWeeklyDigest, resolveWeeklyDigest } from '../weeklyDigest';
import { mockClient } from './mockSupabase';
import events from './fixtures/weekly_digest_may_11_17/events.json';
import tournaments from './fixtures/weekly_digest_may_11_17/tournaments.json';
import event_rsvps from './fixtures/weekly_digest_may_11_17/event_rsvps.json';
import recipients from './fixtures/weekly_digest_may_11_17/recipients.json';
import coaches from './fixtures/weekly_digest_may_11_17/coaches.json';
import organization from './fixtures/weekly_digest_may_11_17/organization.json';
import player_guardians from './fixtures/weekly_digest_may_11_17/player_guardians.json';

const ORG_ID = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
const PERIOD = { start: new Date('2026-05-11T04:00:00Z'), end: new Date('2026-05-17T04:00:00Z') };
const NOW = new Date('2026-05-09T14:13:44Z');
const FIXTURES = { events, tournaments, event_rsvps, recipients, coaches, organization, player_guardians };
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('resolver contract — wave 4.2-A-1', () => {
  it('1. resolver is pure: identical inputs produce deeply-equal outputs', async () => {
    const a = await resolveWeeklyDigest({ orgId: ORG_ID, period: PERIOD, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: NOW });
    const b = await resolveWeeklyDigest({ orgId: ORG_ID, period: PERIOD, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(norm(a)).toEqual(norm(b));
  });

  it('2. compose is pure: same context+slice -> same content_sections', async () => {
    const { context, slices } = await resolveWeeklyDigest({ orgId: ORG_ID, period: PERIOD, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: NOW });
    const a = composeWeeklyDigest(context, slices[0]);
    const b = composeWeeklyDigest(context, slices[0]);
    expect(norm(a)).toEqual(norm(b));
  });

  it('3. slice ordering: guardian_id ASC, stable under input permutation', async () => {
    const reversed = { ...FIXTURES, recipients: [...recipients].reverse() };
    const { slices } = await resolveWeeklyDigest({ orgId: ORG_ID, period: PERIOD, pilotOnly: true }, { supabase: mockClient(reversed), now: NOW });
    expect(slices.map((s) => s.guardian_id)).toEqual([
      '8de4a7b8-d795-4179-a66e-476d947b642a',
      '9659f2bb-2a53-4e37-ba5b-29e5b6bd1c96',
    ]);
  });

  it('4. time-injectable: options.now does not change output today (period label is the only time-dependent field; both `now` values fall before period)', async () => {
    const earlier = new Date('2026-05-08T10:00:00Z');
    const later = new Date('2026-05-10T22:00:00Z');
    const a = await resolveWeeklyDigest({ orgId: ORG_ID, period: PERIOD, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: earlier });
    const b = await resolveWeeklyDigest({ orgId: ORG_ID, period: PERIOD, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: later });
    // period.label is computed from PERIOD bounds, not now -> identical.
    // Schedule "next tournament" copy is also period-bound, not now-bound.
    // Allowed-to-vary fields today: NONE. If a future composer field
    // takes a now-relative branch (e.g. "X days out"), this test will
    // surface it via this assert and the allowed-vary set extends.
    expect(norm(a.context.period.label)).toEqual(norm(b.context.period.label));
    expect(norm(a.slices)).toEqual(norm(b.slices));
    expect(norm(a.context.events)).toEqual(norm(b.context.events));
  });

  // Wave 4.3-K — audience anchor enforcement at compose time.
  it('6. composeWeeklyDigest with overrides.audience_team_ids intersects slice.team_ids', () => {
    // Slice claims two teams (multi-team family). Audience anchored to one
    // of them. Body must scope events to the anchor team only.
    const context = {
      org: { id: 'o-1', name: 'X', branding: {}, coaches: [] },
      period: { start: new Date(), end: new Date(), label: 'May 11-17' },
      events: [
        { id: 'e1', team_id: 't-11u', start_at: '2026-05-13T22:00:00Z' },
        { id: 'e2', team_id: 't-8u', start_at: '2026-05-13T22:00:00Z' },
      ],
      teams: [{ id: 't-11u', name: '11U Girls' }, { id: 't-8u', name: '8U Boys' }],
      tournaments: [], rsvpCountsByEvent: new Map(),
    };
    const slice = { kind: 'family', guardian_id: 'g1', email: 'g@x', kid_first_names: [], team_ids: ['t-11u', 't-8u'] };
    const out = composeWeeklyDigest(context, slice, { audience_team_ids: ['t-11u'] });
    const flat = JSON.stringify(out.content_sections);
    // 11U Girls event renders; 8U Boys event does not.
    expect(flat).toContain('11U Girls');
    expect(flat).not.toContain('8U Boys');
  });

  it('7. composeWeeklyDigest with overrides.audience_team_ids null falls back to slice.team_ids (org_all behavior)', () => {
    const context = {
      org: { id: 'o-1', name: 'X', branding: {}, coaches: [] },
      period: { start: new Date(), end: new Date(), label: 'May 11-17' },
      events: [
        { id: 'e1', team_id: 't-11u', start_at: '2026-05-13T22:00:00Z' },
        { id: 'e2', team_id: 't-8u', start_at: '2026-05-13T22:00:00Z' },
      ],
      teams: [{ id: 't-11u', name: '11U Girls' }, { id: 't-8u', name: '8U Boys' }],
      tournaments: [], rsvpCountsByEvent: new Map(),
    };
    const slice = { kind: 'family', guardian_id: 'g1', email: 'g@x', kid_first_names: [], team_ids: ['t-11u', 't-8u'] };
    const out = composeWeeklyDigest(context, slice);
    const flat = JSON.stringify(out.content_sections);
    expect(flat).toContain('11U Girls');
    expect(flat).toContain('8U Boys');
  });

  it('5. no fabrication: null location.name -> "Location TBD"; missing coach phone -> coach omitted from signoff', async () => {
    // Use 11U Girls Mon practice (index 2) so it lands in Stephanie's slice
    const fixturesNoFab = {
      ...FIXTURES,
      events: events.map((e, i) => i === 2
        ? { ...e, location: null, locations: { ...e.locations, name: null } }
        : e),
      coaches: [
        ...coaches,
        { display_name: 'Phantom Coach', title: 'Imaginary', phone: null },
      ],
    };
    const { context, slices } = await resolveWeeklyDigest({ orgId: ORG_ID, period: PERIOD, pilotOnly: true }, { supabase: mockClient(fixturesNoFab), now: NOW });
    const { content_sections } = composeWeeklyDigest(context, slices[0]);
    const flat = JSON.stringify(content_sections);
    expect(flat).toContain('Location TBD');
    expect(flat).not.toContain('Phantom Coach');
  });
});
