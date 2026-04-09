import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const INPUT_CLS = 'w-full border border-(--color-border-tertiary) rounded px-3 py-2 text-sm bg-(--color-background) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]';
const LABEL_CLS = 'block text-sm font-medium text-(--color-text-primary) mb-1';
const BTN_SECONDARY = 'px-4 py-2 text-sm font-medium rounded border border-(--color-border-tertiary) text-(--color-text-primary) hover:bg-(--color-background-secondary)';

export default function AdminLocations() {
  const { organization } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=closed, {}=new, {id,...}=edit
  const [form, setForm] = useState({ name: '', address: '', sub_locations: [] });
  const [subInput, setSubInput] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('locations').select('*').order('name');
    if (data) setLocations(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(loc) {
    setEditing(loc || {});
    setForm({
      name: loc?.name || '',
      address: loc?.address || '',
      sub_locations: loc?.sub_locations || [],
    });
    setSubInput('');
  }

  function addSub() {
    if (!subInput.trim()) return;
    setForm((f) => ({ ...f, sub_locations: [...f.sub_locations, subInput.trim()] }));
    setSubInput('');
  }

  function removeSub(i) {
    setForm((f) => ({ ...f, sub_locations: f.sub_locations.filter((_, j) => j !== i) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      sub_locations: form.sub_locations,
    };
    if (editing.id) {
      await supabase.from('locations').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('locations').insert({ ...payload, org_id: organization.id });
    }
    setEditing(null);
    setSaving(false);
    load();
  }

  async function handleDelete(id) {
    await supabase.from('locations').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Locations</h1>
        <button onClick={() => openEdit(null)} className="px-4 py-2 text-sm font-medium rounded" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>+ Add Location</button>
      </div>

      {loading && <p className="text-(--color-text-secondary) py-8 text-center">Loading...</p>}

      {!loading && locations.length === 0 && (
        <p className="text-(--color-text-secondary) py-8 text-center">No locations yet. Add your first venue.</p>
      )}

      {!loading && locations.length > 0 && (
        <div className="space-y-3">
          {locations.map((loc) => (
            <div key={loc.id} className="border border-(--color-border-tertiary) rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-(--color-text-primary)">{loc.name}</h3>
                  {loc.address && <p className="text-sm text-(--color-text-secondary)">{loc.address}</p>}
                  {loc.sub_locations?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {loc.sub_locations.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-(--color-background-secondary) text-(--color-text-secondary)">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(loc)} className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>Edit</button>
                  <button onClick={() => handleDelete(loc.id)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setEditing(null)}>
          <div className="rounded-lg shadow-lg w-full max-w-md p-6" style={{ backgroundColor: 'var(--color-background-primary, #ffffff)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-(--color-text-primary) mb-4">{editing.id ? 'Edit Location' : 'Add Location'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLS} placeholder="e.g. St. Patrick's Gym" />
              </div>
              <div>
                <label className={LABEL_CLS}>Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={INPUT_CLS} placeholder="Full address for map links" />
              </div>
              <div>
                <label className={LABEL_CLS}>Sub-locations</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {form.sub_locations.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-(--color-background-secondary) text-(--color-text-primary)">
                      {s}
                      <button type="button" onClick={() => removeSub(i)} className="text-red-500 hover:text-red-700">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={subInput} onChange={(e) => setSubInput(e.target.value)} className={INPUT_CLS} placeholder="e.g. Court 1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }} />
                  <button type="button" onClick={addSub} className="text-sm font-medium px-3 py-2 rounded" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>Add</button>
                </div>
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
