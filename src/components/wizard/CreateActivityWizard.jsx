import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';
import { useAuth } from '../../context/AuthContext';
import StepType from './StepType';
import StepTeam from './StepTeam';
import StepWhen from './StepWhen';
import StepDetails from './StepDetails';
import WizardHeader from './WizardHeader';
import { buildSaveDiff, EMPTY_FORM, eventToForm } from './wizardForm';
import { useCreateActivity } from '../../hooks/useCreateActivity';
import { useUpdateActivity } from '../../hooks/useUpdateActivity';
import { useConflictCheck } from '../../hooks/useConflictCheck';

const STEPS = ['Type', 'Team', 'When', 'Details']; const EDIT_STEPS = ['When', 'Details'];
export default function CreateActivityWizard({ orgId, editEvent, editMode = 'single', onClose, onCreated }) {
  const isEdit = !!editEvent; const { showToast } = useToast();
  const { org } = useAuth(); // feature-gate the rides/duties offers (L99 B1)
  const [step, setStep] = useState(isEdit ? 2 : 0);
  const [form, setForm] = useState(isEdit ? eventToForm(editEvent) : EMPTY_FORM);
  const conflicts = useConflictCheck(step, form, isEdit ? editEvent.id : null);
  const { create, loading: creating } = useCreateActivity();
  const { update, updateSeries, loading: updating } = useUpdateActivity();
  const loading = creating || updating;

  const selectType = (type) => { setForm((f) => ({ ...f, eventType: type })); setStep(1); };
  const selectTeam = (id) => { setForm((f) => ({ ...f, teamId: id })); setStep(2); };

  // On edit, load recurrence (pattern + until) from sibling dates.
  // Phase 1 audit P1-2 (docs/AUDIT_PHASE1_WIRING_2026-05-16.md):
  // org_id added as defense-in-depth; parent_event_id isolation is
  // practically sufficient but the canonical pattern requires org scope.
  useEffect(() => {
    if (!isEdit || !editEvent?.parent_event_id || !orgId) return;
    supabase.from('events').select('start_at')
      .eq('org_id', orgId)
      .eq('parent_event_id', editEvent.parent_event_id)
      .order('start_at', { ascending: true })
      .then(({ data }) => {
        if (!data || data.length < 2) return;
        const days = Math.round((new Date(data[1].start_at) - new Date(data[0].start_at)) / 86400000);
        const pattern = days === 14 ? 'biweekly' : 'weekly';
        const until = data[data.length - 1].start_at.slice(0, 10);
        setForm((f) => ({ ...f, recurrence: { pattern, until } }));
      });
  }, [isEdit, editEvent?.parent_event_id, orgId]);

  // On edit, load existing volunteer slots into the DutyEditor.
  useEffect(() => {
    if (!isEdit || !editEvent?.id) return;
    supabase.from('event_duties').select('*').eq('event_id', editEvent.id)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const grouped = {};
        data.forEach((d) => {
          if (!grouped[d.duty_name]) grouped[d.duty_name] = { duty_name: d.duty_name, slots_needed: 0, claimed: 0 };
          grouped[d.duty_name].slots_needed += 1;
          if (d.claimed_by_name || d.guardian_id) grouped[d.duty_name].claimed += 1;
        });
        setForm((f) => ({ ...f, duties: Object.values(grouped) }));
      });
  }, [isEdit, editEvent?.id]);
  const handleSave = async () => {
    let result;
    const diff = isEdit ? buildSaveDiff({ editEvent, form, editMode }) : null;
    if (isEdit) {
      const isInstance = editMode === 'instance' || editMode === 'single';
      result = isInstance
        ? await update(editEvent.id, form)
        : await updateSeries(editEvent.id, editEvent.parent_event_id, editEvent.start_at, form, editMode);
    } else {
      result = await create(form);
    }
    if (result?.data) { onCreated?.(diff); onClose(); }
    else if (result?.error) { console.error('CreateActivityWizard save:', result.error); showToast("Couldn't save. Try again?", 'error'); }
  };
  // Step-3 validation: games + tournaments require an opponent.
  // Frank-reported 2026-05-20 ("Opponents should be a mandatory field").
  // Block-disable the save button so admin can't ship a game-type
  // event with no opponent. Practice events have no opponent concept.
  const isGameType = form.eventType === 'game' || form.eventType === 'tournament';
  const opponentOK = !isGameType || (form.opponent || '').trim().length > 0;
  const canNext = step === 2 ? (form.date && form.startTime && form.endTime)
    : step === 3 ? opponentOK
    : true;
  const backStop = isEdit ? 2 : 0;
  const dots = isEdit ? EDIT_STEPS : STEPS;
  const dotIndex = isEdit ? step - 2 : step;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'var(--as-bg-page)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <WizardHeader step={step} backStop={backStop} isEdit={isEdit} dots={dots} dotIndex={dotIndex}
        onBack={() => setStep(step - 1)} onClose={onClose} />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        {step === 0 && <StepType value={form.eventType} onSelect={selectType} />}
        {step === 1 && <StepTeam orgId={orgId} value={form.teamId} onSelect={selectTeam} />}
        {step === 2 && <StepWhen data={form} onChange={setForm} isEdit={isEdit} orgId={orgId} />}
        {step === 3 && <StepDetails eventType={form.eventType} data={form} onChange={setForm} orgId={orgId} org={org} />}
      </div>

      {step === 2 && conflicts.length > 0 && (
        <div style={{
          padding: '10px 16px', backgroundColor: 'var(--as-warning-soft)',
          borderTop: '1px solid var(--as-warning)', flexShrink: 0,
          fontSize: 13, color: 'var(--as-warning)', fontWeight: 500,
        }}>
          Conflicts with: {conflicts.map((c) => c.title).join(', ')}. You can save anyway.
        </div>
      )}

      {step >= 2 && (
        <div style={{
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--as-border-default)',
          backgroundColor: 'var(--as-bg-card)', flexShrink: 0,
        }}>
          {/* A3: disabled-reason for the When step (Details explains its own). */}
          {step === 2 && !canNext && (
            <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginBottom: 8, textAlign: 'center' }}>
              Add a date, start, and end time to continue.
            </div>
          )}
          <button type="button"
            onClick={step === 3 ? handleSave : () => setStep(step + 1)}
            disabled={loading || !canNext}
            className="as-press as-bounce-tap"
            style={{
              width: '100%', minHeight: 48, borderRadius: 10, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: canNext ? 'var(--as-accent)' : 'var(--as-bg-tertiary)',
              color: canNext ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)',
              fontSize: 17, fontWeight: 600, opacity: loading ? 0.6 : 1,
            }}>
            {loading ? <><Loader2 size={18} strokeWidth={1.75} className="as-spin" /> Saving…</> : step === 3 ? (isEdit ? 'Save Changes' : 'Save Event') : 'Next'}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
