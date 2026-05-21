import { lazy, memo, Suspense, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAcademyCallupCandidates } from '../../hooks/useAcademyCallupCandidates';
import { useNow } from '../../hooks/useNow';
import { ShortNoticeBanner, StatusBadge } from './AcademyCallupPickerStatus';

const AcademyCallupCompose = lazy(() => import('./AcademyCallupCompose'));

const VISIBLE_TYPES = new Set(['game', 'tournament']);
const HOURS_18_MS = 18 * 60 * 60 * 1000;

const TIER_HEADERS = {
  same: 'Same age band',
  adjacent: 'Adjacent age bands',
  other: 'Other Academy players',
};

const cardStyle = {
  margin: '12px 16px', padding: 14, borderRadius: 10,
  backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)',
  boxShadow: 'var(--em-shadow-sm)',
};
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)' };

// 2026-05-21 EventDetail perf pass (PR #428 pattern): memo-wrapped so
// parent re-renders skip this subtree when props are referentially equal.
// Internal useNow() still drives the short-notice banner tick locally.
function AcademyCallupPicker({ event, team, isStaff, isLocked, academyCallupPlayerIds, addCallup, removeCallup }) {
  const { candidates, loading } = useAcademyCallupCandidates({ eventTeamName: team?.name });
  const [emailStatus, setEmailStatus] = useState({});
  const [composingFor, setComposingFor] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const grouped = useMemo(() => {
    const out = { same: [], adjacent: [], other: [] };
    for (const c of candidates) (out[c.tier] || out.other).push(c);
    return out;
  }, [candidates]);

  const callupSet = useMemo(() => new Set(academyCallupPlayerIds || []), [academyCallupPlayerIds]);
  const now = useNow();
  const isShortNotice = event?.start_at
    ? new Date(event.start_at).getTime() - now < HOURS_18_MS
    : false;

  if (!event || !VISIBLE_TYPES.has(event.event_type) || !isStaff || !isLocked) return null;
  if (loading) return null;

  const onAdd = async (playerId) => {
    setBusyId(playerId);
    const ok = await addCallup(playerId);
    setBusyId(null);
    if (ok) setComposingFor(playerId);
  };
  const onRemove = async (playerId) => {
    setBusyId(playerId);
    const ok = await removeCallup(playerId);
    setBusyId(null);
    if (ok) setEmailStatus((s) => { const n = { ...s }; delete n[playerId]; return n; });
  };
  const closeCompose = (status) => {
    if (composingFor) setEmailStatus((s) => ({ ...s, [composingFor]: status || 'skipped' }));
    setComposingFor(null);
  };

  const renderRow = (c) => {
    const isCalledUp = callupSet.has(c.id);
    return (
      <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--em-border-subtle)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)' }}>{c.first_name} {c.last_name}</div>
          <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {c.team_name}
            {isCalledUp && <StatusBadge status={emailStatus[c.id]} onSendNow={() => setComposingFor(c.id)} />}
          </div>
        </div>
        {isCalledUp ? (
          <button type="button" onClick={() => onRemove(c.id)} disabled={busyId === c.id} aria-label={`Remove ${c.first_name}`}
            style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--em-danger)', cursor: 'pointer', opacity: busyId === c.id ? 0.5 : 1 }}>
            <X size={18} strokeWidth={1.75} />
          </button>
        ) : (
          <button type="button" onClick={() => onAdd(c.id)} disabled={busyId === c.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', minHeight: 36, borderRadius: 8, backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: busyId === c.id ? 0.5 : 1 }}>
            <Plus size={14} strokeWidth={2} /> Add
          </button>
        )}
      </li>
    );
  };

  const totalCount = candidates.length;

  return (
    <div style={cardStyle}>
      <div style={{ ...labelStyle, marginBottom: 8 }}>Academy Call-Ups</div>
      {isShortNotice && <ShortNoticeBanner />}
      {totalCount === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>No Academy players available.</div>
      ) : (
        ['same', 'adjacent', 'other'].map((tier) => grouped[tier].length === 0 ? null : (
          <div key={tier} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 4 }}>
              {TIER_HEADERS[tier]}
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {grouped[tier].map(renderRow)}
            </ul>
          </div>
        ))
      )}

      {composingFor && (
        <Suspense fallback={null}>
          <AcademyCallupCompose
            event={event} team={team}
            player={candidates.find((c) => c.id === composingFor)}
            onClose={(status) => closeCompose(status)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default memo(AcademyCallupPicker);
