import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { checkSlugAvailable, divisionsApplyTo, slugify, statusForProgramType, validateProgramDates } from '../lib/programSetup';

// Re-exported so existing callers keep their import path (ProgramSetupPage
// imports slugify from here); the pure logic lives in lib/programSetup (AP#27).
export { checkSlugAvailable, divisionsApplyTo, slugify, statusForProgramType, validateProgramDates };

// Admin program creation (spec §3, MVP). Writes programs + divisions + division_fees,
// org-scoped via the admin RLS write policies (user_has_role_in_org admin with_check).
// Each result destructures {data,error} and stops on the first error (#36).
export function useProgramSetup() {
  const { orgId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function createProgram(form) {
    setSaving(true);
    setError(null);
    const programType = form.program_type || 'season';
    const dateErr = validateProgramDates(form);
    if (dateErr) { setError(dateErr); setSaving(false); return { ok: false, error: dateErr }; }
    // Always slugify — a typed public link is normalized to lowercase-hyphenated
    // so it can't store mixed-case variants that dodge the uniqueness check (F3).
    const slug = slugify(form.public_slug || form.name);

    const slugErr = await checkSlugAvailable(supabase, orgId, slug);
    if (slugErr) { setError(slugErr); setSaving(false); return { ok: false, error: slugErr }; }

    const { data: prog, error: e1 } = await supabase.from('programs').insert({
      org_id: orgId, name: form.name.trim(), program_type: programType,
      status: statusForProgramType(programType),
      public_slug: slug || null, is_published: !!form.is_published,
      reg_opens_at: form.reg_opens_at || null, reg_closes_at: form.reg_closes_at || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
    }).select('id').single();
    if (e1) { setError(e1.message); setSaving(false); return { ok: false, error: e1.message }; }

    const divInput = divisionsApplyTo(programType)
      ? (form.divisions || []).filter((d) => d.name?.trim())
      : [];
    if (divInput.length) {
      const divRows = divInput.map((d, i) => ({
        org_id: orgId, program_id: prog.id, name: d.name.trim(),
        grade_min: d.grade_min ? parseInt(d.grade_min, 10) : null,
        grade_max: d.grade_max ? parseInt(d.grade_max, 10) : null,
        gender: d.gender || null, team_color: d.team_color || null, sort_order: i + 1,
      }));
      const { data: divs, error: e2 } = await supabase.from('divisions').insert(divRows).select('id, name');
      if (e2) { setError(e2.message); setSaving(false); return { ok: false, error: e2.message }; }

      const feeRows = (divs || []).map((dv) => {
        const match = divInput.find((d) => d.name.trim() === dv.name);
        const cents = Math.round(parseFloat(match?.fee || 0) * 100);
        return { org_id: orgId, division_id: dv.id, name: 'Season Fee', fee_type: 'base', amount_cents: cents, sort_order: 1 };
      }).filter((f) => f.amount_cents > 0);
      if (feeRows.length) {
        const { error: e3 } = await supabase.from('division_fees').insert(feeRows);
        if (e3) { setError(e3.message); setSaving(false); return { ok: false, error: e3.message }; }
      }
    }

    setSaving(false);
    return { ok: true, programId: prog.id, slug };
  }

  return { createProgram, saving, error };
}
