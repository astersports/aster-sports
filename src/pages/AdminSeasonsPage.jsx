import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { useSeasons } from '../hooks/useSeasons';
import SeasonFormSheet from '../components/admin/SeasonFormSheet';
import Badge from '../components/shared/Badge';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Toast from '../components/shared/Toast';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { formatDateFull } from '../lib/formatters';
import { Calendar } from 'lucide-react';

export default function AdminSeasonsPage() {
  const { seasons, loading, createSeason, updateSeason, setActive } = useSeasons();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmSwitch, setConfirmSwitch] = useState(null);

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (s) => { setEditing(s); setSheetOpen(true); };

  const handleSave = async (input) => {
    const { error } = editing
      ? await updateSeason(editing.id, input)
      : await createSeason({ ...input, status: seasons.length === 0 ? 'active' : 'archived' });
    if (error) setToast({ message: error, variant: 'error' });
    else {
      setToast({ message: editing ? 'Season updated' : 'Season created', variant: 'success' });
      setSheetOpen(false);
    }
  };

  const handleSetActive = async (id) => {
    const { error } = await setActive(id);
    setConfirmSwitch(null);
    if (error) setToast({ message: error, variant: 'error' });
    else setToast({ message: 'Active season updated', variant: 'success' });
  };

  return (
    <div className="px-4 py-4 sf-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 22 }}>
          Seasons
        </h1>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1 font-semibold sf-press"
          style={{
            minHeight: 44, padding: '0 14px', borderRadius: 10,
            backgroundColor: 'var(--sf-accent)', color: '#FFFFFF', fontSize: 14,
          }}
        >
          <Plus size={18} strokeWidth={1.75} /> New
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : seasons.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No seasons yet"
          description="Create your first season to start scheduling events."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {seasons.map((s) => {
            const active = s.status === 'active';
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="w-full text-left p-4 sf-press flex flex-col"
                  style={{
                    backgroundColor: 'var(--sf-bg-card)',
                    borderRadius: 10,
                    borderLeft: `4px solid ${active ? 'var(--sf-success)' : 'var(--sf-border-default)'}`,
                    border: '1px solid var(--sf-border-subtle)',
                    borderLeftWidth: 4,
                    borderLeftColor: active ? 'var(--sf-success)' : 'var(--sf-border-default)',
                    boxShadow: 'var(--sf-shadow-sm)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold" style={{ color: 'var(--sf-text-primary)', fontSize: 16 }}>
                      {s.name}
                    </span>
                    {active ? <Badge variant="success">Active</Badge> : <Badge>Archived</Badge>}
                  </div>
                  <span style={{ color: 'var(--sf-text-secondary)', fontSize: 13 }}>
                    {formatDateFull(s.start_date)} – {formatDateFull(s.end_date)}
                  </span>
                  {!active && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setConfirmSwitch(s); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setConfirmSwitch(s); } }}
                      className="mt-2 inline-flex items-center gap-1 sf-press"
                      style={{ color: 'var(--sf-accent)', fontSize: 13, fontWeight: 500 }}
                    >
                      <Star size={14} strokeWidth={1.75} /> Set as active
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <SeasonFormSheet
        open={sheetOpen}
        season={editing}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirmSwitch}
        title="Switch active season?"
        message={`Only one season can be active at a time. ${confirmSwitch?.name} will become active and the current one will move to archived.`}
        confirmLabel="Switch"
        onCancel={() => setConfirmSwitch(null)}
        onConfirm={() => handleSetActive(confirmSwitch.id)}
      />
      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
