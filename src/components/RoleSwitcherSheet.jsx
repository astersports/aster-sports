import { useMemo, useState } from 'react';
import BottomSheet from './shared/BottomSheet';
import { useHomeRole } from '../hooks/useHomeRole';
import { useOrgGuardians } from '../hooks/useOrgGuardians';
import { useToast } from '../context/useToast';
import { MainView, PickerView } from './RoleSwitcherViews';

export default function RoleSwitcherSheet({ open, onClose }) {
  const { realRole, activeRole, isViewingAs, viewAsGuardianId, setViewAs, resetToRealRole } = useHomeRole();
  const { guardians, loading: guardiansLoading } = useOrgGuardians();
  const { showToast } = useToast();
  const [view, setView] = useState('main');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return guardians;
    const q = search.toLowerCase();
    return guardians.filter(
      (g) =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
        g.childNames.some((c) => c.toLowerCase().includes(q))
    );
  }, [guardians, search]);

  const close = () => {
    setView('main');
    setSearch('');
    onClose();
  };

  const handle = async (fn, msg) => {
    try {
      await fn();
      showToast(msg, 'success');
      close();
    } catch {
      showToast('Could not switch view', 'error');
    }
  };

  if (realRole !== 'admin') return null;

  return (
    <BottomSheet open={open} onClose={close} initialHeight="55%" expandedHeight="85%">
      {view === 'main' ? (
        <MainView
          isViewingAs={isViewingAs}
          activeRole={activeRole}
          onReset={() => handle(resetToRealRole, 'Back to admin view')}
          onCoach={() => handle(() => setViewAs('coach'), 'Viewing as coach')}
          onParent={() => setView('parent_picker')}
          onClose={close}
        />
      ) : (
        <PickerView
          guardians={filtered}
          loading={guardiansLoading}
          search={search}
          onSearch={setSearch}
          activeRole={activeRole}
          viewAsGuardianId={viewAsGuardianId}
          onPick={(g) => handle(() => setViewAs('parent', g.id), `Viewing as ${g.firstName} ${g.lastName}`)}
          onBack={() => setView('main')}
        />
      )}
    </BottomSheet>
  );
}
