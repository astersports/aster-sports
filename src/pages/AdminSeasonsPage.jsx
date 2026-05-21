import { useState } from 'react';
import { useSeasons } from '../hooks/useSeasons';
import SeasonFormSheet from '../components/admin/SeasonFormSheet';
import Toast from '../components/shared/Toast';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import AdminSeasonsHeader from '../components/admin-seasons/AdminSeasonsHeader';
import AdminSeasonsActions from '../components/admin-seasons/AdminSeasonsActions';
import AdminSeasonsList from '../components/admin-seasons/AdminSeasonsList';

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
    <div className="px-4 py-4 sf-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
      <AdminSeasonsHeader title="Seasons" actions={<AdminSeasonsActions onNew={openNew} />} />
      <AdminSeasonsList
        seasons={seasons}
        loading={loading}
        onEdit={openEdit}
        onRequestSetActive={setConfirmSwitch}
      />
      <SeasonFormSheet
        open={sheetOpen}
        season={editing}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
      />
      {confirmSwitch && <ConfirmDialog
        title="Switch active season?"
        message={`Only one season can be active at a time. ${confirmSwitch?.name} will become active and the current one will move to archived.`}
        confirmLabel="Switch"
        onCancel={() => setConfirmSwitch(null)}
        // Guard against the stale-closure window where ConfirmDialog's
        // useEffect-bound Enter key fires after confirmSwitch nullifies
        // (e.g., a parallel state update from useSeasons mid-transition).
        // Sentry JAVASCRIPT-REACT-3.
        onConfirm={() => confirmSwitch && handleSetActive(confirmSwitch.id)}
      />}
      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
