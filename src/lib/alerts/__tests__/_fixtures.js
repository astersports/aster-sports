// Tier 3 v1 PR 2 — shared test fixtures for evaluator + orchestrator
// tests. Underscore prefix keeps this out of the Vitest test glob.

import { vi } from 'vitest';

export const ORG = 'org-1';

export function makeConfig(alertTypeKey, instanceKey, threshold_config = {}, enabled = true) {
  return { id: `cfg-${alertTypeKey}-${instanceKey || 'def'}`, org_id: ORG, alert_type_key: alertTypeKey,
    instance_key: instanceKey, enabled, threshold_config, evaluation_order: 0 };
}

export function makeExec(overrides = {}) {
  const noop = () => Promise.resolve([]);
  return {
    getRsvpShortfallEvents: vi.fn(overrides.getRsvpShortfallEvents || noop),
    getMostRecentBriefingByKind: vi.fn(overrides.getMostRecentBriefingByKind || (() => Promise.resolve(null))),
    getTournamentsWithoutPrelim: vi.fn(overrides.getTournamentsWithoutPrelim || noop),
    getEventsWithoutLocation: vi.fn(overrides.getEventsWithoutLocation || noop),
    getEventsWithoutOpponent: vi.fn(overrides.getEventsWithoutOpponent || noop),
    getEventsWithBrokenLocationData: vi.fn(overrides.getEventsWithBrokenLocationData || noop),
    getOverdueFamilyBalances: vi.fn(overrides.getOverdueFamilyBalances || noop),
  };
}

export const TEAM_8U = { age_group: '8U', circuit: 'AAU' };
export const TEAM_11U = { age_group: '11U', circuit: 'AAU' };
