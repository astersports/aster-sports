import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

// VF-11 HARD GATE (SCHEDULE_L99_BUILD_SPEC §8 PR-B'): always-on RSVP may
// only ship on top of the PR-A' batch hook. This import-presence gate
// fails PR-B's check suite if the hook or its card wiring is absent —
// "PR-B' MUST NOT MERGE before PR-A'" enforced in CI rather than by
// reviewer memory. Paths are repo-root relative (vitest cwd).

describe('VF-11 batch-hook presence gate', () => {
  it('useScheduleData exists and exposes the batch maps', () => {
    const src = readFileSync('src/hooks/useScheduleData.js', 'utf8');
    expect(src).toContain('export function useScheduleData');
    expect(src).toContain('childRsvpMap');
    expect(src).toContain('activatedMap');
  });

  it('EventCard consumes batch state (no per-row fetch path on the list)', () => {
    const src = readFileSync('src/components/schedule/EventCard.jsx', 'utf8');
    expect(src).toContain('initialResponse=');
    expect(src).toContain('initialActivated=');
  });

  it('ChildRsvp (shared/) supports the batch-fed props and skips self-fetch', () => {
    const src = readFileSync('src/components/shared/ChildRsvp.jsx', 'utf8');
    expect(src).toContain('initialResponse');
    expect(src).toContain('batchFed');
  });
});
