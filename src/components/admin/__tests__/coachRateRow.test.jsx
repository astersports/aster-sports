// @vitest-environment jsdom
//
// PR-4b clobber fix. CoachRateRow edits ONE coaching_assignments row's rate and
// the write is id-scoped — it must never fan across the coach's other teams (the
// old CoachRateSheet UPDATE-by-team_id-IN clobber). Locks: (a) the write targets
// exactly .eq('id', <this row>) + .eq('org_id', …) and nothing else, (b) empty →
// NULL (unpaid), (c) a positive rate → cents, (d) 0/negatives rejected (Save off).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

const { records } = vi.hoisted(() => ({ records: [] }));
vi.mock('../../../lib/supabase', () => {
  const chainable = (rec) => {
    const o = { eq: (col, value) => { rec.eqs.push([col, value]); return o; }, then: (r) => Promise.resolve({ error: rec.error }).then(r) };
    return o;
  };
  return { supabase: { from: (table) => ({ update: (payload) => { const rec = { table, payload, eqs: [] }; records.push(rec); return chainable(rec); } }) } };
});

import CoachRateRow from '../CoachRateRow';

const ASSIGN = { id: 'ca-11ug', role: 'head_coach', scope: 'all_events', pay_per_session_cents: 12000, teamName: '11U Girls' };
beforeEach(() => { records.length = 0; });
afterEach(cleanup);

describe('CoachRateRow (PR-4b per-assignment rate)', () => {
  it('renders the row at its current rate with Save disabled (not dirty)', () => {
    const { getByLabelText } = render(<CoachRateRow assignment={ASSIGN} orgId="org1" first onSaved={() => {}} />);
    expect(getByLabelText('Rate for 11U Girls').value).toBe('120');
    expect(getByLabelText('Save rate for 11U Girls').disabled).toBe(true);
  });

  it('a NULL rate shows an empty field + "Unpaid" placeholder', () => {
    const { getByLabelText } = render(<CoachRateRow assignment={{ ...ASSIGN, pay_per_session_cents: null }} orgId="org1" first onSaved={() => {}} />);
    const input = getByLabelText('Rate for 11U Girls');
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Unpaid');
  });

  it('writes exactly one id-scoped row (no team fan-out) at the new rate', async () => {
    const onSaved = vi.fn();
    const { getByLabelText } = render(<CoachRateRow assignment={ASSIGN} orgId="org1" first onSaved={onSaved} />);
    fireEvent.change(getByLabelText('Rate for 11U Girls'), { target: { value: '150' } });
    fireEvent.click(getByLabelText('Save rate for 11U Girls'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(records.length).toBe(1);
    expect(records[0].table).toBe('coaching_assignments');
    expect(records[0].payload).toEqual({ pay_per_session_cents: 15000 });
    expect(records[0].eqs).toEqual([['id', 'ca-11ug'], ['org_id', 'org1']]);
  });

  it('clearing the field writes NULL (marks the team unpaid)', async () => {
    const onSaved = vi.fn();
    const { getByLabelText } = render(<CoachRateRow assignment={ASSIGN} orgId="org1" first onSaved={onSaved} />);
    fireEvent.change(getByLabelText('Rate for 11U Girls'), { target: { value: '' } });
    fireEvent.click(getByLabelText('Save rate for 11U Girls'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(records[0].payload).toEqual({ pay_per_session_cents: null });
  });

  it('rejects 0 and negatives — Save stays disabled, no write', () => {
    const { getByLabelText } = render(<CoachRateRow assignment={ASSIGN} orgId="org1" first onSaved={() => {}} />);
    const input = getByLabelText('Rate for 11U Girls');
    fireEvent.change(input, { target: { value: '0' } });
    expect(getByLabelText('Save rate for 11U Girls').disabled).toBe(true);
    fireEvent.change(input, { target: { value: '-5' } });
    expect(getByLabelText('Save rate for 11U Girls').disabled).toBe(true);
    expect(records.length).toBe(0);
  });
});
