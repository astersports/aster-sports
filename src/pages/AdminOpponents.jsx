import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  INPUT_CLS,
  LABEL_CLS,
  BTN_SECONDARY,
  BTN_PRIMARY,
  BTN_PRIMARY_STYLE,
  MODAL_CENTER_CLS,
  MODAL_CENTER_PANEL_SM_CLS,
  MODAL_BACKDROP,
  MODAL_PANEL,
} from '../lib/styles';

export default function AdminOpponents() {
  const { organization } = useAuth();
  const [opponents, setOpponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: loadErr } = await supabase.from('opponents').select('*').order('name');
    if (loadErr) {
      console.error('Failed to load opponents:', loadErr);
      setError('Failed to load opponents.');
    } else if (data) {
      setOpponents(data);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(opp) {
    setEditing(opp || {});
    setForm({ name: opp?.name || '', notes: opp?.notes || '' });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { name: form.name.trim(), notes: form.notes.trim() || null };
    const result = editing.id
      ? await supabase.from('opponents').update(payload).eq('id', editing.id)
      : await supabase.from('opponents').insert({ ...payload, org_id: organization.id });
    if (result.error) {
      console.error('Failed to save opponent:', result.error);
      setError(result.error.message);
      setSaving(false);
      return;
    }
    setEditing(null);
    setSaving(false);
    load();
  }

  async function handleDelete(id) {
    const { error: delErr } = await supabase.from('opponents').delete().eq('id', id);
    if (delErr) {
      console.error('Failed to delete opponent:', delErr);
      setError('Failed to delete opponent.');
      return;
    }
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Opponents</h1>
        <button onClick={() => openEdit(null)} className={BTN_PRIMARY} style={BTN_PRIMARY_STYLE}>+ Add Opponent</button>
      </div>

      {error && <div role="alert" className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>}

      {loading && <p className="text-(--color-text-secondary) py-8 text-center" role="status" aria-live="polite">Loading...</p>}

      {!loading && opponents.length === 0 && (
        <p className="text-(--color-text-secondary) py-8 text-center">No opponents yet. Add your first opponent.</p>
      )}

      {!loading && opponents.length > 0 && (
        <div className="space-y-3">
          {opponents.map((opp) => (
            <div key={opp.id} className="border border-(--color-border-tertiary) rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-(--color-text-primary)">{opp.name}</h3>
                {opp.notes && <p className="text-sm text-(--color-text-secondary)">{opp.notes}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(opp)} className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>Edit</button>
                <button onClick={() => handleDelete(opp.id)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <div className={MODAL_CENTER_CLS} style={MODAL_BACKDROP} onClick={() => setEditing(null)}>
          <div className={MODAL_CENTER_PANEL_SM_CLS} style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-(--color-text-primary) mb-4">{editing.id ? 'Edit Opponent' : 'Add Opponent'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="opp-name" className={LABEL_CLS}>Name</label>
                <input id="opp-name" type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLS} placeholder="e.g. Stamford Sharks" />
              </div>
              <div>
                <label htmlFor="opp-notes" className={LABEL_CLS}>Notes (optional)</label>
                <textarea id="opp-notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={INPUT_CLS} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className={BTN_SECONDARY}>Cancel</button>
                <button type="submit" disabled={saving} aria-busy={saving} className={BTN_PRIMARY} style={BTN_PRIMARY_STYLE}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
