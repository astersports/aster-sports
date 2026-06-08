// G7 — F-FAILCLOSED coverage (audit SEAM-1). Stacks on G5 PR 1b's decidePilotGate
// kernel. PR 1b's sendDispatch.test.js covers the kernel's core cases (pilotMode
// false / all-pilot / one-non-pilot). G7 adds the two things those don't:
//   (1) the all-BCC / REDIRECT sub-hole — an all-null-guardian queue produces an
//       EMPTY guardians array, so the gate does NOT abort. This is BY DESIGN (admin
//       BCC rows carry no guardian_id and are always allowed), not a hole — locked
//       explicitly so a future refactor can't silently turn it into a fail-open.
//   (2) the fail-closed DEFAULT at the SEND seams: a missing/unreadable
//       organization_settings row must resolve pilot_mode_enabled to TRUE (pilot on),
//       so a new/misconfigured org can never fail-OPEN to a full-family blast. The
//       kernel takes pilotMode as a param, so this default lives at the callsites
//       (send-tournament-message/index.ts + briefing-auto-draft-tick/_redrive.ts).
//       pilotFailCloseParity.test.js locks the same default for the 9 resolvers;
//       this locks it for the two direct send paths. Static-grep, same shape.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { decidePilotGate } from '../briefings/sendDispatch';

describe('G7 — decidePilotGate: all-BCC / REDIRECT sub-hole is intentional', () => {
  it('empty guardians (all-BCC queue) + pilot mode → NO abort (admin BCC always allowed)', () => {
    const d = decidePilotGate([], true);
    expect(d.abort).toBe(false);
    expect(d.nonPilotCount).toBe(0);
    expect(d.nonPilotEmails).toEqual([]);
  });
  it('null/undefined guardians arg → NO abort (defensive, no throw)', () => {
    expect(decidePilotGate(null, true).abort).toBe(false);
    expect(decidePilotGate(undefined, true).abort).toBe(false);
  });
  it('a single non-pilot guardian among BCC-style nulls still aborts (the gate bites)', () => {
    const d = decidePilotGate([{ email: 'real@fam.com', is_pilot_family: false }], true);
    expect(d.abort).toBe(true);
    expect(d.nonPilotEmails).toEqual(['real@fam.com']);
  });
});

describe('G7 — fail-closed pilot DEFAULT at the send seams (missing settings → pilot ON)', () => {
  const sendIndex = readFileSync('supabase/functions/send-tournament-message/index.ts', 'utf8');
  const redrive = readFileSync('supabase/functions/briefing-auto-draft-tick/_redrive.ts', 'utf8');

  it('send-tournament-message defaults pilot_mode_enabled to TRUE when the settings row is absent', () => {
    expect(sendIndex).toMatch(/pilot_mode_enabled\s*\?\?\s*true/);
    expect(sendIndex).not.toMatch(/pilot_mode_enabled\s*\?\?\s*false/);
  });
  it('the cron redrive sweep also defaults pilot ON (and treats a settings-lookup error as pilot ON)', () => {
    expect(redrive).toMatch(/pilot_mode_enabled\s*\?\?\s*true/);
    expect(redrive).not.toMatch(/pilot_mode_enabled\s*\?\?\s*false/);
    // osErr ? true : (... ?? true) — a lookup error must fail closed (pilot on), not send.
    expect(redrive).toMatch(/osErr\s*\?\s*true/);
  });
});
