// §4.O — Admin member-family directory. Lists guardians for the org
// with their kid links. Search filters by guardian name / email /
// phone or kid name. Mounts AdminManagerLayout per §4.N.4 design
// lock. Read-only in this PR; edit / add lands in PR B with
// GuardianFormSheet.
//
// V-32 closure per ADMIN_SESSION_SCOPE.md Tier 1. Route: /admin/members
// (admin-only).

import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import AdminManagerLayout from '../components/admin/AdminManagerLayout';
import GuardianFormSheet from '../components/admin/GuardianFormSheet';
import Toast from '../components/shared/Toast';
import { useGuardians } from '../hooks/useGuardians';

function matches(g, q) {
  if (!q) return true;
  const haystack = [
    g.first_name, g.last_name, g.email, g.phone,
    ...(g.kids || []).flatMap((k) => [k.first_name, k.last_name]),
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export default function AdminMembersPage() {
  const { guardians, loading, createGuardian, updateGuardian } = useGuardians();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const filtered = useMemo(
    () => (guardians || []).filter((g) => matches(g, search.trim())),
    [guardians, search],
  );

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (g) => { setEditing(g); setSheetOpen(true); };

  const handleSave = async (input) => {
    const { error } = editing
      ? await updateGuardian(editing.id, input)
      : await createGuardian(input);
    if (error) {
      setToast({ message: error, variant: 'error' });
    } else {
      setToast({ message: editing ? 'Member updated' : 'Member added', variant: 'success' });
      setSheetOpen(false);
    }
  };

  return (
    <AdminManagerLayout
      title="Members"
      subtitle={loading ? null : `${guardians.length} guardian${guardians.length === 1 ? '' : 's'} · ${guardians.reduce((s, g) => s + g.kids.length, 0)} kid link${guardians.reduce((s, g) => s + g.kids.length, 0) === 1 ? '' : 's'}`}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by guardian or kid name, email, phone…"
      addLabel="New member"
      onAdd={openNew}
      loading={loading}
      isEmpty={!loading && filtered.length === 0}
      emptyIcon={Users}
      emptyTitle={search ? 'No matches' : 'No guardians yet'}
      emptyDescription={search ? 'Try a different search term.' : 'Members appear here once families register.'}
    >
      <ul className="flex flex-col gap-2">
        {filtered.map((g) => {
          const fullName = `${g.first_name || ''} ${g.last_name || ''}`.trim() || '(unnamed)';
          const kidLine = g.kids.length
            ? g.kids.map((k) => `${k.first_name || ''} ${k.last_name || ''}`.trim()).filter(Boolean).join(', ')
            : 'No linked kids';
          const contactLine = [g.email, g.phone].filter(Boolean).join(' · ');
          return (
            <li
              key={g.id}
              style={{
                backgroundColor: 'var(--as-bg-card)',
                borderRadius: 10,
                border: '1px solid var(--as-border-subtle)',
                boxShadow: 'var(--as-shadow-sm)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => openEdit(g)}
                className="w-full text-left as-press"
                style={{ padding: 16, background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
              >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold" style={{ color: 'var(--as-text-primary)', fontSize: 17 }}>
                  {fullName}
                </span>
                <span style={{ color: 'var(--as-text-tertiary)', fontSize: 11, fontWeight: 500, letterSpacing: 0.5 }}>
                  {g.kids.length} KID{g.kids.length === 1 ? '' : 'S'}
                </span>
              </div>
              {contactLine && (
                <div style={{ color: 'var(--as-text-secondary)', fontSize: 13, marginBottom: 4 }}>
                  {contactLine}
                </div>
              )}
              <div style={{ color: g.kids.length ? 'var(--as-text-secondary)' : 'var(--as-text-tertiary)', fontSize: 13, fontStyle: g.kids.length ? 'normal' : 'italic' }}>
                {kidLine}
              </div>
              </button>
            </li>
          );
        })}
      </ul>
      <GuardianFormSheet
        open={sheetOpen}
        guardian={editing}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
      />
      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </AdminManagerLayout>
  );
}
