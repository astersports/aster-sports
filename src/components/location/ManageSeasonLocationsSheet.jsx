import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { useLocations } from '../../hooks/useLocations';
import { useSeasonLocations } from '../../hooks/useSeasonLocations';
import { useToast } from '../../context/useToast';

export default function ManageSeasonLocationsSheet({ seasonId, seasonName, onClose }) {
  const { locations, loading: locLoading } = useLocations();
  const { activeIds, loading: seasonLoading, setSeasonLocations } = useSeasonLocations(seasonId);
  const { showToast } = useToast();
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (seasonLoading) return;
    Promise.resolve().then(() => setSelected(new Set(activeIds)));
  }, [seasonLoading, activeIds]);

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    navigator.vibrate?.(10);
    return next;
  });

  const selectAll = () => { setSelected(new Set(locations.map((l) => l.id))); navigator.vibrate?.(10); };
  const clearAll = () => { setSelected(new Set()); navigator.vibrate?.(10); };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const { error } = await setSeasonLocations(selected);
    setSaving(false);
    if (error) { console.error('ManageSeasonLocationsSheet save:', error.message); showToast("Couldn't save. Try again?", 'error'); return; }
    showToast(`${selected.size} location${selected.size === 1 ? '' : 's'} active for ${seasonName}`);
    onClose();
  };

  const loading = locLoading || seasonLoading;

  return (
    <FullScreenForm open={true} onClose={onClose} title={`Manage Locations · ${seasonName}`}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={selectAll} className="em-press" style={chipBtn}>Select all</button>
        <button type="button" onClick={clearAll} className="em-press" style={chipBtn}>Clear</button>
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 13, color: 'var(--em-text-tertiary)' }}>
          {selected.size} of {locations.length} selected
        </span>
      </div>

      {loading ? (
        <LoadingSkeleton variant="list" count={4} />
      ) : locations.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>
          No locations yet. Add one from the Locations page first.
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
          {locations.map((l, i) => {
            const on = selected.has(l.id);
            return (
              <button key={l.id} type="button" onClick={() => toggle(l.id)} className="em-press"
                aria-label={`${on ? 'Remove' : 'Add'} ${l.name}`}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', minHeight: 56, background: 'none', border: 'none',
                  borderBottom: i < locations.length - 1 ? '1px solid var(--em-border-subtle)' : 'none',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  backgroundColor: on ? 'var(--em-accent)' : 'transparent',
                  border: on ? 'none' : '1.5px solid var(--em-border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <Check size={16} strokeWidth={2.5} color="var(--em-text-inverse)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>{l.name}</div>
                  {l.address && <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2 }}>{l.address}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div style={{
        position: 'sticky', bottom: 0, marginTop: 16,
        padding: '12px 0 calc(12px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--em-border-default)',
        backgroundColor: 'var(--em-bg-card)',
        display: 'flex', justifyContent: 'space-between', gap: 8,
      }}>
        <button type="button" onClick={onClose} style={footerBtn(false)}>Cancel</button>
        <button type="button" onClick={save} disabled={saving} style={{ ...footerBtn(true), opacity: saving ? 0.5 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </FullScreenForm>
  );
}

const chipBtn = {
  minHeight: 36, padding: '0 12px', borderRadius: 9999, fontSize: 13, fontWeight: 500,
  border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
  color: 'var(--em-text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
};
const footerBtn = (primary) => ({
  minHeight: 44, padding: '0 18px', borderRadius: 10,
  border: primary ? 'none' : '1.5px solid var(--em-border-default)',
  backgroundColor: primary ? 'var(--em-accent)' : 'var(--em-bg-card)',
  color: primary ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
});
