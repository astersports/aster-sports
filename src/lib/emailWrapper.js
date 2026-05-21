// Platform PR ε (E2) — shared email-body wrapper constants.
//
// Each send helper (digestSend, rsvpNudgeSend, academyCallupSend,
// scheduleChangeSend) previously hardcoded the same outer <div> around
// rendered section HTML. Duplicating the literal across files invited
// drift: a typo in one file's padding/max-width/font-family would
// produce silently different bodies across kinds.
//
// Constants only — no helpers or template literals here. Callers
// concatenate explicitly: EMAIL_WRAPPER_OPEN + renderSections(...) +
// EMAIL_WRAPPER_CLOSE.
//
// Renderers, queueComposedMessages, composerSubmit, and PreviewPanel
// also use the same literal but are NOT migrated by Platform PR ε —
// see L99 platform audit PART 5 Phase 3 PR ε for the locked scope.

export const EMAIL_WRAPPER_CLOSE = '</div>';
export const EMAIL_WRAPPER_OPEN = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">';
