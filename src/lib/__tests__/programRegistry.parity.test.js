import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { PROGRAM_TYPE_KEYS, PROGRAM_TYPE_REGISTRY } from '../programRegistry';
import { isCompetitiveSlug } from '../teamTypes';

// B5-ε parity guard (the keystone of the registry architecture): the DB
// program_type enum, the registry keys, and the ProgramTypeChooser entries MUST
// be the same set. This test fails CI if any of the three drifts — so "add an
// archetype" stays mechanical (enum value + registry row) and can never
// half-land.
describe('PROGRAM_TYPE_REGISTRY parity', () => {
  it('registry keys === PROGRAM_TYPE_KEYS (the canonical set)', () => {
    expect(Object.keys(PROGRAM_TYPE_REGISTRY).sort()).toEqual([...PROGRAM_TYPE_KEYS].sort());
  });

  it('PROGRAM_TYPE_KEYS === the DB program_type enum (read from the migrations)', () => {
    // Reconstruct the enum from the migration mirrors (CREATE TYPE … ENUM + any
    // ALTER TYPE … ADD VALUE) rather than from recollection (AP#60).
    const dir = 'supabase/migrations';
    const enumVals = new Set();
    for (const f of readdirSync(dir)) {
      const sql = readFileSync(`${dir}/${f}`, 'utf8');
      const create = sql.match(/create\s+type\s+(?:public\.)?program_type\s+as\s+enum\s*\(([^)]*)\)/i);
      if (create) for (const v of create[1].match(/'([^']+)'/g) || []) enumVals.add(v.replace(/'/g, ''));
      const add = sql.match(/alter\s+type\s+(?:public\.)?program_type\s+add\s+value[^']*'([^']+)'/i);
      if (add) enumVals.add(add[1]);
    }
    expect([...enumVals].sort()).toEqual([...PROGRAM_TYPE_KEYS].sort());
  });

  it('ProgramTypeChooser derives its entries from PROGRAM_TYPE_KEYS (no hardcoded list)', () => {
    const src = readFileSync('src/components/admin/program-setup/ProgramTypeChooser.jsx', 'utf8');
    expect(src).toMatch(/PROGRAM_TYPE_KEYS/);
  });

  it('competitive === isCompetitiveSlug(defaultTeamType) for every type (no drift)', () => {
    for (const [key, rule] of Object.entries(PROGRAM_TYPE_REGISTRY)) {
      expect(rule.competitive, `competitive mismatch for ${key}`).toBe(isCompetitiveSlug(rule.defaultTeamType));
    }
  });

  it('every type carries the full field set the consumers read', () => {
    const fields = ['label', 'noun', 'badgeVariant', 'defaultStatus', 'hasDivisions', 'singleActive', 'defaultTeamType', 'competitive', 'chooserHelper'];
    for (const [key, rule] of Object.entries(PROGRAM_TYPE_REGISTRY)) {
      for (const f of fields) expect(rule[f], `${key}.${f} missing`).not.toBeUndefined();
    }
  });

  it('defaultStatus is always a valid status (matches the DB CHECK)', () => {
    for (const rule of Object.values(PROGRAM_TYPE_REGISTRY)) {
      expect(['active', 'draft', 'archived']).toContain(rule.defaultStatus);
    }
  });
});
