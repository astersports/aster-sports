import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';
import { useLocations } from '../../hooks/useLocations';
import { useToast } from '../../context/useToast';
import { geocodeAddress } from '../../lib/geocode';

const emptyForm = { name: '', address: '', parking_notes: '', notes: '' };

export default function LocationFormSheet({ location, onClose }) {
  const { create, update } = useLocations();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => location ? {
    name: location.name || '',
    address: location.address || '',
    parking_notes: location.parking_notes || '',
    notes: location.notes || '',
  } : emptyForm);

  const patch = (updates) => setForm((f) => ({ ...f, ...updates }));
  const valid = form.name.trim() && form.address.trim();

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    let payload = { ...form };
    if (!location || form.address !== location.address) {
      const coords = await geocodeAddress(form.address);
      if (coords) {
        payload.lat = coords.lat;
        payload.lon = coords.lon;
      }
    }
    const { error } = location ? await update(location.id, payload) : await create(payload);
    setSaving(false);
    if (error) { console.error('LocationFormSheet save:', error.message); showToast("Couldn't save. Try again?", 'error'); return; }
    showToast(location ? 'Location updated' : 'Location created');
    onClose();
  };

  const label = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)', marginBottom: 6, display: 'block' };
  const textareaStyle = {
    width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)',
    color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit', resize: 'vertical',
  };
  const section = { marginBottom: 18 };
  const footerBtn = (primary) => ({
    minHeight: 44, padding: '0 18px', borderRadius: 10,
    border: primary ? 'none' : '1.5px solid var(--em-border-default)',
    backgroundColor: primary ? 'var(--em-accent)' : 'var(--em-bg-card)',
    color: primary ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
  });

  return (
    <FullScreenForm open={true} onClose={onClose} title={location ? 'Edit Location' : 'New Location'}>
      <div style={section}>
        <Input id="l-name" label="Name" type="text" value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Westchester Community College" required />
      </div>
      <div style={section}>
        <Input id="l-addr" label="Address" type="text" value={form.address} onChange={(e) => patch({ address: e.target.value })} placeholder="75 Grasslands Rd, Valhalla, NY 10595" required />
        <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 4 }}>
          Coordinates auto-fetched on save.
        </div>
      </div>
      <div style={section}>
        <label style={label} htmlFor="l-parking">Parking notes</label>
        <textarea id="l-parking" value={form.parking_notes} onChange={(e) => patch({ parking_notes: e.target.value })} placeholder="Lot opens 30 min before. $5 cash only." rows={3} style={textareaStyle} />
      </div>
      <div style={section}>
        <label style={label} htmlFor="l-notes">General notes</label>
        <textarea id="l-notes" value={form.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Concessions on site. Bleacher seating only." rows={3} style={textareaStyle} />
      </div>

      <div style={{
        position: 'sticky', bottom: 0, marginTop: 'auto',
        padding: '12px 0 calc(12px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--em-border-default)',
        backgroundColor: 'var(--em-bg-card)',
        display: 'flex', justifyContent: 'space-between', gap: 8,
      }}>
        <button type="button" onClick={onClose} style={footerBtn(false)} aria-label="Cancel">Cancel</button>
        <button type="button" onClick={save} disabled={!valid || saving} style={{ ...footerBtn(true), opacity: (!valid || saving) ? 0.5 : 1, cursor: (!valid || saving) ? 'not-allowed' : 'pointer' }} aria-label="Save location">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </FullScreenForm>
  );
}
