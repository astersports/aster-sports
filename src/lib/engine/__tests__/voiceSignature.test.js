import { describe, expect, it } from 'vitest';
import { buildVoiceSignature } from '../voiceSignature';
import { fetchSignatureCoaches } from '../resolvers/signatureCoaches';

describe('buildVoiceSignature — natural-list voice line', () => {
  it('empty -> empty string', () => {
    expect(buildVoiceSignature([])).toBe('');
    expect(buildVoiceSignature(null)).toBe('');
    expect(buildVoiceSignature(undefined)).toBe('');
  });
  it('one name -> bare name', () => {
    expect(buildVoiceSignature([{ display_name: 'Frank' }])).toBe('Frank');
  });
  it('two names -> "a & b" (no Darien team)', () => {
    expect(buildVoiceSignature([{ display_name: 'Frank' }, { display_name: 'Coach Kenny' }]))
      .toBe('Frank & Coach Kenny');
  });
  it('three names -> "a, b & c" (9U/8U with Darien)', () => {
    expect(buildVoiceSignature([
      { display_name: 'Frank' }, { display_name: 'Coach Kenny' }, { display_name: 'Coach Darien' },
    ])).toBe('Frank, Coach Kenny & Coach Darien');
  });
  it('accepts plain strings too', () => {
    expect(buildVoiceSignature(['Frank', 'Coach Kenny'])).toBe('Frank & Coach Kenny');
  });
  it('skips blank/whitespace names', () => {
    expect(buildVoiceSignature([{ display_name: 'Frank' }, { display_name: '  ' }, { display_name: 'Coach Kenny' }]))
      .toBe('Frank & Coach Kenny');
  });
});

// Stub supabase: a chained query builder whose terminal awaits resolve to a
// preset { data, error } keyed by table. fetchSignatureCoaches issues THREE
// queries (post JS-join fix — there is no FK between team_staff and
// staff_profiles, so the embed was removed):
//   1. staff_profiles filtered by title='Program Director'  -> programDirectors
//   2. team_staff filtered by team_id                       -> teamStaff rows
//   3. staff_profiles filtered by .in('user_id', [...])      -> coachProfiles
// The builder distinguishes the two staff_profiles queries by whether
// `.eq('title', ...)` (PD) or `.in('user_id', ...)` (coaches) was chained.
function makeSupabase({ programDirectors = [], teamStaff = [], coachProfiles = [], errorOn = null }) {
  return {
    from(table) {
      let usedTitleEq = false;
      let usedUserIn = false;
      const builder = {
        select() { return builder; },
        eq(col) { if (col === 'title') usedTitleEq = true; return builder; },
        in(col) { if (col === 'user_id') usedUserIn = true; return builder; },
        not() { return builder; },
        then(resolve) {
          let result;
          if (errorOn === table) {
            result = { data: null, error: new Error(`boom:${table}`) };
          } else if (table === 'team_staff') {
            result = { data: teamStaff, error: null };
          } else if (usedTitleEq) {
            result = { data: programDirectors, error: null };
          } else if (usedUserIn) {
            result = { data: coachProfiles, error: null };
          } else {
            result = { data: [], error: null };
          }
          return Promise.resolve(result).then(resolve);
        },
      };
      return builder;
    },
  };
}

const FRANK = { user_id: 'u-frank', display_name: 'Frank', title: 'Program Director', phone: '917' };
const KENNY = { user_id: 'u-kenny', display_name: 'Coach Kenny', title: 'Coaching Director', phone: '516' };
const DARIEN = { user_id: 'u-darien', display_name: 'Coach Darien', title: 'Assistant Coach', phone: '914' };

describe('fetchSignatureCoaches — data-driven team-staff signature', () => {
  const orgId = 'org-1';

  it('9U/8U team signs WITH Darien when Darien is in team_staff', async () => {
    const supabase = makeSupabase({
      programDirectors: [FRANK],
      teamStaff: [
        { user_id: 'u-kenny', role: 'head_coach', team_id: 't-9u' },
        { user_id: 'u-darien', role: 'assistant_coach', team_id: 't-9u' },
      ],
      coachProfiles: [KENNY, DARIEN],
    });
    const coaches = await fetchSignatureCoaches(supabase, orgId, 't-9u');
    expect(coaches.map((c) => c.display_name)).toEqual(['Frank', 'Coach Kenny', 'Coach Darien']);
    expect(buildVoiceSignature(coaches)).toBe('Frank, Coach Kenny & Coach Darien');
  });

  it('non-Darien team signs WITHOUT Darien (only its own team_staff)', async () => {
    const supabase = makeSupabase({
      programDirectors: [FRANK],
      teamStaff: [
        { user_id: 'u-kenny', role: 'head_coach', team_id: 't-10u' },
      ],
      coachProfiles: [KENNY],
    });
    const coaches = await fetchSignatureCoaches(supabase, orgId, 't-10u');
    expect(coaches.map((c) => c.display_name)).toEqual(['Frank', 'Coach Kenny']);
    expect(buildVoiceSignature(coaches)).toBe('Frank & Coach Kenny');
  });

  it('multi-team union (games_recap default): dedups Kenny across teams, keeps Darien once', async () => {
    // Kenny coaches both teams (two rows); Darien only the 9U team. Union +
    // dedup by user_id => Frank, Kenny, Darien (single Kenny).
    const supabase = makeSupabase({
      programDirectors: [FRANK],
      teamStaff: [
        { user_id: 'u-kenny', role: 'head_coach', team_id: 't-9u' },
        { user_id: 'u-kenny', role: 'head_coach', team_id: 't-10u' },
        { user_id: 'u-darien', role: 'assistant_coach', team_id: 't-9u' },
      ],
      coachProfiles: [KENNY, DARIEN],
    });
    const coaches = await fetchSignatureCoaches(supabase, orgId, ['t-9u', 't-10u']);
    expect(coaches.map((c) => c.display_name)).toEqual(['Frank', 'Coach Kenny', 'Coach Darien']);
  });

  it('head_coach orders before assistant_coach regardless of fetch order', async () => {
    const supabase = makeSupabase({
      programDirectors: [FRANK],
      teamStaff: [
        { user_id: 'u-darien', role: 'assistant_coach', team_id: 't-9u' },
        { user_id: 'u-kenny', role: 'head_coach', team_id: 't-9u' },
      ],
      coachProfiles: [KENNY, DARIEN],
    });
    const coaches = await fetchSignatureCoaches(supabase, orgId, 't-9u');
    expect(coaches.map((c) => c.display_name)).toEqual(['Frank', 'Coach Kenny', 'Coach Darien']);
  });

  it('no team coaches yet -> Program Director only', async () => {
    const supabase = makeSupabase({ programDirectors: [FRANK], teamStaff: [] });
    const coaches = await fetchSignatureCoaches(supabase, orgId, 't-9u');
    expect(coaches.map((c) => c.display_name)).toEqual(['Frank']);
    expect(buildVoiceSignature(coaches)).toBe('Frank');
  });

  it('AP #36 — throws on staff_profiles error (does not swallow)', async () => {
    const supabase = makeSupabase({ errorOn: 'staff_profiles' });
    await expect(fetchSignatureCoaches(supabase, orgId, 't-9u')).rejects.toThrow('boom:staff_profiles');
  });

  it('AP #36 — throws on team_staff error (does not swallow)', async () => {
    const supabase = makeSupabase({ programDirectors: [FRANK], errorOn: 'team_staff' });
    await expect(fetchSignatureCoaches(supabase, orgId, 't-9u')).rejects.toThrow('boom:team_staff');
  });

  it('no orgId -> empty', async () => {
    const supabase = makeSupabase({ programDirectors: [FRANK] });
    expect(await fetchSignatureCoaches(supabase, null, 't-9u')).toEqual([]);
  });
});
