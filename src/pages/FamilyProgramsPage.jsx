import { useCallback, useState } from 'react';
import { Users } from 'lucide-react';
import { useGoBack } from '../hooks/useGoBack';
import { useFamilyPrograms } from '../hooks/useFamilyPrograms';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import FamilyProgramsHeader from '../components/family-programs/FamilyProgramsHeader';
import FamilyErrorState from '../components/family-programs/FamilyErrorState';
import FamilyProgramsBody from '../components/family-programs/FamilyProgramsBody';

// Parent "My Family" (PR-B1): what each child is registered for, what the family
// owes (one number from family_balances), and what's open to register into.
// Parent-scoped reads; negative contract — no org rollup, no other families, no
// admin controls. L99 enhancement pass: sticky header + optimistic refresh,
// at-a-glance summary, Futures Academy spotlight (headline, not a footnote),
// per-child filter, collapsible open-programs, actionable error/empty, a11y
// live region. Additive over the original gate; --as-* tokens only.
export default function FamilyProgramsPage() {
  const goBack = useGoBack();
  const { data, loading, error, refetch } = useFamilyPrograms();
  const [refreshing, setRefreshing] = useState(false);
  const children = data?.children || [];
  const balances = data?.familyBalances || [];
  const open = data?.openPrograms || [];
  const hasAnything = children.some((c) => c.enrollments.length > 0) || open.length > 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const status = loading ? 'Loading your family…' : error ? 'Couldn’t load your family.' : 'Your family is up to date.';

  return (
    <div style={wrap}>
      <FamilyProgramsHeader onBack={goBack} onRefresh={handleRefresh} refreshing={refreshing} />
      <h1 style={h1}>My Family</h1>
      <p aria-live="polite" className="as-sr-only">{status}</p>

      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : error ? (
        <FamilyErrorState onRetry={handleRefresh} retrying={refreshing} />
      ) : !hasAnything ? (
        <EmptyState
          icon={Users}
          title="No programs yet"
          description="We’ll show your registrations and what’s open right here the moment it opens. Pull Refresh to check again."
        />
      ) : (
        <FamilyProgramsBody children={children} balances={balances} open={open} />
      )}
    </div>
  );
}

const wrap = { minHeight: '100vh', backgroundColor: 'var(--as-bg-page)', padding: '16px 16px 32px', maxWidth: 600, margin: '0 auto' };
const h1 = { fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', margin: '0 0 14px' };
