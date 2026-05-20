// Unit test for fetchKidNames null-guardian filtering. Pins the fix
// for the 2026-05-20 Frank-reported "invalid input syntax for type
// uuid: 'null'" crash on Notify-families test send.
//
// Root cause: pilot test rows from get_digest_recipients return
// guardian_id=null (admin@ stands in for each team's pilot family
// with no real guardian backing). Without filtering nulls,
// .in('guardian_id', [null]) serializes as ?guardian_id=in.(null)
// which Postgres reads as the literal string "null" and rejects.
//
// This test ensures fetchKidNames defensively filters before calling
// .in() — so the helper is safe regardless of whether callers filter
// at the call site.

import { describe, expect, it, vi } from 'vitest';
import { fetchKidNames } from '../gameRecapHelpers';

function mockSupabase(captured) {
  return {
    from() {
      return {
        select() {
          return {
            in(_col, values) {
              captured.push(values);
              return Promise.resolve({ data: [], error: null });
            },
          };
        },
      };
    },
  };
}

describe('fetchKidNames null-guardian filter (anti-pattern #36 corollary)', () => {
  it('returns empty Map without calling .in() when all guardianIds are null', async () => {
    const captured = [];
    const sb = mockSupabase(captured);
    const result = await fetchKidNames(sb, [null, null]);
    expect(result.size).toBe(0);
    expect(captured.length).toBe(0);
  });

  it('returns empty Map without calling .in() when guardianIds is empty array', async () => {
    const captured = [];
    const sb = mockSupabase(captured);
    const result = await fetchKidNames(sb, []);
    expect(result.size).toBe(0);
    expect(captured.length).toBe(0);
  });

  it('filters out nulls before .in() when mixed valid + null IDs are passed', async () => {
    const captured = [];
    const sb = mockSupabase(captured);
    await fetchKidNames(sb, ['00000000-0000-0000-0000-000000000001', null, '00000000-0000-0000-0000-000000000002']);
    expect(captured).toEqual([
      ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'],
    ]);
  });

  it('handles null guardianIds input gracefully', async () => {
    const captured = [];
    const sb = mockSupabase(captured);
    const result = await fetchKidNames(sb, null);
    expect(result.size).toBe(0);
    expect(captured.length).toBe(0);
  });

  it('handles undefined guardianIds input gracefully', async () => {
    const captured = [];
    const sb = mockSupabase(captured);
    const result = await fetchKidNames(sb, undefined);
    expect(result.size).toBe(0);
    expect(captured.length).toBe(0);
  });

  it('builds the kid-name map correctly for valid IDs', async () => {
    const rows = [
      { guardian_id: 'g1', players: { first_name: 'Alice' } },
      { guardian_id: 'g1', players: { first_name: 'Bob' } },
      { guardian_id: 'g2', players: { first_name: 'Charlie' } },
    ];
    const sb = {
      from() {
        return {
          select() {
            return {
              in() { return Promise.resolve({ data: rows, error: null }); },
            };
          },
        };
      },
    };
    const result = await fetchKidNames(sb, ['g1', 'g2']);
    expect(result.get('g1')).toEqual(['Alice', 'Bob']);
    expect(result.get('g2')).toEqual(['Charlie']);
  });
});

// Suppress unused-warning for vi import (kept for parity with other tests in the dir).
void vi;
