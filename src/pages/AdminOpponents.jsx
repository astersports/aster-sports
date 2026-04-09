import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const INPUT_CLS = 'w-full border border-(--color-border-tertiary) rounded px-3 py-2 text-sm bg-(--color-background) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]';
const LABEL_CLS = 'block text-sm font-medium text-(--color-text-primary) mb-1';
const BTN_SECONDARY = 'px-4 py-2 text-sm font-medium rounded border border-(--color-border-tertiary) text-(--color-text-primary) hover:bg-(--color-background-secondary)';

export default function AdminOpponents() {
  const { organization } = useAuth();
  const [opponents, setOpponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', notes: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('opponents').select('*').order('name');
    if (data) setOpponents(data);
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
    const payload = { name: form.name.trim(), notes: form.notes.trim() || null };
    if (editing.id) {
      await supabase.from('opponents').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('opponents').insert({ ...payload, org_id: organization.id });
    }
    setEditing(null);
    setSaving(false);
    load();
  }

  async function handleDelete(id) {
    await supabase.from('opponents').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Opponents</h1>
        <button onClick={() => openEdit(null)} className="px-4 py-2 text-sm font-medium rounded" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>+ Add Opponent</button>
      </div>

      {loading && <p className="text-(--color-text-secondary) py-8 text-center">Loading...</p>}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setEditing(null)}>
          <div className="rounded-lg shadow-lg w-full max-w-sm p-6" style={{ backgroundColor: 'var(--color-background-primary, #ffffff)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-(--color-text-primary) mb-4">{editing.id ? 'Edit Opponent' : 'Add Opponent'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLS} placeholder="e.g. Stamford Sharks" />
              </div>
              <div>
                <label className={LABEL_CLS}>Notes (optional)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={INPUT_CLS} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className={BTN_SECONDARY}>Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium rounded disabled:opacity-50" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>
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
