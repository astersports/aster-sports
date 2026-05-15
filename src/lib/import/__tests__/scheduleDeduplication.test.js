import { describe, expect, it } from 'vitest';
import { classifyRowAgainstExisting, dedupSummary } from '../scheduleDeduplication';

const EXISTING = [
  { id: 'ev-1', tournament_id: 't-zg', team_id: 'team-11ug', start_at: '2026-05-16T11:00:00-04:00', opponent: 'CT Northstars', location_id: 'loc-insports', sub_location: 'Court 3', is_bonus_game: false },
];

function row(overrides = {}) {
  return {
    tournament_id: 't-zg', opponent: 'CT Northstars', court: 'Court 3', is_bonus: false,
    status: 'valid',
    resolved: { team_id: 'team-11ug', start_at: '2026-05-16T11:00:00-04:00', location_id: 'loc-insports' },
    ...overrides,
  };
}

describe('scheduleDeduplication', () => {
  it('classifies row with exact match as duplicate', () => {
    const classified = classifyRowAgainstExisting(row(), EXISTING);
    expect(classified.dedup).toBe('duplicate');
    expect(classified.matched_event_id).toBe('ev-1');
  });

  it('classifies row with no existing match as new', () => {
    const r = row({ resolved: { team_id: 'team-11ug', start_at: '2026-05-16T14:00:00-04:00', location_id: 'loc-insports' } });
    const classified = classifyRowAgainstExisting(r, EXISTING);
    expect(classified.dedup).toBe('new');
  });

  it('classifies row with same natural key but changed court as updated', () => {
    const r = row({ court: 'Court 5' });
    const classified = classifyRowAgainstExisting(r, EXISTING);
    expect(classified.dedup).toBe('updated');
    expect(classified.matched_event_id).toBe('ev-1');
  });

  it('treats time within ±15 min as same natural key', () => {
    const r = row({ resolved: { team_id: 'team-11ug', start_at: '2026-05-16T11:10:00-04:00', location_id: 'loc-insports' } });
    const classified = classifyRowAgainstExisting(r, EXISTING);
    expect(classified.dedup).toBe('duplicate');
  });

  it('treats time outside ±15 min as different event (new)', () => {
    const r = row({ resolved: { team_id: 'team-11ug', start_at: '2026-05-16T11:30:00-04:00', location_id: 'loc-insports' } });
    const classified = classifyRowAgainstExisting(r, EXISTING);
    expect(classified.dedup).toBe('new');
  });

  it('row with status=error always classified as new (no dedup attempt)', () => {
    const r = row({ status: 'error' });
    const classified = classifyRowAgainstExisting(r, EXISTING);
    expect(classified.dedup).toBe('new');
    expect(classified.matched_event_id).toBe(null);
  });

  it('summary aggregates rows by dedup state', () => {
    const rows = [{ dedup: 'new' }, { dedup: 'new' }, { dedup: 'updated' }, { dedup: 'duplicate' }];
    expect(dedupSummary(rows)).toEqual({ new: 2, updated: 1, duplicate: 1 });
  });
});
