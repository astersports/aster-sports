import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StepType from './StepType';
import StepTeam from './StepTeam';
import StepWhen from './StepWhen';
import StepDetails from './StepDetails';
import { EMPTY_FORM, eventToForm } from './wizardForm';
import { useCreateActivity } from '../../hooks/useCreateActivity';
import { useUpdateActivity } from '../../hooks/useUpdateActivity';
import { useConflictCheck } from '../../hooks/useConflictCheck';

const STEPS = ['Type', 'Team', 'When', 'Details'];
const EDIT_STEPS = ['When', 'Details'];

export default function CreateActivityWizard({ orgId, editEvent, editMode = 'single', onClose, onCreated }) {
  const isEdit = !!editEvent;
  const [step, setStep] = useState(isEdit ? 2 : 0);
  const [form, setForm] = useState(isEdit ? eventToForm(editEvent) : EMPTY_FORM);
  const conflicts = useConflictCheck(step, form, isEdit ? editEvent.id : null);
  const { create, loading: creating } = useCreateActivity();
  const { update, updateSeries, loading: updating } = useUpdateActivity();
  const loading = creating || updating;

  const selectType = (type) => { setForm((f) => ({ ...f, eventType: type })); setStep(1); };
  const selectTeam = (id) => { setForm((f) => ({ ...f, teamId: id })); setStep(2); };

  // On edit, load existing series recurrence (pattern + until) by
  // querying siblings. eventToForm can't do this — it's synchronous.
  useEffect(() => {
    if (!isEdit || !editEvent?.parent_event_id) return;
    supabase.from('events').select('start_at')
      .eq('parent_event_id', editEvent.parent_event_id)
      .order('start_at', { ascending: true })
      .then(({ data }) => {
        if (!data || data.length < 2) return;
        const days = Math.round((new Date(data[1].start_at) - new Date(data[0].start_at)) / 86400000);
        const pattern = days === 14 ? 'biweekly' : 'weekly';
        const until = data[data.length - 1].start_at.slice(0, 10);
        setForm((f) => ({ ...f, recurrence: { pattern, until } }));
      });
  }, [isEdit, editEvent?.parent_event_id]);

  const handleSave = async () => {
    let result;
    if (isEdit) {
      result = editMode === 'series'
        ? await updateSeries(editEvent.id, editEvent.parent_event_id, editEvent.start_at, form)
        : await update(editEvent.id, form);
    } else {
      result = await create(form);
    }
    if (result?.data) { onCreated?.(); onClose(); }
    else if (result?.error) { window.alert(`Save failed: ${result.error}`); }
  };

  const canNext = step === 2 ? (form.date && form.startTime && form.endTime) : true;
  const backStop = isEdit ? 2 : 0;
  const dots = isEdit ? EDIT_STEPS : STEPS;
  const dotIndex = isEdit ? step - 2 : step;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'var(--sf-bg-page)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        minHeight: 56, padding: '0 8px 0 4px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--sf-border-default)',
        backgroundColor: 'var(--sf-bg-card)', flexShrink: 0,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <button type="button" onClick={step > backStop ? () => setStep(step - 1) : onClose}
          className="sf-press" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {step > backStop
            ? <ArrowLeft size={20} strokeWidth={1.75} color="var(--sf-text-primary)" />
            : <X size={20} strokeWidth={1.75} color="var(--sf-text-primary)" />}
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--sf-text-primary)', flex: 1 }}>
          {isEdit ? 'Edit Event' : 'New Event'}
        </span>
        <div style={{ display: 'flex', gap: 6, paddingRight: 8 }}>
          {dots.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: i <= dotIndex ? 'var(--sf-accent)' : 'var(--sf-border-default)',
            }} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        {step === 0 && <StepType value={form.eventType} onSelect={selectType} />}
        {step === 1 && <StepTeam orgId={orgId} value={form.teamId} onSelect={selectTeam} />}
        {step === 2 && <StepWhen data={form} onChange={setForm} isEdit={isEdit} orgId={orgId} />}
        {step === 3 && <StepDetails eventType={form.eventType} data={form} onChange={setForm} />}
      </div>

      {step === 2 && conflicts.length > 0 && (
        <div style={{
          padding: '10px 16px', backgroundColor: 'var(--sf-warning-soft)',
          borderTop: '1px solid var(--sf-warning)', flexShrink: 0,
          fontSize: 13, color: 'var(--sf-warning)', fontWeight: 500,
        }}>
          Conflicts with: {conflicts.map((c) => c.title).join(', ')}. You can save anyway.
        </div>
      )}

      {step >= 2 && (
        <div style={{
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--sf-border-default)',
          backgroundColor: 'var(--sf-bg-card)', flexShrink: 0,
        }}>
          <button type="button"
            onClick={step === 3 ? handleSave : () => setStep(step + 1)}
            disabled={loading || !canNext}
            className="sf-press sf-bounce-tap"
            style={{
              width: '100%', minHeight: 48, borderRadius: 12, border: 'none',
              backgroundColor: canNext ? 'var(--sf-accent)' : 'var(--sf-bg-tertiary)',
              color: canNext ? 'var(--sf-text-inverse)' : 'var(--sf-text-tertiary)',
              fontSize: 16, fontWeight: 600, opacity: loading ? 0.6 : 1,
            }}>
            {loading ? 'Saving...' : step === 3 ? (isEdit ? 'Save Changes' : 'Save Event') : 'Next'}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
