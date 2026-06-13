// @vitest-environment jsdom
//
// AP#43 cross-surface invariant (events-wizard L99 audit 2026-06-13 B1):
// the wizard is the ONLY writer of enable_rides + duty slots, so it must
// honor the SAME featureGates chain every reader honors. An org with rides
// or duties turned off in Settings must NOT be offered them in the wizard —
// otherwise the admin flips a flag that dark-ships off everywhere else.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

// StepDetails fetches tournaments + opponents on mount; stub the chain.
vi.mock('../../../lib/supabase', () => {
  const chain = () => {
    const q = {};
    ['select', 'eq', 'is', 'in', 'order'].forEach((m) => { q[m] = () => q; });
    q.then = (res) => Promise.resolve({ data: [] }).then(res);
    return q;
  };
  return { supabase: { from: () => chain() } };
});

import StepDetails from '../StepDetails';

afterEach(cleanup);

const baseData = { duties: [], homeAway: 'tbd', indoor: true };
const renderStep = (org) => render(
  <StepDetails eventType="practice" data={baseData} onChange={() => {}} orgId="org-1" org={org} />
);

describe('wizard feature-gate — rides + Volunteers offered ⟺ org capability on', () => {
  it('org rides+duties ON: both offered', () => {
    const { queryByLabelText, queryByText } = renderStep({ feature_settings: { rides_enabled: true, duties_enabled: true } });
    expect(queryByLabelText('Enable rides')).not.toBeNull();
    expect(queryByText('Volunteers')).not.toBeNull();
  });

  it('org rides+duties OFF: neither offered', () => {
    const { queryByLabelText, queryByText } = renderStep({ feature_settings: { rides_enabled: false, duties_enabled: false } });
    expect(queryByLabelText('Enable rides')).toBeNull();
    expect(queryByText('Volunteers')).toBeNull();
  });

  it('missing org defaults both ON (never dark-ship a feature off)', () => {
    const { queryByLabelText, queryByText } = renderStep(null);
    expect(queryByLabelText('Enable rides')).not.toBeNull();
    expect(queryByText('Volunteers')).not.toBeNull();
  });

  it('rides off but duties on: only Volunteers offered', () => {
    const { queryByLabelText, queryByText } = renderStep({ feature_settings: { rides_enabled: false, duties_enabled: true } });
    expect(queryByLabelText('Enable rides')).toBeNull();
    expect(queryByText('Volunteers')).not.toBeNull();
  });
});
