import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { programBadge } from '../../../lib/programGrouping';
import { formatCurrency } from '../../../lib/formatters';
import { useProgramFlatFee } from '../../../hooks/useProgramFlatFee';
import { Field, TextInput } from '../../register/fields';
import { primaryBtn } from '../../register/registerStyles';

// D1 — admin flat-fee capture for a non-season program (tryout/camp/clinic/...).
// Writing it creates/updates the implicit division + its base fee, which is what
// makes the live Fall 2026 Tryouts registrable. Labeled by program type ("Tryout
// fee", "Camp fee", …). The word "division" never appears.
export default function ProgramFlatFeeEditor({ program }) {
  const { orgId } = useAuth();
  const { cents, loading, saving, error, save } = useProgramFlatFee(program.id, orgId, program.name);
  const [edited, setEdited] = useState(null); // null until the admin types
  const [savedTick, setSavedTick] = useState(false);

  // Derive the displayed value — no set-state-in-effect: show the loaded fee
  // until the admin edits, then their input.
  const dollars = edited != null ? edited : (cents != null ? (cents / 100).toFixed(2) : '');
  const label = `${programBadge(program.program_type).label} fee`;
  async function onSave() {
    const r = await save(dollars);
    if (r.ok) { setSavedTick(true); setTimeout(() => setSavedTick(false), 2000); }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={secLabel}>Registration fee</div>
      <Field label={label} htmlFor="flat-fee">
        <TextInput id="flat-fee" type="number" inputMode="decimal" value={dollars} onChange={setEdited} placeholder="45.00" />
      </Field>
      <p style={hint}>
        {cents == null && !loading
          ? 'Set this program’s flat per-child fee — the public link can’t take registrations until it’s set.'
          : 'Flat per-child fee for this program. Editable anytime.'}
      </p>
      {error && <div role="alert" style={errStyle}>{error}</div>}
      <button type="button" className="as-press" style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }} disabled={saving || loading} onClick={onSave}>
        {saving ? 'Saving…' : savedTick ? '✓ Saved' : cents == null ? `Set fee` : `Update fee${cents != null ? ` · ${formatCurrency(cents)}` : ''}`}
      </button>
    </div>
  );
}

const secLabel = { fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', margin: '0 4px 8px' };
const hint = { fontSize: 12, color: 'var(--as-text-tertiary)', margin: '0 0 10px' };
const errStyle = { padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 13, marginBottom: 8 };
