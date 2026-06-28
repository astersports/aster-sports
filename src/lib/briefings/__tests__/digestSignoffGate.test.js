// GAP 2 (architect review of PR #854) — NAMED contact-gate coverage for the
// weekly_digest path. weekly_digest is the 175-family send and the ONE path
// that builds overrides manually (digestSend), diverging from bodyOverrides —
// so it gets its own explicit test that contact is OFF by default and renders
// only the selected staff on opt-in, both at the state→args mapping and at the
// composeWeeklyDigest render.

import { describe, expect, it } from 'vitest';
import { mapWizardStateToDigestArgs } from '../sendWeeklyDigestFromWizard';
import { baseState, COACHES, ev, period, recip } from './_sendWizardFixtures';
import { composeWeeklyDigest } from '../../engine/resolvers/composeWeeklyDigest';

const FRANK = { user_id: 'u-frank', display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' };
const KENNY = { user_id: 'u-kenny', display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' };

const mapArgs = (over) => mapWizardStateToDigestArgs({
  state: baseState(over), orgId: 'o-1', period,
  recipients: [recip('g1', ['t-1'])], events: [ev('e1', 't-1')],
  tournaments: [], teams: [{ id: 't-1' }], coaches: COACHES, rsvpCountsByEvent: new Map(),
});

describe('weekly_digest contact gate — state→digest args mapping', () => {
  it('is OFF by default (signoffEnabled false, no coaches)', () => {
    const args = mapArgs();
    expect(args.signoffEnabled).toBe(false);
    expect(args.signoffCoaches).toEqual([]);
  });

  it('carries the per-message opt-in + selected staff', () => {
    const args = mapArgs({ signoff_enabled: true, signoff_coaches: [FRANK, KENNY] });
    expect(args.signoffEnabled).toBe(true);
    expect(args.signoffCoaches).toEqual([FRANK, KENNY]);
  });
});

describe('weekly_digest contact gate — composeWeeklyDigest render', () => {
  const ctx = {
    org: { id: 'o-1', name: 'Aster AAU', branding: { eyebrowLink: 'x', contactEmail: 'c', logoUrl: 'l' }, coaches: [FRANK, KENNY], signature_coaches: [FRANK, KENNY] },
    period: { start: new Date(), end: new Date(), label: 'X' }, events: [], teams: [], tournaments: [], rsvpCountsByEvent: new Map(),
  };
  const slice = { kind: 'family', team_ids: [] };
  const signoffOf = (sections) => sections.find((s) => s.kind === 'signoff');

  it('renders NO signoff coaches/signature by default (even though org.coaches is populated)', () => {
    const { content_sections } = composeWeeklyDigest(ctx, slice, {});
    const s = signoffOf(content_sections);
    expect(s?.coaches?.length || 0).toBe(0);
    expect(s?.signature || '').toBe('');
  });

  it('renders ONLY the selected staff on opt-in', () => {
    const { content_sections } = composeWeeklyDigest(ctx, slice, { signoff_enabled: true, signoff_coaches: [KENNY] });
    const s = signoffOf(content_sections);
    expect(s.signature).toBe('Coach Kenny');
    expect(s.coaches).toEqual([{ display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' }]);
  });
});
