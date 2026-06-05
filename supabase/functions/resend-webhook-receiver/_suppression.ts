// Pure suppression decision for the Resend webhook receiver, extracted to its
// own dependency-free module so it is unit-testable under vitest (the receiver
// index.ts calls Deno.serve at module load + imports esm.sh, so it can't be
// imported into a Node test). No Deno / no esm.sh imports here — keep it pure.
//
// Should this Resend event permanently suppress the guardian (write
// guardian_email_preferences.unsubscribed_at)?
//   - email.complained — ALWAYS (a spam report is an unambiguous "stop").
//   - email.bounced — ONLY when the bounce is permanent/hard. Resend's bounce
//     payload carries data.bounce.type ("Permanent" | "Transient" |
//     "Undetermined"). Soft/transient bounces (full mailbox, greylisting) are
//     recoverable and must NOT permanently suppress. Absent or non-"Permanent"
//     type → do NOT suppress (fail-safe toward not over-suppressing).
export function shouldSuppress(eventType: string, data: { bounce?: { type?: string } }): boolean {
  if (eventType === "email.complained") return true;
  if (eventType === "email.bounced") {
    return (data?.bounce?.type ?? "").toLowerCase() === "permanent";
  }
  return false;
}
