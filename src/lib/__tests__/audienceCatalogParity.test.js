/* global process */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Phase 3 D-7 — audience catalog parity (closes PATTERN B1-α drift).
//
// Catches BUG B-class drift at CI time: the 4 source-of-truth surfaces
// for audience_type values must stay aligned.
//
//   1. Production CHECK constraint  — encoded as CANONICAL below
//   2. KIND_METADATA.defaultAudienceType in src/lib/briefings/kindMetadata.js
//   3. AudiencePicker MODES + NON_MODE_LABELS in src/components/briefings/AudiencePicker.jsx
//   4. The shared AUDIENCE_LABEL map in src/lib/briefings/audienceLabels.js
//      (consolidated out of StepAnchorAudience in PR #703; StepAnchorAudience
//      + StepSendConfirm now import it)
//
// Origin: docs/AUDIT_BRIEFINGS_2026-06-02.md §B4.1 (4-way drift produced
// 21 production rows in coach_roundup + family_guide with wrong-but-
// CHECK-allowed audience_type values, because AudiencePicker didn't
// show coach_self / family_specific as options).

const KIND_METADATA_FILE = join(process.cwd(), 'src', 'lib', 'briefings', 'kindMetadata.js');
const AUDIENCE_PICKER_FILE = join(process.cwd(), 'src', 'components', 'briefings', 'AudiencePicker.jsx');
// The AUDIENCE_LABEL map was consolidated out of StepAnchorAudience into the
// shared src/lib/briefings/audienceLabels.js (PR #703, AP #63 — it was also
// duplicated in StepSendConfirm + leaking raw enums in HistoryView/chips).
// StepAnchorAudience now imports it; the parity check verifies the canonical map.
const AUDIENCE_LABELS_FILE = join(process.cwd(), 'src', 'lib', 'briefings', 'audienceLabels.js');

// Canonical = production CHECK constraint values, verified live
// 2026-06-03 via mig 20260603194947.
const CANONICAL = [
  'team', 'multi_team',
  'tournament_attendees', 'event_attendees',
  'org_all', 'custom',
  'player_specific',
  'multi_event_attendees',
  'coach_self',
  'family_specific',
];

function extractDefaultAudienceTypes(source) {
  const matches = source.matchAll(/defaultAudienceType:\s*'([a-z_]+)'/g);
  return new Set(Array.from(matches, (m) => m[1]));
}

function extractAudiencePickerKnownTypes(source) {
  const modeMatches = source.matchAll(/\{\s*type:\s*'([a-z_]+)',\s*label:/g);
  const types = new Set(Array.from(modeMatches, (m) => m[1]));
  // Scope NON_MODE_LABELS extraction to its own const block so unrelated
  // object literals (style objects with `flex:` etc.) don't pollute the set.
  const block = source.match(/NON_MODE_LABELS\s*=\s*\{([^}]+)\}/);
  if (block) {
    for (const m of block[1].matchAll(/([a-z_]+):/g)) types.add(m[1]);
  }
  return types;
}

function extractAudienceLabelKeys(source) {
  const block = source.match(/AUDIENCE_LABEL\s*=\s*\{([^}]+)\}/);
  if (!block) return new Set();
  const matches = block[1].matchAll(/([a-z_]+):/g);
  return new Set(Array.from(matches, (m) => m[1]));
}

describe('Audience catalog parity (Phase 3 D-7 / PATTERN B1-α guard)', () => {
  it('every KIND_METADATA.defaultAudienceType is in the canonical set', () => {
    const src = readFileSync(KIND_METADATA_FILE, 'utf8');
    const defaults = extractDefaultAudienceTypes(src);
    const unknowns = Array.from(defaults).filter((v) => !CANONICAL.includes(v));
    expect(
      unknowns,
      `kindMetadata.defaultAudienceType values not in production CHECK: ${unknowns.join(', ')}. Either widen the CHECK (mirror migration) or correct the default.`,
    ).toEqual([]);
  });

  it('AudiencePicker knows a label for every audience type that can be the picker default', () => {
    const kmSrc = readFileSync(KIND_METADATA_FILE, 'utf8');
    const apSrc = readFileSync(AUDIENCE_PICKER_FILE, 'utf8');
    const defaults = extractDefaultAudienceTypes(kmSrc);
    const known = extractAudiencePickerKnownTypes(apSrc);
    const orphans = Array.from(defaults).filter((v) => !known.has(v));
    expect(
      orphans,
      `KIND_METADATA defaults missing from AudiencePicker MODES or NON_MODE_LABELS: ${orphans.join(', ')}. Add a label so the picker doesn't render the raw enum string.`,
    ).toEqual([]);
  });

  it('the shared AUDIENCE_LABEL map knows every audience type that appears in a locked caption', () => {
    const kmSrc = readFileSync(KIND_METADATA_FILE, 'utf8');
    const alSrc = readFileSync(AUDIENCE_LABELS_FILE, 'utf8');
    const defaults = extractDefaultAudienceTypes(kmSrc);
    const labels = extractAudienceLabelKeys(alSrc);
    const orphans = Array.from(defaults).filter((v) => !labels.has(v));
    expect(
      orphans,
      `KIND_METADATA defaults missing from audienceLabels.AUDIENCE_LABEL: ${orphans.join(', ')}. Add a display label so audienceLocked captions don't render raw enum text.`,
    ).toEqual([]);
  });

  it('CANONICAL stays in sync with what kindMetadata + AudiencePicker reference', () => {
    const kmSrc = readFileSync(KIND_METADATA_FILE, 'utf8');
    const apSrc = readFileSync(AUDIENCE_PICKER_FILE, 'utf8');
    const observed = new Set([
      ...extractDefaultAudienceTypes(kmSrc),
      ...extractAudiencePickerKnownTypes(apSrc),
    ]);
    const missingFromCanonical = Array.from(observed).filter((v) => !CANONICAL.includes(v));
    expect(
      missingFromCanonical,
      `Audience types referenced in source but missing from CANONICAL list (and thus production CHECK): ${missingFromCanonical.join(', ')}. Either ship a CHECK-widen migration or remove the reference.`,
    ).toEqual([]);
  });
});
