// Voice signature — the narrative sign-off line ("Frank & Coach Kenny";
// team-aware "Frank, Coach Kenny & Coach Darien" once Darien is on the
// team's team_staff). Per architect decision (docs/ARCH_DECISIONS_HUB_S1.txt
// C3), the narrative signs in voice from the ACTUAL coaching staff — not a
// hardcoded literal and not a hardcoded "9U/8U" check. The names are
// data-driven: the org Program Director (org-level, always) + the game's
// team's coaches (from team_staff). See fetchSignatureCoaches (the IO half).
//
// Pure (AP #27): same input -> same string. No IO, no supabase import.

// Natural-list join of display names: [] -> ''; [a] -> 'a';
// [a,b] -> 'a & b'; [a,b,c] -> 'a, b & c'. The final separator is an
// ampersand (Frank's voice), not "and"; the Oxford comma is dropped before
// the ampersand to read as a signature, not a sentence.
export function buildVoiceSignature(coaches) {
  const names = (coaches || [])
    .map((c) => (typeof c === 'string' ? c : c?.display_name) || '')
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}
