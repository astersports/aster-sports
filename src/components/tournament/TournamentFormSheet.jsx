import { lazy, Suspense, useMemo, useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';
import TeamMultiSelect from './TeamMultiSelect';
import TournamentFormFooter from './TournamentFormFooter';
import { useTournaments } from '../../hooks/useTournaments';
import { useTournamentConflicts } from '../../hooks/useTournamentConflicts';
import { useToast } from '../../context/useToast';
import { hasWeekendDays } from '../../lib/tournamentWeekend';

// §C3: weekend-spanning new tournaments open the placeholder modal before close.
const TournamentPlaceholderEventsModal = lazy(() => import('./TournamentPlaceholderEventsModal'));
const CIRCUITS = ['AAU Zero Gravity', 'League Play', 'Independent', 'Other'];
const STATUSES = [
  { value: 'planned', label: 'Planned' }, { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' }, { value: 'complete', label: 'Complete' },
  { value: 'cancelled', label: 'Cancelled' },
];

const emptyForm = {
  name: '', circuit: 'AAU Zero Gravity', start_date: '', end_date: '',
  primary_venue: '', primary_venue_address: '', tourney_url: '', hotel_url: '',
  survival_notes: '', status: 'scheduled', teamIds: [],
};

const LABEL = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)', marginBottom: 6, display: 'block' };
const SELECT_STYLE = { width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' };
const TEXTAREA_STYLE = { ...SELECT_STYLE, minHeight: 90, resize: 'vertical' };
const SECTION = { marginBottom: 18 };

export default function TournamentFormSheet({ tournament, onClose }) {
  const { create, update } = useTournaments();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [placeholderForTournament, setPlaceholderForTournament] = useState(null);
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

  // L99 v6 §5.2 C2 — soft conflict warning. Frank's call: NOT a block.
  const { conflicts } = useTournamentConflicts(form.teamIds, form.start_date, form.end_date, tournament?.id);
  const conflictMessage = useMemo(() => {
    if (!conflicts.length) return null;
    const byTeam = new Map();
    for (const c of conflicts) {
      if (!byTeam.has(c.team_name)) byTeam.set(c.team_name, new Set());
      byTeam.get(c.team_name).add(c.tournament_name);
    }
    const phrases = Array.from(byTeam.entries()).map(([t, ts]) => `${t} also in ${Array.from(ts).join(', ')}`);
    return phrases.join(' · ');
  }, [conflicts]);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    // Wave 3.16.1: coerce empty URL fields to null so the DB stores
    // NULL instead of '' (empty-string-vs-null bug).
    const cleaned = {
      ...form,
      tourney_url: form.tourney_url?.trim() || null,
      hotel_url: form.hotel_url?.trim() || null,
    };
    const result = tournament ? await update(tournament.id, cleaned) : await create(cleaned);
    setSaving(false);
    if (result?.error) { console.error('TournamentFormSheet save:', result.error.message); showToast("Couldn't save. Try again?", 'error'); return; }
    showToast(tournament ? 'Tournament updated' : 'Tournament created');
    if (!tournament && result?.data && form.teamIds.length && hasWeekendDays(form.start_date, form.end_date)) {
      setPlaceholderForTournament(result.data); return;
    }
    onClose();
  };

  const disabled = !valid || saving;

  return (
    <FullScreenForm open={true} title={tournament ? 'Edit Tournament' : 'New Tournament'} onClose={onClose}>
      <div style={SECTION}>
        <Input id="t-name" label="Name" type="text" value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="ZG NY Metro Showdown" required />
      </div>
      <div style={SECTION}>
        <label style={LABEL} htmlFor="t-circuit">Circuit</label>
        <select id="t-circuit" value={form.circuit} onChange={(e) => patch({ circuit: e.target.value })} style={SELECT_STYLE}>
          {CIRCUITS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ ...SECTION, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <Input id="t-start" label="Start date" type="date" value={form.start_date} onChange={(e) => patch({ start_date: e.target.value })} required />
        </div>
        <div>
          <Input id="t-end" label="End date" type="date" value={form.end_date} onChange={(e) => patch({ end_date: e.target.value })} required />
        </div>
      </div>
      <div style={SECTION}>
        <label style={LABEL}>Teams attending<span style={{ color: 'var(--em-danger)', marginLeft: 4 }} aria-hidden="true">*</span></label>
        <TeamMultiSelect selectedIds={form.teamIds} onChange={(ids) => patch({ teamIds: ids })} />
      </div>
      <div style={SECTION}>
        <Input id="t-venue" label="Primary venue" type="text" value={form.primary_venue} onChange={(e) => patch({ primary_venue: e.target.value })} placeholder="The Harvey School" />
      </div>
      <div style={SECTION}>
        <Input id="t-address" label="Venue address" type="text" value={form.primary_venue_address} onChange={(e) => patch({ primary_venue_address: e.target.value })} placeholder="260 Jay St, Katonah, NY" />
      </div>
      <div style={SECTION}>
        <Input id="t-url" label="SE Tourney link" type="url" value={form.tourney_url} onChange={(e) => patch({ tourney_url: e.target.value })} placeholder="https://setourney.app.link/..." />
      </div>
      <div style={SECTION}>
        <Input id="t-hotel" label="Hotel URL (optional)" type="url" value={form.hotel_url} onChange={(e) => patch({ hotel_url: e.target.value })} placeholder="https://book.passkey.com/..." />
      </div>
      <div style={SECTION}>
        <label style={LABEL} htmlFor="t-notes">Parent survival notes</label>
        <textarea id="t-notes" value={form.survival_notes} onChange={(e) => patch({ survival_notes: e.target.value })} placeholder="Arrive 15 min early. Cash only at the door. Parking $10." rows={4} style={TEXTAREA_STYLE} />
      </div>
      <div style={SECTION}>
        <label style={LABEL} htmlFor="t-status">Status</label>
        <select id="t-status" value={form.status} onChange={(e) => patch({ status: e.target.value })} style={SELECT_STYLE}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <TournamentFormFooter conflictMessage={conflictMessage} onCancel={onClose} onSave={save} disabled={disabled} saving={saving} />
      {placeholderForTournament && (
        <Suspense fallback={null}>
          <TournamentPlaceholderEventsModal
            tournament={placeholderForTournament}
            teamIds={form.teamIds}
            onClose={() => { setPlaceholderForTournament(null); onClose(); }}
          />
        </Suspense>
      )}
    </FullScreenForm>
  );
}
