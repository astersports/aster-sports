// Per-message gated signoff section builder (one source of truth for every
// briefing kind — replaces the per-resolver inline blocks + the duplicated
// coachRoundup/familyGuide helpers; PATTERN A / AP #63 consolidation).
//
// Contact information is OFF by default. The coach signature line ("— Frank,
// Coach Kenny & Coach Darien") AND the contact block (name · title · phone)
// render ONLY when the admin opts in per message:
//   overrides.signoff_enabled === true   (the toggle)
//   overrides.signoff_coaches            (the chosen staff — who to include)
//
// `signoff_coaches` carries the selected staff objects directly from the
// compose-time picker ({ user_id, display_name, title, phone }) — so no
// resolver fetch or org.coaches plumbing is needed, and the selection is
// uniform across every recipient slice.
//
// signoff_message prose is independent of the toggle: a closing note still
// renders whenever the admin writes one. Returns null when nothing renders
// (callers do `if (s) sections.push(s)`).
//
// Pure (AP #27): same overrides -> same section.

import { buildVoiceSignature } from './voiceSignature';

export function buildSignoffSection({ overrides = {} } = {}) {
  const prose = (overrides.signoff_message || '').trim();
  const enabled = overrides.signoff_enabled === true;
  const picked = enabled && Array.isArray(overrides.signoff_coaches) ? overrides.signoff_coaches : [];
  const signature = buildVoiceSignature(picked);
  const coaches = picked
    .filter((c) => c && c.display_name && c.phone)
    .map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  if (!prose && !signature && !coaches.length) return null;
  return { kind: 'signoff', prose, signature, coaches };
}
