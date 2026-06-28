// §4.O — Admin member-family directory. Lists guardians for the org
// with their kid links. Search filters by guardian name / email /
// phone or kid name. Mounts AdminManagerLayout per §4.N.4 design
// lock. Read-only in this PR; edit / add lands in PR B with
// GuardianFormSheet.
//
// V-32 closure per ADMIN_SESSION_SCOPE.md Tier 1. Route: /admin/members
// (admin-only).
//
// L99 enhancement pass (2026-06-28): summary stat row, link-state
// filter + sort toolbar, avatar + kid chips + quick-contact actions
// (MemberRow), result count + scoped empty/microcopy. Row/filter/sort
// logic decomposed into src/components/admin-members/* to hold ≤150.

import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import AdminManagerLayout from '../components/admin/AdminManagerLayout';
import GuardianFormSheet from '../components/admin/GuardianFormSheet';
import Toast from '../components/shared/Toast';
import { useGuardians } from '../hooks/useGuardians';
import MemberStatRow from '../components/admin-members/MemberStatRow';
import MemberToolbar from '../components/admin-members/MemberToolbar';
import MemberRow from '../components/admin-members/MemberRow';
import { matchesGuardian, passesLinkFilter, sortGuardians } from '../components/admin-members/memberHelpers';

function matches(g, q) {
  return matchesGuardian(g, q);
}

export default function AdminMembersPage() {
  const { guardians, loading, createGuardian, updateGuardian } = useGuardians();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');

  const filtered = useMemo(
    () => sortGuardians(
      (guardians || []).filter((g) => matches(g, search.trim()) && passesLinkFilter(g, filter)),
      sortKey,
    ),
    [guardians, search, filter, sortKey],
  );

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (g) => { setEditing(g); setSheetOpen(true); };

  const handleSave = async (input) => {
    const { error } = editing
      ? await updateGuardian(editing.id, input)
      : await createGuardian(input);
    if (error) {
      setToast({ message: 'Looks like that didn’t go through. Try again?', variant: 'error' });
    } else {
      setToast({ message: editing ? 'Member updated' : 'Member added', variant: 'success' });
      setSheetOpen(false);
    }
  };

  const total = guardians?.length || 0;
  const isFiltering = !!search.trim() || filter !== 'all';
  const emptyTitle = isFiltering ? 'No matches' : 'No guardians yet';
  const emptyDescription = filter === 'unlinked' && !search.trim()
    ? 'Every guardian has a kid linked — nice and tidy.'
    : isFiltering
      ? 'Try a different search or filter.'
      : 'Members appear here once families register.';

  return (
    <AdminManagerLayout
      title="Members"
      subtitle={loading ? null : `${total} guardian${total === 1 ? '' : 's'}`}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by guardian or kid name, email, phone…"
      addLabel="New member"
      onAdd={openNew}
      loading={loading}
      isEmpty={!loading && filtered.length === 0}
      emptyIcon={Users}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    >
      {total > 0 && (
        <MemberStatRow
          guardians={guardians}
          onShowUnlinked={() => { setSearch(''); setFilter('unlinked'); }}
        />
      )}
      {total > 0 && (
        <MemberToolbar
          filter={filter}
          onFilterChange={setFilter}
          sortKey={sortKey}
          onSortChange={setSortKey}
        />
      )}
      <p role="status" aria-live="polite" style={{ color: 'var(--as-text-secondary)', fontSize: 13, marginBottom: 8 }}>
        {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        {isFiltering ? ` of ${total}` : ''}
      </p>
      <ul className="flex flex-col gap-2">
        {filtered.map((g) => (
          <MemberRow key={g.id} guardian={g} onEdit={openEdit} />
        ))}
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
