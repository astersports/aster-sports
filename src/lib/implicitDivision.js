// D1 — non-season programs (tryout/camp/clinic/evaluation/interest_list/other)
// carry their single flat fee as ONE implicit division (gender='coed', no grade
// band). The word "division" NEVER surfaces for these types — the funnel skips
// the picker and the admin sees a "<Type> fee" field. One funnel, one fee source
// (division_fees), so the #63 money path is unchanged (registration_fees <-
// division_fees base, B0 reconciliation identical).
//
// IO injected (AP#27 spirit): callers pass the supabase client. submit_registration
// already skips the grade gate on a null band and has no gender check, so a coed/
// no-band unit never false-blocks (architect build-verify, confirmed against the
// live RPC 2026-06-10).

// Current flat fee in cents for a non-season program's implicit unit, or null when
// no unit/fee exists yet (admin hasn't set it → the live link still dead-ends).
export async function loadImplicitFeeCents(supabase, programId) {
  const { data: div, error: e0 } = await supabase
    .from('divisions').select('id').eq('program_id', programId).order('sort_order').limit(1).maybeSingle();
  if (e0) throw e0;
  if (!div) return null;
  const { data: fee, error: e1 } = await supabase
    .from('division_fees').select('amount_cents').eq('division_id', div.id).eq('fee_type', 'base').limit(1).maybeSingle();
  if (e1) throw e1;
  return fee ? fee.amount_cents : null;
}

// Create the implicit unit if absent, then set its base fee. Returns the division id.
// programName names the unit (it reads as the program name in the funnel, since the
// word "division" never surfaces). amountCents must be > 0 (the fee is the whole point).
export async function upsertImplicitFee(supabase, { orgId, programId, programName, amountCents }) {
  const { data: existing, error: e0 } = await supabase
    .from('divisions').select('id').eq('program_id', programId).order('sort_order').limit(1).maybeSingle();
  if (e0) throw e0;

  let divisionId = existing?.id;
  if (!divisionId) {
    const { data: div, error: e1 } = await supabase.from('divisions').insert({
      org_id: orgId, program_id: programId, name: programName, gender: 'coed',
      grade_min: null, grade_max: null, sort_order: 1,
    }).select('id').single();
    if (e1) throw e1;
    divisionId = div.id;
  }

  const { data: fee, error: e2 } = await supabase
    .from('division_fees').select('id').eq('division_id', divisionId).eq('fee_type', 'base').limit(1).maybeSingle();
  if (e2) throw e2;
  if (fee?.id) {
    const { error: e3 } = await supabase.from('division_fees').update({ amount_cents: amountCents }).eq('id', fee.id);
    if (e3) throw e3;
  } else {
    const { error: e4 } = await supabase.from('division_fees').insert({
      org_id: orgId, division_id: divisionId, name: 'Registration Fee', fee_type: 'base', amount_cents: amountCents, sort_order: 1,
    });
    if (e4) throw e4;
  }
  return divisionId;
}
