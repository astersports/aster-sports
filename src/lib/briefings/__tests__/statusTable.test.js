import { describe, expect, it } from 'vitest';
import { isActiveBadgeItem, sortPriority, STATUS_TABLE, statusFor } from '../statusTable';

const NOW = Date.UTC(2026, 4, 9, 16, 0, 0);

describe('statusFor', () => {
  it('synthetic items (legacy useNeedsBriefing shape) return their declared status', () => {
    expect(statusFor({ synthetic_id: 'x', status: 'needs_briefing_game' })).toBe('needs_briefing_game');
  });

  // Wave 4.8 6c — RPC returns source='synthetic' + status='needs_briefing'
  // with the actual variant carried by `kind`. statusFor maps to the
  // existing styled keys so badges/sort stay byte-identical.
  it('RPC synth game_recap maps to needs_briefing_game', () => {
    expect(statusFor({ source: 'synthetic', status: 'needs_briefing', kind: 'game_recap' })).toBe('needs_briefing_game');
  });
  it('RPC synth tournament_prelim maps to needs_briefing_tournament', () => {
    expect(statusFor({ source: 'synthetic', status: 'needs_briefing', kind: 'tournament_prelim' })).toBe('needs_briefing_tournament');
  });
  it('RPC synth tournament_recap maps to needs_briefing_tournament_recap', () => {
    expect(statusFor({ source: 'synthetic', status: 'needs_briefing', kind: 'tournament_recap' })).toBe('needs_briefing_tournament_recap');
  });

  it('draft within 7d → draft', () => {
    expect(statusFor({ status: 'draft', last_edited_at: new Date(NOW - 86400000).toISOString() }, NOW)).toBe('draft');
  });

  it('draft older than 7d → stale_draft', () => {
    expect(statusFor({ status: 'draft', last_edited_at: new Date(NOW - 8 * 86400000).toISOString() }, NOW)).toBe('stale_draft');
  });

  it('scheduled within 24h → scheduled_lt24h', () => {
    expect(statusFor({ status: 'scheduled', scheduled_for: new Date(NOW + 12 * 3600000).toISOString() }, NOW)).toBe('scheduled_lt24h');
  });

  it('scheduled beyond 24h → scheduled_gt24h', () => {
    expect(statusFor({ status: 'scheduled', scheduled_for: new Date(NOW + 3 * 86400000).toISOString() }, NOW)).toBe('scheduled_gt24h');
  });
});

describe('sortPriority', () => {
  it('drafts sort before scheduled <24h, which sort before needs_briefing', () => {
    const draft = sortPriority({ status: 'draft', last_edited_at: new Date(NOW).toISOString() }, NOW);
    const sched = sortPriority({ status: 'scheduled', scheduled_for: new Date(NOW + 3600000).toISOString() }, NOW);
    const needs = sortPriority({ synthetic_id: 'x', status: 'needs_briefing_game' }, NOW);
    expect(draft).toBeLessThan(sched);
    expect(sched).toBeLessThan(needs);
  });

  it('stale drafts sort behind everything urgent', () => {
    const stale = sortPriority({ status: 'draft', last_edited_at: new Date(NOW - 30 * 86400000).toISOString() }, NOW);
    const urgent = sortPriority({ synthetic_id: 'x', status: 'schedule_change_skipped' }, NOW);
    expect(urgent).toBeLessThan(stale);
  });
});

describe('isActiveBadgeItem', () => {
  it('counts drafts, scheduled<24h, needs_briefing_*, schedule_change_skipped, weekly_digest_due', () => {
    expect(isActiveBadgeItem({ status: 'draft', last_edited_at: new Date(NOW).toISOString() }, NOW)).toBe(true);
    expect(isActiveBadgeItem({ synthetic_id: 'x', status: 'needs_briefing_tournament' })).toBe(true);
    expect(isActiveBadgeItem({ synthetic_id: 'x', status: 'weekly_digest_due' })).toBe(true);
  });

  it('excludes stale drafts and scheduled>24h from urgency count', () => {
    expect(isActiveBadgeItem({ status: 'draft', last_edited_at: new Date(NOW - 30 * 86400000).toISOString() }, NOW)).toBe(false);
    expect(isActiveBadgeItem({ status: 'scheduled', scheduled_for: new Date(NOW + 5 * 86400000).toISOString() }, NOW)).toBe(false);
  });
});

describe('STATUS_TABLE coverage', () => {
  it('every status has sort + colors + label + action', () => {
    Object.entries(STATUS_TABLE).forEach(([k, v]) => {
      expect(v.sort, k).toBeGreaterThan(0);
      expect(v.borderColor, k).toBeTruthy();
      expect(v.pillBg, k).toBeTruthy();
      expect(v.pillText, k).toBeTruthy();
      expect(v.label, k).toBeTruthy();
      expect(v.action, k).toBeTruthy();
    });
  });
});
