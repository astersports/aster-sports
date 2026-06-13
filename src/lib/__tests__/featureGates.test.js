import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { dutiesEnabledFor, ridesCapableOrg, ridesEnabledFor } from '../featureGates';

// AP#43 cross-surface invariant for THE ONE GATE CHAIN (audit 2026-06-12
// F-1..F-5): Home showed "Ride needed" while the same game's detail said
// "Ride coordination is off" because three surfaces re-derived the gate
// locally and one hook never derived it at all. Unit half locks the chain
// semantics; static half blocks the NEXT consumer from reading the raw
// flags instead of the helper.

describe('featureGates — chain semantics', () => {
  const orgOn = { feature_settings: { rides_enabled: true, duties_enabled: true } };
  const orgOff = { feature_settings: { rides_enabled: false, duties_enabled: false } };

  it('rides require BOTH the org toggle AND the per-event flag', () => {
    expect(ridesEnabledFor(orgOn, { enable_rides: true })).toBe(true);
    expect(ridesEnabledFor(orgOn, { enable_rides: false })).toBe(false);
    expect(ridesEnabledFor(orgOn, {})).toBe(false); // missing event flag = OFF
    expect(ridesEnabledFor(orgOff, { enable_rides: true })).toBe(false);
  });

  it('missing org/jsonb defaults the ORG toggle on, never the event flag', () => {
    expect(ridesEnabledFor(null, { enable_rides: true })).toBe(true);
    expect(ridesEnabledFor({}, { enable_rides: true })).toBe(true);
    expect(ridesEnabledFor(null, null)).toBe(false);
  });

  it('duties gate on the org toggle only, default ON', () => {
    expect(dutiesEnabledFor(orgOn)).toBe(true);
    expect(dutiesEnabledFor(orgOff)).toBe(false);
    expect(dutiesEnabledFor(null)).toBe(true);
    expect(dutiesEnabledFor({})).toBe(true);
  });

  // The wizard's "offer the rides toggle?" gate — the org half of the chain,
  // default ON. The per-event flag is what the wizard SETS, so it is not part
  // of the offer decision (events-wizard L99 audit 2026-06-13 B1).
  it('ridesCapableOrg = org toggle only, default ON', () => {
    expect(ridesCapableOrg(orgOn)).toBe(true);
    expect(ridesCapableOrg(orgOff)).toBe(false);
    expect(ridesCapableOrg(null)).toBe(true);
    expect(ridesCapableOrg({})).toBe(true);
  });
});

// ---- static gate: no raw flag reads outside the allowlist ----

const SRC = 'src';

// Legitimate raw-token mentions. Everything else must import featureGates.
const ALLOWLIST = new Set([
  'lib/featureGates.js',                    // the helper itself
  'context/AuthContext.jsx',                // org select string (column name)
  'hooks/useOrgFeatureSettings.js',         // settings surface read + RPC write
  'components/admin/EventFeaturesForm.jsx', // operator control surface
  'hooks/useCreateActivity.js',             // wizard writer (insert payload)
  'hooks/useUpdateActivity.js',             // wizard writer (update payload)
  'components/wizard/wizardForm.js',        // wizard form-state mapping
]);

function codeLines(text) {
  return text.split('\n').filter((l) => {
    const t = l.trim();
    return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
  }).join('\n');
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(p, acc);
    } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      acc.push(p);
    }
  }
  return acc;
}

describe('featureGates — static gate (D3 one-chain discipline)', () => {
  it('no feature_settings / enable_rides reads outside the allowlist', () => {
    const violations = [];
    for (const f of walk(SRC)) {
      const rel = path.relative(SRC, f).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;
      const text = codeLines(fs.readFileSync(f, 'utf8'));
      if (/feature_settings|enable_rides/.test(text)) violations.push(rel);
    }
    expect(violations, `Raw feature-flag read found — derive from lib/featureGates.js (ridesEnabledFor/dutiesEnabledFor) instead:\n${violations.join('\n')}`).toEqual([]);
  });
});
