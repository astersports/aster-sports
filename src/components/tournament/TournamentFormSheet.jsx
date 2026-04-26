import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import TeamMultiSelect from './TeamMultiSelect';
import { useTournaments } from '../../hooks/useTournaments';
import { useToast } from '../../context/useToast';

const CIRCUITS = ['AAU Zero Gravity', 'League Play', 'Independent', 'Other'];
const STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'cancelled', label: 'Cancelled' },
];

const emptyForm = {
  name: '', circuit: 'AAU Zero Gravity', start_date: '', end_date: '',
  primary_venue: '', primary_venue_address: '', tourney_url: '', hotel_url: '',
  survival_notes: '', status: 'scheduled', teamIds: [],
};

export default function TournamentFormSheet({ tournament, onClose }) {
  const { create, update } = useTournaments();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => {
    if (!tournament) return emptyForm;
    return {
      name: tournament.name || '',
      circuit: tournament.circuit || 'AAU Zero Gravity',
      start_date: tournament.start_date || '',
      end_date: tournament.end_date || '',
      primary_venue: tournament.primary_venue || '',
      primary_venue_address: tournament.primary_venue_address || '',
      tourney_url: tournament.tourney_url || '',
      hotel_url: tournament.hotel_url || '',
      survival_notes: tournament.survival_notes || '',
      status: tournament.status || 'scheduled',
      teamIds: (tournament.teams || []).map((t) => t.id),
    };
  });

  const patch = (updates) => setForm((f) => ({ ...f, ...updates }));
  const valid = form.name.trim() && form.start_date && form.end_date &&
    form.start_date <= form.end_date && form.teamIds.length > 0;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const { error } = tournament ? await update(tournament.id, form) : await create(form);
    setSaving(false);
    if (error) { showToast(`Save failed: ${error.message}`, 'error'); return; }
    showToast(tournament ? 'Tournament updated' : 'Tournament created');
    onClose();
  };

  const label = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)', marginBottom: 6, display: 'block' };
  const input = {
    width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)',
    color: 'var(--em-text-primary)', fontSize: 14, fontFamily: 'Inter, sans-serif',
  };
  const section = { marginBottom: 18 };
  const disabled = !valid || saving;

  return (
    <FullScreenForm open={true} title={tournament ? 'Edit Tournament' : 'New Tournament'} onClose={onClose}>
      <div style={section}>
        <label style={label} htmlFor="t-name">Name</label>
        <input id="t-name" type="text" value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="ZG NY Metro Showdown" style={input} />
      </div>
      <div style={section}>
        <label style={label} htmlFor="t-circuit">Circuit</label>
        <select id="t-circuit" value={form.circuit} onChange={(e) => patch({ circuit: e.target.value })} style={input}>
          {CIRCUITS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ ...section, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={label} htmlFor="t-start">Start date</label>
          <input id="t-start" type="date" value={form.start_date} onChange={(e) => patch({ start_date: e.target.value })} style={input} />
        </div>
        <div>
          <label style={label} htmlFor="t-end">End date</label>
          <input id="t-end" type="date" value={form.end_date} onChange={(e) => patch({ end_date: e.target.value })} style={input} />
        </div>
      </div>
      <div style={section}>
        <label style={label}>Teams attending</label>
        <TeamMultiSelect selectedIds={form.teamIds} onChange={(ids) => patch({ teamIds: ids })} />
      </div>
      <div style={section}>
        <label style={label} htmlFor="t-venue">Primary venue</label>
        <input id="t-venue" type="text" value={form.primary_venue} onChange={(e) => patch({ primary_venue: e.target.value })} placeholder="The Harvey School" style={input} />
      </div>
      <div style={section}>
        <label style={label} htmlFor="t-address">Venue address</label>
        <input id="t-address" type="text" value={form.primary_venue_address} onChange={(e) => patch({ primary_venue_address: e.target.value })} placeholder="260 Jay St, Katonah, NY" style={input} />
      </div>
      <div style={section}>
        <label style={label} htmlFor="t-url">TourneyMachine URL</label>
        <input id="t-url" type="url" value={form.tourney_url} onChange={(e) => patch({ tourney_url: e.target.value })} placeholder="https://tourneymachine.com/..." style={input} />
      </div>
      <div style={section}>
        <label style={label} htmlFor="t-hotel">Hotel URL (optional)</label>
        <input id="t-hotel" type="url" value={form.hotel_url} onChange={(e) => patch({ hotel_url: e.target.value })} placeholder="https://book.passkey.com/..." style={input} />
      </div>
      <div style={section}>
        <label style={label} htmlFor="t-notes">Parent survival notes</label>
        <textarea id="t-notes" value={form.survival_notes} onChange={(e) => patch({ survival_notes: e.target.value })} placeholder="Arrive 15 min early. Cash only at the door. Parking $10." rows={4} style={{ ...input, minHeight: 90, resize: 'vertical' }} />
      </div>
      <div style={section}>
        <label style={label} htmlFor="t-status">Status</label>
        <select id="t-status" value={form.status} onChange={(e) => patch({ status: e.target.value })} style={input}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div style={{
        position: 'sticky', bottom: -16, margin: '8px -16px -16px',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--em-bg-card)',
        borderTop: '1px solid var(--em-border-default)',
        display: 'flex', gap: 10,
      }}>
        <button type="button" onClick={onClose} className="sf-press" aria-label="Cancel" style={{
          flex: 1, minHeight: 44, borderRadius: 10,
          border: '1.5px solid var(--em-accent)', backgroundColor: 'var(--em-bg-card)',
          color: 'var(--em-accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}>Cancel</button>
        <button type="button" onClick={save} disabled={disabled} className="sf-press" aria-label={saving ? 'Saving' : 'Save'} style={{
          flex: 1, minHeight: 44, borderRadius: 10, border: 'none',
          backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
          fontSize: 15, fontWeight: 600,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </FullScreenForm>
  );
}
