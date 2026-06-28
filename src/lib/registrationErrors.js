// B3 (§16.3 kindness mandate) — maps submit_registration RPC error codes to warm,
// actionable, parent-facing microcopy. Pure (AP#27): no IO, same input → same
// output. The RPC RAISEs these codes as the Postgres error message; PostgREST
// surfaces the text on error.message, so we match the known code as a substring.
// routeTo='player' marks the hard violations the architect wants routed back to
// the player step (no soft-warn-then-server-reject). `already_registered` is
// informational (a result field, never raised) and `gender_mismatch` lands with
// M2 enforcement — both mapped here for completeness so the 9-code set is whole.
const CODES = {
  registration_closed: { message: 'Registration for this program isn’t open right now. Check back soon, or reach out to your program admin.' },
  no_children: { message: 'Add at least one player before reserving a spot.' },
  too_many_children: { message: 'That’s more players than we can register at once. Reserve up to 10, then add the rest after.' },
  guardian_email_required: { message: 'We need a parent email to send your confirmation. Add one and try again.' },
  invalid_division: { message: 'That division isn’t available for this program anymore. Go back and pick another to continue.' },
  grade_below_band: { message: 'Your player’s grade is below this division’s range. Pick a division that fits their grade, or contact your program admin.', routeTo: 'player' },
  grade_above_band: { message: 'Your player’s grade is above this division’s range. Pick a division that fits their grade, or contact your program admin.', routeTo: 'player' },
  gender_mismatch: { message: 'This division doesn’t match your player’s division group. Pick a division that fits, or contact your program admin.', routeTo: 'player' },
  already_registered: { message: 'This player is already registered for this program.' },
};
const FALLBACK = { message: 'Looks like that didn’t go through. Try again in a moment.' };

// Returns { code, message, routeTo? }. code is null when the error doesn't match
// a known RPC code (network/transient) — the fallback microcopy then applies.
export function registrationErrorInfo(error) {
  const raw = (typeof error === 'string' ? error : error?.message) || '';
  const code = Object.keys(CODES).find((c) => new RegExp('\\b' + c + '\\b').test(raw));
  return code ? { code, ...CODES[code] } : { code: null, ...FALLBACK };
}
