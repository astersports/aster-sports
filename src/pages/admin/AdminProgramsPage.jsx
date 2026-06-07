import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus } from 'lucide-react';
import { useAllPrograms } from '../../hooks/useAllPrograms';
import { groupPrograms } from '../../lib/programGrouping';
import { PROGRAM_TYPE_KEYS, programRule } from '../../lib/programRegistry';
import AdminBackHeader from '../../components/admin/AdminBackHeader';
import ProgramIndexRow from '../../components/admin/programs/ProgramIndexRow';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';

// The /admin/programs index — the navigation spine (render R1, F5). Lists every
// program across types + statuses, grouped Draft / Active / Upcoming / Archived,
// with a type filter. Filter chips are registry-derived (every type, can't
// drift). Reachable from the admin-home Programs shortcut.
const FILTERS = [{ key: 'all', label: 'All' }, ...PROGRAM_TYPE_KEYS.map((key) => ({ key, label: programRule(key).label }))];

export default function AdminProgramsPage() {
  const { programs, loading } = useAllPrograms();
  const [filter, setFilter] = useState('all');
  const shown = filter === 'all' ? programs : programs.filter((p) => p.programType === filter);
  const groups = groupPrograms(shown);

  return (
    <div className="px-4 py-4 as-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <AdminBackHeader to="/" />
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 24 }}>Programs</h1>
        <Link to="/admin/programs/new" className="as-press" style={ctaStyle}>
          <Plus size={18} strokeWidth={1.75} /> New
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key} type="button" onClick={() => setFilter(f.key)} className="as-press"
            style={{ ...chip, ...(filter === f.key ? chipOn : null) }}
          >{f.label}</button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton variant="card" count={4} />
      ) : groups.length === 0 ? (
        <EmptyState icon={Layers} title="No programs yet" description="Create your first program — a season, camp, clinic, or tryout." />
      ) : (
        groups.map((g) => (
          <div key={g.key}>
            <div style={secLabel}>{g.label}</div>
            {g.programs.map((p) => <ProgramIndexRow key={p.id} program={p} />)}
          </div>
        ))
      )}
    </div>
  );
}

const ctaStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 34, padding: '0 12px',
  borderRadius: 8, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
  fontSize: 13, fontWeight: 600, textDecoration: 'none',
};
const chip = {
  minHeight: 30, padding: '0 11px', borderRadius: 999, border: '1px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
const chipOn = { backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', borderColor: 'var(--as-accent)' };
const secLabel = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
  color: 'var(--as-text-tertiary)', margin: '16px 4px 8px',
};
