import { createPortal } from 'react-dom';
import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import StepType from './StepType';
import StepTeam from './StepTeam';
import StepWhen from './StepWhen';
import StepDetails from './StepDetails';
import { useCreateActivity } from '../../hooks/useCreateActivity';

const STEPS = ['Type', 'Team', 'When', 'Details'];

export default function CreateActivityWizard({ orgId, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    eventType: null, teamId: null,
    date: '', startTime: '', endTime: '', durationMinutes: null,
    location: '', locationAddress: '', subLocation: '', arrivalMinutes: 15,
    title: '', opponent: '', homeAway: 'tbd', jersey: '',
    notes: '', coachNotes: '',
    indoor: true, enableRides: false, isScrimmage: false,
  });
  const { create, loading } = useCreateActivity();

  const selectType = (type) => { setForm((f) => ({ ...f, eventType: type })); setStep(1); };
  const selectTeam = (id) => { setForm((f) => ({ ...f, teamId: id })); setStep(2); };

  const handleSave = async () => {
    const result = await create(form);
    if (result) { onCreated?.(); onClose(); }
  };

  const canNext = step === 2 ? (form.date && form.startTime && form.endTime) : true;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'var(--sf-bg-page)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        minHeight: 56, padding: '0 8px 0 4px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--sf-border-default)',
        backgroundColor: 'var(--sf-bg-card)', flexShrink: 0,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <button type="button" onClick={step > 0 ? () => setStep(step - 1) : onClose}
          className="sf-press" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {step > 0
            ? <ArrowLeft size={20} strokeWidth={1.75} color="var(--sf-text-primary)" />
            : <X size={20} strokeWidth={1.75} color="var(--sf-text-primary)" />}
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--sf-text-primary)', flex: 1 }}>
          New Event
        </span>
        <div style={{ display: 'flex', gap: 6, paddingRight: 8 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: i <= step ? 'var(--sf-accent)' : 'var(--sf-border-default)',
            }} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {step === 0 && <StepType value={form.eventType} onSelect={selectType} />}
        {step === 1 && <StepTeam orgId={orgId} value={form.teamId} onSelect={selectTeam} />}
        {step === 2 && <StepWhen data={form} onChange={setForm} />}
        {step === 3 && <StepDetails eventType={form.eventType} data={form} onChange={setForm} />}
      </div>

      {/* Footer — steps 2 and 3 only */}
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
            {loading ? 'Saving...' : step === 3 ? 'Save Event' : 'Next'}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
