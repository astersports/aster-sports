import { describe, expect, it } from 'vitest';
import { childIneligibleReason } from '../registerEligibility';

describe('childIneligibleReason (RG-3 funnel select eligibility)', () => {
  it('eligible → null', () => {
    expect(childIneligibleReason({ grade: 5, gender: 'female' }, { grade_min: 4, grade_max: 6, gender: 'female' })).toBeNull();
    expect(childIneligibleReason({ grade: 2, gender: 'male' }, { gender: 'coed' })).toBeNull();
  });
  it('grade below / above the band', () => {
    expect(childIneligibleReason({ grade: 2 }, { grade_min: 4, grade_max: 6 })).toMatch(/below/);
    expect(childIneligibleReason({ grade: 8 }, { grade_min: 4, grade_max: 6 })).toMatch(/above/);
  });
  it('gender mismatch on a gendered division', () => {
    expect(childIneligibleReason({ grade: 5, gender: 'male' }, { gender: 'female' })).toBe('Girls only');
    expect(childIneligibleReason({ grade: 5, gender: 'female' }, { gender: 'male' })).toBe('Boys only');
  });
  it('unknown grade/gender does not block (server still validates)', () => {
    expect(childIneligibleReason({ grade: null, gender: null }, { grade_min: 4, gender: 'female' })).toBeNull();
  });
});
