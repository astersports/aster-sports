import { Link, useParams } from 'react-router-dom';
import { useProgramRegistrations } from '../../hooks/useProgramRegistrations';
import { programBadge } from '../../lib/programGrouping';
import { divisionsApplyTo } from '../../lib/programSetup';
import AdminBackHeader from '../../components/admin/AdminBackHeader';
import Badge from '../../components/shared/Badge';
import ProgramTeamsSection from '../../components/admin/program-detail/ProgramTeamsSection';
import ProgramFlatFeeEditor from '../../components/admin/program-detail/ProgramFlatFeeEditor';
import RegistrationRow from '../../components/admin/program-detail/RegistrationRow';
import ProgramManageZone from '../../components/admin/program-detail/ProgramManageZone';

// Date-only columns: parse + display UTC so the day never shifts (date-only
// values must not be NY-pinned — that rolls back a day in a UTC runtime).
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : null);

// Admin program detail (audit §9). Registrations list with the A1 mark-confirmed
// action (lifecycle only — payment stays in Financials) + a link to record payment.
const centered = { padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' };
const wrap = { maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px' };

export default function ProgramDetailPage() {
  const { id } = useParams();
  const { program, registrations, loading, error, refetch, markConfirmed } = useProgramRegistrations(id);

  if (loading) return <div style={centered}>Loading…</div>;
  if (error || !program) return <div style={centered}>Couldn’t load this program.</div>;
  const pending = registrations.filter((r) => r.status === 'pending').length;
  const badge = programBadge(program.program_type);
  const range = [fmtDate(program.start_date), fmtDate(program.end_date)].filter(Boolean).join(' – ');

  return (
    <div style={wrap}>
      <AdminBackHeader to="/admin/programs" />
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', margin: '4px 0 6px' }}>{program.name}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <span style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>
          {range}{range && program.status ? ' · ' : ''}{program.status === 'draft' ? 'Draft' : program.status === 'archived' ? 'Archived' : 'Active'}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginBottom: 16 }}>
        {program.is_published ? `Published · /r/${program.public_slug}` : 'Draft — not published'}
      </div>

      <ProgramTeamsSection programId={id} programType={program.program_type} />

      {!divisionsApplyTo(program.program_type) && <ProgramFlatFeeEditor program={program} />}

      <div style={secLabel}>Registrations · {registrations.length}{pending > 0 ? ` · ${pending} pending` : ''}</div>

      {registrations.length === 0 && (
        <div style={{ ...centered, fontSize: 15 }}>No registrations yet. Share the public link to get started.</div>
      )}

      {registrations.map((r) => (
        <RegistrationRow key={r.id} registration={r} onConfirm={markConfirmed} />
      ))}

      {registrations.length > 0 && (
        <>
          <p style={lifecycleNote}>“Confirmed” is a roster status. Payment is tracked separately in Financials.</p>
          <Link to="/admin/financials" style={{ ...linkBtn, display: 'inline-block', marginTop: 12, fontWeight: 500 }}>Record payments in Financials →</Link>
        </>
      )}

      <ProgramManageZone program={program} onUpdated={refetch} />
    </div>
  );
}

const linkBtn = { background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, cursor: 'pointer', padding: 0, textDecoration: 'none' };
const secLabel = { fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', margin: '20px 4px 8px' };
const lifecycleNote = { fontSize: 12, color: 'var(--as-text-tertiary)', margin: '12px 4px 0' };
