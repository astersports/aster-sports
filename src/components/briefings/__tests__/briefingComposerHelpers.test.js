// Wave — hasAuthoredContent gate. Locks the "no empty scratch drafts"
// rule: the autosave only persists a draft once the admin has authored a
// body field or sign-off, so clicking through the wizard and backing out
// leaves nothing in "Resume a draft?".

import { describe, expect, it } from 'vitest';
import { hasAuthoredContent } from '../briefingComposerHelpers';

describe('hasAuthoredContent', () => {
  it('is false for a fresh wizard state (empty body, empty sign-off)', () => {
    expect(hasAuthoredContent({ body: {}, signoff_message: '' })).toBe(false);
  });

  it('is false for whitespace-only sign-off and missing args', () => {
    expect(hasAuthoredContent({ body: {}, signoff_message: '   ' })).toBe(false);
    expect(hasAuthoredContent({})).toBe(false);
    expect(hasAuthoredContent()).toBe(false);
  });

  it('is true once a sign-off is authored', () => {
    expect(hasAuthoredContent({ body: {}, signoff_message: 'See you there!' })).toBe(true);
  });

  it('is true when a body field carries a non-empty value', () => {
    expect(hasAuthoredContent({ body: { headline: 'Big week' }, signoff_message: '' })).toBe(true);
    expect(hasAuthoredContent({ body: { date_range: { start: '2026-05-21' } } })).toBe(true);
    expect(hasAuthoredContent({ body: { player_ids: ['p1'] } })).toBe(true);
  });

  it('is false when body fields are all empty/blank', () => {
    expect(hasAuthoredContent({ body: { headline: '', notes: '   ' } })).toBe(false);
    expect(hasAuthoredContent({ body: { tags: [], meta: {} } })).toBe(false);
    expect(hasAuthoredContent({ body: { headline: null } })).toBe(false);
  });
});
