import { describe, expect, it } from 'vitest';
import { checkSlugAvailable, dayBoundaryTs, divisionsApplyTo, statusForProgramType, validateProgramDates } from '../programSetup';

// PR-1 decision logic for type-aware program create (GO D1/D2 + F3).

describe('statusForProgramType (GO D1)', () => {
  it('camp + clinic are created active', () => {
    expect(statusForProgramType('camp')).toBe('active');
    expect(statusForProgramType('clinic')).toBe('active');
  });
  it('season, tryout, evaluation, interest_list, other are created draft (Fork 1)', () => {
    for (const t of ['season', 'tryout', 'evaluation', 'interest_list', 'other']) {
      expect(statusForProgramType(t)).toBe('draft');
    }
  });
});

describe('divisionsApplyTo (GO D2 — season-only)', () => {
  it('is true only for season', () => {
    expect(divisionsApplyTo('season')).toBe(true);
    for (const t of ['camp', 'clinic', 'tryout', 'evaluation', 'interest_list']) {
      expect(divisionsApplyTo(t)).toBe(false);
    }
  });
});

describe('validateProgramDates', () => {
  it('passes when dates are consistent or absent', () => {
    expect(validateProgramDates({})).toBeNull();
    expect(validateProgramDates({ start_date: '2026-07-10', end_date: '2026-07-26' })).toBeNull();
    expect(validateProgramDates({
      start_date: '2026-07-10', end_date: '2026-07-26',
      reg_opens_at: '2026-06-07T10:00', reg_closes_at: '2026-07-09T10:00',
    })).toBeNull();
  });
  it('rejects end before start', () => {
    expect(validateProgramDates({ start_date: '2026-07-26', end_date: '2026-07-10' })).toMatch(/end date can't be before/i);
  });
  it('rejects registration closing before it opens', () => {
    expect(validateProgramDates({ reg_opens_at: '2026-07-10T10:00', reg_closes_at: '2026-06-07T10:00' })).toMatch(/close before it opens/i);
  });
  it('rejects registration closing after the program ends (the smoke case)', () => {
    expect(validateProgramDates({ end_date: '2026-07-26', reg_closes_at: '2026-07-31T10:00' })).toMatch(/close after the program ends/i);
  });
});

describe('dayBoundaryTs (registration day-boundary times)', () => {
  it('opens at midnight, closes at end of day, inclusive of the close date', () => {
    expect(dayBoundaryTs('2026-06-07', 'open')).toBe('2026-06-07T00:00:00');
    expect(dayBoundaryTs('2026-07-26', 'close')).toBe('2026-07-26T23:59:59');
  });
  it('returns null for an empty date', () => {
    expect(dayBoundaryTs('', 'open')).toBeNull();
    expect(dayBoundaryTs(null, 'close')).toBeNull();
  });
});

describe('checkSlugAvailable (F3 — app-level uniqueness)', () => {
  // Fake matching .from().select().eq().ilike()[.neq()].limit() -> { data, error }.
  const fake = (rows, error = null) => {
    const tail = { limit: () => Promise.resolve({ data: rows, error }) };
    const afterIlike = { ...tail, neq: () => tail };
    return { from: () => ({ select: () => ({ eq: () => ({ ilike: () => afterIlike }) }) }) };
  };
  it('returns null when slug is empty (nothing to check)', async () => {
    expect(await checkSlugAvailable(fake([]), 'org-1', '')).toBeNull();
  });
  it('returns null when the slug is free', async () => {
    expect(await checkSlugAvailable(fake([]), 'org-1', 'fall-skills-lab')).toBeNull();
  });
  it('returns a kindness message when the slug is taken', async () => {
    const msg = await checkSlugAvailable(fake([{ id: 'p-1' }]), 'org-1', 'spring-2026');
    expect(msg).toMatch(/already taken/i);
  });
  it('surfaces the query error message', async () => {
    expect(await checkSlugAvailable(fake(null, { message: 'boom' }), 'org-1', 'x')).toBe('boom');
  });
  it('on edit, excludes the program itself (no false collision with its own slug)', async () => {
    // The query filters out excludeId, so the fake returns no rows → available.
    expect(await checkSlugAvailable(fake([]), 'org-1', 'spring-2026', 'p-1')).toBeNull();
  });
});
