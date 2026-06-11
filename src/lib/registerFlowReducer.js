// R1 — registration wizard state. Multi-child ONE-submit (D-Q7): children are
// accumulated client-side into children[] and submitted in a SINGLE
// submit_registration call (which is what lets the family-cap discount fire —
// it was dead under the old per-child submit). Pure (AP#27): same input → same
// output, no IO. Phases: 'entry' (filling one child) ↔ 'roster' (the multi-child
// hub) → submit → confirmation.

export const emptyPlayer = () => ({ first_name: '', last_name: '', dob: '', grade: '', gender: '' });
export const emptyDetails = () => ({ jersey_size: '', shorts_size: '', emergency_contact_name: '', emergency_contact_phone: '', medical_notes: '' });
export const emptyGuardian = () => ({ first_name: '', last_name: '', email: '', phone: '', relationship: 'parent', sms_opt_in: false });
const emptyDraft = (divisionId) => ({ divisionId: divisionId || '', player: emptyPlayer(), details: emptyDetails() });

export const init = (divisionId) => ({
  phase: 'entry', step: 0, submitted: false,
  guardian: emptyGuardian(), coGuardian: null,
  children: [], draft: emptyDraft(divisionId), editIndex: null,
  authed: false,
});

export function reducer(s, a) {
  switch (a.type) {
    case 'FIELD':
      if (a.section === 'player' || a.section === 'details')
        return { ...s, draft: { ...s.draft, [a.section]: { ...s.draft[a.section], [a.field]: a.value } } };
      return { ...s, [a.section]: { ...s[a.section], [a.field]: a.value } };
    case 'DIVISION': return { ...s, draft: { ...s.draft, divisionId: a.value } };
    case 'TOGGLE_COG': return { ...s, coGuardian: s.coGuardian ? null : { first_name: '', last_name: '', email: '', phone: '', relationship: 'parent' } };
    case 'STEP': return { ...s, step: a.step };
    // B3 funnel: an authenticated parent with children starts on the select phase,
    // with their guardian identity pre-filled (the submit upserts by email → no dup).
    case 'AUTHED_INIT':
      return { ...s, authed: true, guardian: { ...emptyGuardian(), ...a.guardian }, phase: a.select ? 'select' : 'entry' };
    // Selected existing children -> children[] carrying their real player_id (the
    // (program, player_id) guard then dedupes), then to the roster hub for review.
    case 'SELECT_CHILDREN': {
      const picked = a.picks.map((p) => ({
        division_id: a.divisionId,
        player: { ...emptyPlayer(), player_id: p.player_id, first_name: p.first_name, last_name: p.last_name, grade: p.grade ?? '', gender: p.gender ?? '' },
        details: emptyDetails(),
      }));
      return { ...s, children: [...s.children, ...picked], phase: 'roster', draft: emptyDraft(''), editIndex: null, step: 0 };
    }
    case 'COMMIT_CHILD': {
      const child = { division_id: s.draft.divisionId, player: s.draft.player, details: s.draft.details };
      const children = s.editIndex != null ? s.children.map((c, i) => (i === s.editIndex ? child : c)) : [...s.children, child];
      return { ...s, children, phase: 'roster', draft: emptyDraft(''), editIndex: null, step: 0 };
    }
    case 'ADD_CHILD': return { ...s, phase: 'entry', step: 0, editIndex: null, draft: emptyDraft(a.divisionId || '') };
    case 'EDIT_CHILD': {
      const c = s.children[a.index];
      return { ...s, phase: 'entry', step: 0, editIndex: a.index, draft: { divisionId: c.division_id, player: c.player, details: c.details } };
    }
    case 'REMOVE_CHILD': return { ...s, children: s.children.filter((_, i) => i !== a.index) };
    case 'CANCEL_ENTRY': return { ...s, phase: 'roster', draft: emptyDraft(''), editIndex: null, step: 0 };
    case 'SUBMITTED': return { ...s, submitted: true };
    default: return s;
  }
}

// The per-child entry sub-sequence. Guardian is collected ONCE (first child only)
// — and SKIPPED entirely for an authenticated parent (identity pre-filled via
// AUTHED_INIT). The division step appears only for a brand-new subsequent child in a
// MULTI-division program — a single-division program (incl. every non-season implicit
// unit) auto-uses the one division, so the word "division" never surfaces there.
export function entrySeq({ children, editIndex, authed }, onlyOneDivision) {
  if (editIndex != null) return ['player', 'details'];
  if (children.length === 0) return authed ? ['player', 'details'] : ['player', 'guardian', 'details'];
  return onlyOneDivision ? ['player', 'details'] : ['division', 'player', 'details'];
}
