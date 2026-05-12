// Wave 4.8 6c Session 1 — Deno tests for the kind-scoped expiry helper.
// Mirrors the vitest cases at src/lib/cron/__tests__/briefingCronHelpers.test.js
// per anti-pattern #30 ("the two files MUST stay in sync"). Run via:
//   deno test supabase/functions/briefing-auto-draft-tick/__tests__/computeExpiry.test.ts
//
// CC may not have Deno installed locally — that's fine. The test ships
// with the function and runs in Supabase's deploy-time test runner.

import { assertEquals, assertStrictEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeExpiryForKind } from "../_helpers.ts";

const NOW = new Date("2026-05-12T16:00:00Z");
const ANCHOR = new Date("2026-05-15T20:00:00Z"); // 3 days in future

Deno.test("a. game_recap: anchor + 14d", () => {
  assertEquals(
    computeExpiryForKind("game_recap", ANCHOR, NOW).toISOString(),
    new Date(ANCHOR.getTime() + 14 * 86400000).toISOString(),
  );
});

Deno.test("a2. game_recap fallback to (now + 14d) when anchor null", () => {
  assertEquals(
    computeExpiryForKind("game_recap", null, NOW).toISOString(),
    new Date(NOW.getTime() + 14 * 86400000).toISOString(),
  );
});

Deno.test("b. tournament_prelim returns anchor verbatim (no extra interval)", () => {
  assertStrictEquals(computeExpiryForKind("tournament_prelim", ANCHOR, NOW), ANCHOR);
});

Deno.test("c. tournament_prelim falls back to (now + 14d) when anchor null", () => {
  assertEquals(
    computeExpiryForKind("tournament_prelim", null, NOW).toISOString(),
    new Date(NOW.getTime() + 14 * 86400000).toISOString(),
  );
});

Deno.test("d. schedule_change ignores anchor entirely (always now + 7d)", () => {
  assertEquals(
    computeExpiryForKind("schedule_change", ANCHOR, NOW).toISOString(),
    new Date(NOW.getTime() + 7 * 86400000).toISOString(),
  );
});

Deno.test("e. rsvp_nudge falls back to (now + 3d) when anchor null", () => {
  assertEquals(
    computeExpiryForKind("rsvp_nudge", null, NOW).toISOString(),
    new Date(NOW.getTime() + 3 * 86400000).toISOString(),
  );
});

Deno.test("f. unknown kind falls through to default (now + 14d)", () => {
  assertEquals(
    computeExpiryForKind("totally_unknown", null, NOW).toISOString(),
    new Date(NOW.getTime() + 14 * 86400000).toISOString(),
  );
});
