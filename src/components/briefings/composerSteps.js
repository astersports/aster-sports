// Wave 4.4-B housekeeping — STEPS extracted to its own leaf module
// so composerReducer.js can import it without creating a cycle.
// briefingComposerHelpers.js imports INITIAL_STATE from
// composerReducer.js, so reducer can't import STEPS from helpers.
// This module has no imports — leaf-safe for both consumers.

export const STEPS = ['Kind', 'Audience', 'Body', 'Send'];
