// Wave 5 PR 5c — family_guide resolver + composer contract.
// Mocks supabase with the full join chain so the real aggregation
// + cross-kid conflict detection are exercised.

import { describe, expect, it } from 'vitest';
import { composeFamilyGuide, resolveFamilyGuide } from '../familyGuide';
import { renderFooter } from '../../renderers/footer';
import { detectConflicts, formatDateRange, groupEventsByKid, summarizeEventKinds } from '../familyGuideHelpers';

function mockSb({ parent = null, pgRows = [], tpRows = [], events = [], coaches = [], teamStaff = [], org = null, orgSettings = null, rpcRows = [] }) {
  return {
    rpc() { return Promise.resolve({ data: rpcRows, error: null }); },
    from(table) {
      const b = {
        _t: table, select() { return this; }, eq() { return this; }, in() { return this; },
        gte() { return this; }, lte() { return this; }, not() { return this; },
        async maybeSingle() {
          if (this._t === 'guardians') return { data: parent, error: null };
          if (this._t === 'organizations') return { data: org, error: null };
          if (this._t === 'organization_settings') return { data: orgSettings, error: null };
          return { data: null, error: null };
        },
        then(resolve) {
          const map = { player_guardians: pgRows, team_players: tpRows, events, staff_profiles: coaches, team_staff: teamStaff };
          return Promise.resolve({ data: map[this._t] ?? [], error: null }).then(resolve);
        },
      };
      return b;
    },
  };
}

const PARENT = { id: 'g1', user_id: 'u1', first_name: 'Frank', last_name: 'S', email: 'frank@ex.com', org_id: 'org-1' };
const KID = (id, name) => ({ player_id: id, players: { id, first_name: name, last_name: 'S' } });
const TEAM = (pid, tid, name, color, sort) => ({ player_id: pid, team_id: tid, teams: { id: tid, name, team_color: color, sort_order: sort } });

describe('resolveFamilyGuide', () => {
  it('throws when parentUserId is missing', async () => {
    await expect(resolveFamilyGuide({}, { supabase: mockSb({}) })).rejects.toThrow(/Missing parentUserId/);
  });
  it('throws when parent not in guardians', async () => {
    await expect(resolveFamilyGuide({ parentUserId: 'u1' }, { supabase: mockSb({ parent: null }) })).rejects.toThrow(/Parent u1 not found/);
  });
  it('returns empty kidsWithEvents when no kids', async () => {
    const r = await resolveFamilyGuide({ parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' } }, { supabase: mockSb({ parent: PARENT, pgRows: [] }) });
    expect(r.context.kidsWithEvents).toEqual([]);
    expect(r.context.conflicts).toEqual([]);
  });
  it('returns slice with kind=single_recipient + parent email + guardian_id (A.1.a fix — PR 5 actor send unblock)', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' }, pilotOnly: false },
      { supabase: mockSb({ parent: PARENT }) },
    );
    expect(r.slices).toHaveLength(1);
    expect(r.slices[0]).toMatchObject({
      kind: 'single_recipient',
      guardian_id: 'g1',
      email: 'frank@ex.com',
      parent_name: 'Frank',
    });
  });

  // D-5(a): pilot gate routes through get_digest_recipients (the RPC owns the
  // allowlist), not the bare is_pilot_family field. Allowed iff the parent's
  // guardian_id is in the RPC rows. Under redirect mode the RPC returns
  // synthetic NULL-guardian rows -> empty allowlist -> skip.
  it('pilot gate: blocks (empty slices) when pilot mode on and parent not in the RPC allowlist', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' } },
      { supabase: mockSb({ parent: PARENT, orgSettings: { pilot_mode_enabled: true }, rpcRows: [{ guardian_id: null }] }) },
    );
    expect(r.slices).toEqual([]);
  });
  it('pilot gate: allows when pilot mode on and the parent guardian_id is in the RPC allowlist', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' } },
      { supabase: mockSb({ parent: PARENT, orgSettings: { pilot_mode_enabled: true }, rpcRows: [{ guardian_id: 'g1' }] }) },
    );
    expect(r.slices).toHaveLength(1);
  });
  it('pilot gate: explicit pilotOnly=false bypasses the RPC and allows', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' }, pilotOnly: false },
      { supabase: mockSb({ parent: PARENT, orgSettings: { pilot_mode_enabled: true }, rpcRows: [] }) },
    );
    expect(r.slices).toHaveLength(1);
  });

  it('aggregates events per kid×team', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' }, pilotOnly: false },
      { supabase: mockSb({
        parent: PARENT,
        pgRows: [KID('p-1', 'Charlie'), KID('p-2', 'Milo')],
        tpRows: [TEAM('p-1', 't-1', '11U Girls', '#a78bfa', 1), TEAM('p-2', 't-2', '8U Boys', '#f59e0b', 5)],
        events: [
          { id: 'e1', team_id: 't-1', start_at: '2026-05-18T15:00:00Z' },
          { id: 'e2', team_id: 't-2', start_at: '2026-05-18T20:00:00Z' },
        ],
      }) },
    );
    expect(r.context.kidsWithEvents).toHaveLength(2);
    expect(r.context.kidsWithEvents[0].first_name).toBe('Charlie');
    expect(r.context.kidsWithEvents[0].events).toHaveLength(1);
  });
});

describe('resolveFamilyGuide — coaches block (team-grouped, deduped)', () => {
  const TS = (tid, name, sort, uid) => ({ team_id: tid, user_id: uid, teams: { name, sort_order: sort } });
  const SP = (uid, name, title, phone) => ({ user_id: uid, display_name: name, title, phone });

  it('a parent with kids on 9U + 10U gets both teams’ coaches, grouped + phones rendered', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' }, pilotOnly: false },
      { supabase: mockSb({
        parent: PARENT,
        pgRows: [KID('p-1', 'Charlie'), KID('p-2', 'Milo')],
        tpRows: [TEAM('p-1', 't-9u', '9U Boys', '#4a8fd4', 4), TEAM('p-2', 't-10b', '10U Black', '#1a1a1a', 2)],
        teamStaff: [TS('t-9u', '9U Boys', 4, 'c-kenny'), TS('t-10b', '10U Black', 2, 'c-kenny'), TS('t-10b', '10U Black', 2, 'c-darien')],
        coaches: [SP('c-kenny', 'Coach Kenny', 'Coaching Director', '(516) 644-0208'), SP('c-darien', 'Coach Darien', 'Assistant Coach', '(914) 555-0190')],
      }) },
    );
    const tc = r.context.teamCoaches;
    // sort_order ascending → 10U Black (2) before 9U Boys (4)
    expect(tc.map((g) => g.team_name)).toEqual(['10U Black', '9U Boys']);
    expect(tc[0].coaches.map((c) => c.display_name)).toEqual(['Coach Kenny', 'Coach Darien']);
    expect(tc[1].coaches.map((c) => c.display_name)).toEqual(['Coach Kenny']);
    expect(tc[0].coaches[0].phone).toBe('(516) 644-0208');
  });

  it('two kids on the SAME team → that team’s coaches appear once (deduped across kids)', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' }, pilotOnly: false },
      { supabase: mockSb({
        parent: PARENT,
        pgRows: [KID('p-1', 'A'), KID('p-2', 'B')],
        tpRows: [TEAM('p-1', 't-9u', '9U Boys', '#4a8fd4', 4), TEAM('p-2', 't-9u', '9U Boys', '#4a8fd4', 4)],
        teamStaff: [TS('t-9u', '9U Boys', 4, 'c-kenny')],
        coaches: [SP('c-kenny', 'Coach Kenny', 'Coaching Director', '(516) 644-0208')],
      }) },
    );
    expect(r.context.teamCoaches).toHaveLength(1);
    expect(r.context.teamCoaches[0].coaches).toHaveLength(1);
    // signoff list is the flattened, distinct-name list
    expect(r.context.coaches).toEqual([{ display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' }]);
  });

  it('coaches with no phone (or no staff_profile) are dropped — no fabrication (AP #27)', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' }, pilotOnly: false },
      { supabase: mockSb({
        parent: PARENT,
        pgRows: [KID('p-1', 'A')],
        tpRows: [TEAM('p-1', 't-9u', '9U Boys', '#4a8fd4', 4)],
        teamStaff: [TS('t-9u', '9U Boys', 4, 'c-kenny'), TS('t-9u', '9U Boys', 4, 'c-nophone'), TS('t-9u', '9U Boys', 4, 'c-noprofile')],
        coaches: [SP('c-kenny', 'Coach Kenny', 'Coaching Director', '(516) 644-0208'), SP('c-nophone', 'Coach NoPhone', 'Helper', null)],
      }) },
    );
    expect(r.context.teamCoaches).toHaveLength(1);
    expect(r.context.teamCoaches[0].coaches.map((c) => c.display_name)).toEqual(['Coach Kenny']);
  });

  it('no teams → empty teamCoaches + coaches (graceful omit)', async () => {
    const r = await resolveFamilyGuide(
      { parentUserId: 'u1', dateRange: { start: '2026-05-18', end: '2026-05-24' } },
      { supabase: mockSb({ parent: PARENT, pgRows: [] }) },
    );
    expect(r.context.teamCoaches).toEqual([]);
    expect(r.context.coaches).toEqual([]);
  });
});

describe('composeFamilyGuide — coaches_block placement + omit', () => {
  const TC = [
    { team_name: '10U Black', coaches: [{ display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' }] },
    { team_name: '9U Boys', coaches: [{ display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' }] },
  ];
  const baseCtx = (over) => ({
    parent: PARENT,
    kidsWithEvents: [{ player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '9U Boys', team_color: '#4a8fd4', events: [{ start_at: '2026-05-18T15:00:00Z' }] }],
    conflicts: [], dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], teamCoaches: [], orgName: 'LH', ...over,
  });

  it('coaches_block is OFF by default and renders (after nav, before footer) only on contact opt-in', () => {
    // Default: contact toggle off → no coaches_block (no coach phones leak).
    const off = composeFamilyGuide(baseCtx({ teamCoaches: TC, coaches: TC[0].coaches }), { parent_name: 'Frank' });
    const offKinds = off.content_sections.map((s) => s.kind);
    expect(offKinds.indexOf('coaches_block')).toBe(-1);
    expect(offKinds.indexOf('signoff')).toBe(-1);
    // Opt-in: coaches_block appears after quick_link_nav and before the footer.
    const on = composeFamilyGuide(baseCtx({ teamCoaches: TC, coaches: TC[0].coaches }), { parent_name: 'Frank' }, { signoff_enabled: true });
    const kinds = on.content_sections.map((s) => s.kind);
    const navIdx = kinds.indexOf('quick_link_nav');
    const blockIdx = kinds.indexOf('coaches_block');
    expect(blockIdx).toBeGreaterThan(navIdx);
    expect(blockIdx).toBeLessThan(kinds.length - 1);
  });

  it('coaches_block carries per-team groups with phones (on opt-in)', () => {
    const out = composeFamilyGuide(baseCtx({ teamCoaches: TC, coaches: TC[0].coaches }), { parent_name: 'Frank' }, { signoff_enabled: true });
    const block = out.content_sections.find((s) => s.kind === 'coaches_block');
    expect(block.teams.map((t) => t.team_name)).toEqual(['10U Black', '9U Boys']);
    expect(block.teams[0].coaches[0].phone).toBe('(516) 644-0208');
  });

  it('omits coaches_block when no team has coaches (graceful, AP #27), even on opt-in', () => {
    const out = composeFamilyGuide(baseCtx({ teamCoaches: [] }), { parent_name: 'Frank' }, { signoff_enabled: true });
    expect(out.content_sections.some((s) => s.kind === 'coaches_block')).toBe(false);
  });

  it('AP #38 parity: coaches_block kind has a registered SECTION_RENDERERS handler', async () => {
    const { SECTION_RENDERERS } = await import('../../sectionRenderers');
    expect(typeof SECTION_RENDERERS.coaches_block).toBe('function');
  });
});

describe('composeFamilyGuide', () => {
  it('throws on missing context or slice', () => {
    expect(() => composeFamilyGuide(null, {})).toThrow();
    expect(() => composeFamilyGuide({}, null)).toThrow();
  });
  it('emits vip_header → kid_color_pill → quick_link_nav → footer (Decision 2: full footer w/ unsubscribe, not brand_footer)', () => {
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [{ player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00-04:00' }] }],
      conflicts: [], dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'Aster AAU',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    const kinds = out.content_sections.map((s) => s.kind);
    expect(kinds[0]).toBe('vip_header');
    expect(kinds).toContain('kid_color_pill');
    expect(kinds).toContain('quick_link_nav');
    expect(kinds[kinds.length - 1]).toBe('footer');
  });
  it('family_guide footer carries an unsubscribe link (Decision 2 / CAN-SPAM — parent-facing)', () => {
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [{ player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00-04:00' }] }],
      conflicts: [], dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'Aster AAU',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    const footer = out.content_sections.find((s) => s.kind === 'footer');
    expect(footer).toBeTruthy();
    expect(footer.contactEmail).toBeTruthy();
    // renderFooter emits the {{UNSUBSCRIBE_URL}} block (substituted per-recipient by
    // queueComposedMessages.applyUnsubscribeUrls) — the brand_footer it replaced did not.
    const rendered = renderFooter(footer);
    expect(rendered.html).toContain('{{UNSUBSCRIBE_URL}}');
    expect(rendered.html).toContain('Unsubscribe');
  });
  it('emits conflict_callout immediately after vip_header when conflicts exist (PR 5b-3)', () => {
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [
        { player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00Z' }] },
        { player_id: 'p-2', first_name: 'Milo', team_id: 't-2', team_name: '8U Boys', team_color: '#f59e0b', events: [{ start_at: '2026-05-18T15:30:00Z' }] },
      ],
      conflicts: [{ date_label: 'MON 5/18', kid_a: 'Charlie', team_a: '11U Girls', time_a: '11:00 AM', kid_b: 'Milo', team_b: '8U Boys', time_b: '11:30 AM' }],
      dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'LH',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    const kinds = out.content_sections.map((s) => s.kind);
    expect(kinds[0]).toBe('vip_header');
    expect(kinds[1]).toBe('conflict_callout');
    const callout = out.content_sections.find((s) => s.kind === 'conflict_callout');
    expect(callout.items).toEqual(ctx.conflicts);
  });
  it('omits conflict_callout when conflicts is empty (PR 5b-3)', () => {
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [{ player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00Z' }] }],
      conflicts: [], dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'LH',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    expect(out.content_sections.some((s) => s.kind === 'conflict_callout')).toBe(false);
  });
  it('vip_header conflict_count agrees with conflict_callout.items.length (cross-surface invariant per #43)', () => {
    const conflicts = [
      { date_label: 'MON 5/18', kid_a: 'Charlie', team_a: '11U Girls', time_a: '11:00 AM', kid_b: 'Milo', team_b: '8U Boys', time_b: '11:30 AM' },
      { date_label: 'WED 5/20', kid_a: 'Charlie', team_a: '11U Girls', time_a: '6:00 PM', kid_b: 'Milo', team_b: '8U Boys', time_b: '6:30 PM' },
    ];
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [
        { player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [] },
        { player_id: 'p-2', first_name: 'Milo', team_id: 't-2', team_name: '8U Boys', team_color: '#f59e0b', events: [] },
      ],
      conflicts, dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'LH',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    const vipHeader = out.content_sections.find((s) => s.kind === 'vip_header');
    const callout = out.content_sections.find((s) => s.kind === 'conflict_callout');
    expect(vipHeader.conflict_count).toBe(2);
    expect(callout.items.length).toBe(2);
    expect(vipHeader.conflict_count).toBe(callout.items.length);
  });
  it('emits color_striped_row per event after each kid_color_pill (PR 5b-2)', () => {
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [
        { player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [
          { start_at: '2026-05-20T22:30:00Z', opponent: null, location: 'WCC', title: 'Practice' },
          { start_at: '2026-05-23T19:30:00Z', opponent: 'Greenwich Hawks', location: 'Home Gym', sub_location: 'Court A', title: 'Game' },
        ] },
        { player_id: 'p-2', first_name: 'Milo', team_id: 't-2', team_name: '8U Boys', team_color: '#f59e0b', events: [
          { start_at: '2026-05-19T21:30:00Z', opponent: null, location: 'Trustees Gym', title: 'Practice' },
        ] },
      ],
      conflicts: [], dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'LH',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    const kinds = out.content_sections.map((s) => s.kind);
    // Expected order: vip_header, kid_color_pill (Charlie), 2 rows, kid_color_pill (Milo), 1 row, quick_link_nav, footer
    expect(kinds.filter((k) => k === 'color_striped_row')).toHaveLength(3);
    const charlieIdx = kinds.indexOf('kid_color_pill');
    expect(kinds[charlieIdx + 1]).toBe('color_striped_row');
    expect(kinds[charlieIdx + 2]).toBe('color_striped_row');
    expect(kinds[charlieIdx + 3]).toBe('kid_color_pill'); // Milo's pill
    expect(kinds[charlieIdx + 4]).toBe('color_striped_row'); // Milo's one row
  });
  it('color_striped_row primary uses "vs <opponent>" for games and event.title for practices (PR 5b-2)', () => {
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [
        { player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [
          { start_at: '2026-05-20T22:30:00Z', opponent: null, location: 'WCC', title: '11U Girls Practice' },
          { start_at: '2026-05-23T19:30:00Z', opponent: 'Greenwich Hawks', location: 'WCC', title: '11U Girls Game' },
        ] },
      ],
      conflicts: [], dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'LH',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    const rows = out.content_sections.filter((s) => s.kind === 'color_striped_row');
    expect(rows[0].primary).toBe('11U Girls Practice'); // no opponent → title
    expect(rows[1].primary).toBe('vs Greenwich Hawks'); // has opponent → "vs X"
  });
  it('cross-surface invariant per #43: vip_header.event_count === sum of color_striped_row counts (PR 5b-2)', () => {
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [
        { player_id: 'p-1', first_name: 'Charlie', team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [
          { start_at: '2026-05-20T22:30:00Z' }, { start_at: '2026-05-22T22:30:00Z' }, { start_at: '2026-05-23T22:30:00Z' },
        ] },
        { player_id: 'p-2', first_name: 'Milo', team_id: 't-2', team_name: '8U Boys', team_color: '#f59e0b', events: [
          { start_at: '2026-05-19T21:30:00Z' }, { start_at: '2026-05-26T21:30:00Z' },
        ] },
      ],
      conflicts: [], dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'LH',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    const vipHeader = out.content_sections.find((s) => s.kind === 'vip_header');
    const rowCount = out.content_sections.filter((s) => s.kind === 'color_striped_row').length;
    expect(vipHeader.event_count).toBe(5);
    expect(rowCount).toBe(5);
    expect(vipHeader.event_count).toBe(rowCount);
  });
  it('quick_link_nav items carry url to /teams/<team_id> when team_id present (PR 5b-2)', () => {
    const ctx = {
      parent: PARENT,
      kidsWithEvents: [
        { player_id: 'p-1', first_name: 'Charlie', team_id: 'team-abc', team_name: '11U Girls', team_color: '#a78bfa', events: [{ start_at: '2026-05-20T22:30:00Z' }] },
        { player_id: 'p-2', first_name: 'Milo', team_id: null, team_name: 'Unrostered', team_color: '#f59e0b', events: [{ start_at: '2026-05-19T21:30:00Z' }] },
      ],
      conflicts: [], dateRange: { start: '2026-05-18', end: '2026-05-24' }, coaches: [], orgName: 'LH',
    };
    const out = composeFamilyGuide(ctx, { parent_name: 'Frank' });
    const nav = out.content_sections.find((s) => s.kind === 'quick_link_nav');
    expect(nav.items[0].url).toBe('https://astersports.app/teams/team-abc');
    expect(nav.items[1].url).toBeNull();
  });
});

describe('familyGuideHelpers', () => {
  it('formatDateRange formats ISO date strings', () => {
    expect(formatDateRange({ start: '2026-05-18', end: '2026-05-24' })).toBe('5/18 – 5/24');
    expect(formatDateRange({})).toBe('');
  });
  it('groupEventsByKid splits kid×team blocks + sorts events', () => {
    const kids = [{ player_id: 'p-1', first_name: 'Charlie', teams: [{ team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', sort_order: 1 }] }];
    const events = [{ team_id: 't-1', start_at: '2026-05-20T15:00:00Z' }, { team_id: 't-1', start_at: '2026-05-18T15:00:00Z' }];
    const g = groupEventsByKid(kids, events);
    expect(g[0].events[0].start_at).toBe('2026-05-18T15:00:00Z');
  });
  it('detectConflicts flags same-day cross-kid overlaps', () => {
    const c = detectConflicts([
      { player_id: 'p-1', first_name: 'Charlie', team_name: '11U', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00Z', end_at: '2026-05-18T16:00:00Z' }] },
      { player_id: 'p-2', first_name: 'Milo', team_name: '8U', team_color: '#f59e0b', events: [{ start_at: '2026-05-18T15:30:00Z' }] },
    ]);
    expect(c).toHaveLength(1);
    expect(c[0].reason).toBe('overlap');
  });
  it('detectConflicts flags tight-travel gap < 30 min', () => {
    const c = detectConflicts([
      { player_id: 'p-1', first_name: 'Charlie', team_name: '11U', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00Z', end_at: '2026-05-18T16:00:00Z' }] },
      { player_id: 'p-2', first_name: 'Milo', team_name: '8U', team_color: '#f59e0b', events: [{ start_at: '2026-05-18T16:15:00Z' }] },
    ]);
    expect(c[0].reason).toBe('tight_travel');
  });
  it('summarizeEventKinds — all practices renders "N PRACTICES"', () => {
    expect(summarizeEventKinds([
      { event_type: 'practice' }, { event_type: 'practice' }, { event_type: 'practice' }, { event_type: 'practice' },
    ])).toBe('4 PRACTICES');
    expect(summarizeEventKinds([{ event_type: 'practice' }])).toBe('1 PRACTICE');
  });
  it('summarizeEventKinds — all games / tournament games render "N GAMES"', () => {
    expect(summarizeEventKinds([
      { event_type: 'game' }, { event_type: 'tournament' }, { event_type: 'game' },
    ])).toBe('3 GAMES');
    expect(summarizeEventKinds([{ event_type: 'game' }])).toBe('1 GAME');
  });
  it('summarizeEventKinds — mixed kinds render generic "N EVENTS"', () => {
    expect(summarizeEventKinds([
      { event_type: 'practice' }, { event_type: 'game' },
    ])).toBe('2 EVENTS');
    expect(summarizeEventKinds([{ event_type: 'practice' }, { event_type: 'tournament' }])).toBe('2 EVENTS');
  });
  it('summarizeEventKinds — unknown / missing event_type counts as generic EVENT bucket', () => {
    expect(summarizeEventKinds([{}])).toBe('1 EVENT');
    expect(summarizeEventKinds([{ event_type: 'practice' }, {}])).toBe('2 EVENTS');
  });
  it('summarizeEventKinds — empty list returns "NO EVENTS"', () => {
    expect(summarizeEventKinds([])).toBe('NO EVENTS');
    expect(summarizeEventKinds(null)).toBe('NO EVENTS');
    expect(summarizeEventKinds(undefined)).toBe('NO EVENTS');
  });
  it('detectConflicts skips same-kid + different-day', () => {
    const sameKid = detectConflicts([
      { player_id: 'p-1', first_name: 'C', team_name: '11U', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00Z', end_at: '2026-05-18T16:00:00Z' }, { start_at: '2026-05-18T15:30:00Z' }] },
    ]);
    const diffDay = detectConflicts([
      { player_id: 'p-1', first_name: 'C', team_name: '11U', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00Z', end_at: '2026-05-18T16:00:00Z' }] },
      { player_id: 'p-2', first_name: 'M', team_name: '8U', team_color: '#f59e0b', events: [{ start_at: '2026-05-19T15:00:00Z' }] },
    ]);
    expect(sameKid).toEqual([]);
    expect(diffDay).toEqual([]);
  });
});
