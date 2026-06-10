import { describe, expect, it } from 'vitest';
import { loadImplicitFeeCents, upsertImplicitFee } from '../implicitDivision';

// Minimal chainable supabase mock. divisionRow / feeRow are the maybeSingle()
// results; inserts/updates are recorded for assertions. insert() is both
// awaitable ({error}) and exposes .select().single() (divisions path).
function mockSupabase({ divisionRow = null, feeRow = null } = {}) {
  const inserts = [];
  const updates = [];
  const from = (table) => {
    const api = {
      select: () => api,
      eq: () => api,
      order: () => api,
      limit: () => api,
      maybeSingle: () => Promise.resolve({ data: table === 'divisions' ? divisionRow : feeRow, error: null }),
      insert: (row) => {
        inserts.push({ table, row });
        return {
          select: () => ({ single: () => Promise.resolve({ data: { id: 'new-div-id' }, error: null }) }),
          then: (resolve) => resolve({ error: null }),
        };
      },
      update: (row) => { updates.push({ table, row }); return { eq: () => Promise.resolve({ error: null }) }; },
    };
    return api;
  };
  return { client: { from }, inserts, updates };
}

describe('implicitDivision', () => {
  it('loadImplicitFeeCents: null when no division exists', async () => {
    const { client } = mockSupabase({ divisionRow: null });
    expect(await loadImplicitFeeCents(client, 'p1')).toBeNull();
  });

  it('loadImplicitFeeCents: returns the base fee cents when present', async () => {
    const { client } = mockSupabase({ divisionRow: { id: 'd1' }, feeRow: { amount_cents: 4500 } });
    expect(await loadImplicitFeeCents(client, 'p1')).toBe(4500);
  });

  it('upsert creates a coed/no-band implicit division + base fee when absent', async () => {
    const { client, inserts } = mockSupabase({ divisionRow: null, feeRow: null });
    await upsertImplicitFee(client, { orgId: 'o1', programId: 'p1', programName: 'Fall 2026 Tryouts', amountCents: 4500 });
    const divIns = inserts.find((i) => i.table === 'divisions');
    expect(divIns.row).toMatchObject({ org_id: 'o1', program_id: 'p1', name: 'Fall 2026 Tryouts', gender: 'coed', grade_min: null, grade_max: null });
    const feeIns = inserts.find((i) => i.table === 'division_fees');
    expect(feeIns.row).toMatchObject({ division_id: 'new-div-id', fee_type: 'base', amount_cents: 4500 });
  });

  it('upsert updates the existing base fee, no new division, when present', async () => {
    const { client, inserts, updates } = mockSupabase({ divisionRow: { id: 'd1' }, feeRow: { id: 'f1' } });
    await upsertImplicitFee(client, { orgId: 'o1', programId: 'p1', programName: 'X', amountCents: 6000 });
    expect(inserts.find((i) => i.table === 'divisions')).toBeUndefined();
    expect(updates.find((u) => u.table === 'division_fees').row).toMatchObject({ amount_cents: 6000 });
  });
});
