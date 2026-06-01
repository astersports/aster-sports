import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function slugify(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

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
    const slug = (form.public_slug || '').trim() || slugify(form.name);

    const { data: prog, error: e1 } = await supabase.from('programs').insert({
      org_id: orgId, name: form.name.trim(), program_type: 'season',
      // status='archived' (NOT the table default 'active'): a newly-created program must not
      // silently become a second active season and hijack the admin-home season/health cards.
      // Admin promotes it via the Seasons "set active" flow when the season actually starts.
      status: 'archived',
      public_slug: slug || null, is_published: !!form.is_published,
      reg_opens_at: form.reg_opens_at || null, reg_closes_at: form.reg_closes_at || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
    }).select('id').single();
    if (e1) { setError(e1.message); setSaving(false); return { ok: false, error: e1.message }; }

    const divInput = (form.divisions || []).filter((d) => d.name?.trim());
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
