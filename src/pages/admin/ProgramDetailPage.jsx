import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProgramRegistrations } from '../../hooks/useProgramRegistrations';
import { formatCurrency } from '../../lib/formatters';

// Admin program detail (audit §9, light). Read-only registrations list + a link to the
// existing financial flow to record payment. Marking confirmed is a fast-follow.
const STATUS = {
  pending: { label: 'Pending', bg: 'var(--em-warning-soft)', fg: 'var(--em-warning)' },
  confirmed: { label: 'Confirmed', bg: 'var(--em-success-soft)', fg: 'var(--em-success)' },
  waitlist: { label: 'Waitlist', bg: 'var(--em-info-soft)', fg: 'var(--em-info)' },
  cancelled: { label: 'Cancelled', bg: 'var(--em-neutral-soft)', fg: 'var(--em-text-tertiary)' },
  payment_overdue: { label: 'Overdue', bg: 'var(--em-danger-soft)', fg: 'var(--em-danger)' },
};
const feeTotal = (r) => (r.registration_fees || []).reduce((s, f) => s + (f.amount_cents || 0), 0);
const centered = { padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' };
const wrap = { maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px' };

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { program, registrations, loading, error } = useProgramRegistrations(id);

  if (loading) return <div style={centered}>Loading…</div>;
  if (error || !program) return <div style={centered}>Couldn’t load this program.</div>;
  const pending = registrations.filter((r) => r.status === 'pending').length;

  return (
    <div style={wrap}>
      <button type="button" onClick={() => navigate('/admin/seasons')} style={linkBtn}>← Admin</button>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--em-text-primary)', margin: '8px 0 2px' }}>{program.name}</h1>
      <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginBottom: 4 }}>
        {program.is_published ? `Published · /r/${program.public_slug}` : 'Draft — not published'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginBottom: 16 }}>
        {registrations.length} registration{registrations.length !== 1 ? 's' : ''}{pending > 0 ? ` · ${pending} pending` : ''}
      </div>

      {registrations.length === 0 && (
        <div style={{ ...centered, fontSize: 15 }}>No registrations yet. Share the public link to get started.</div>
      )}

      {registrations.map((r) => {
        const st = STATUS[r.status] || STATUS.pending;
        return (
          <div key={r.id} style={card}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>{r.players?.first_name} {r.players?.last_name}</div>
              <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{formatCurrency(feeTotal(r))}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, backgroundColor: st.bg, color: st.fg }}>{st.label}</span>
          </div>
        );
      })}

      {registrations.length > 0 && (
        <Link to="/admin/financials" style={{ ...linkBtn, display: 'inline-block', marginTop: 16, fontWeight: 500 }}>Record payments in Financials →</Link>
      )}
    </div>
  );
}

const linkBtn = { background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, cursor: 'pointer', padding: 0, textDecoration: 'none' };
const card = { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, boxShadow: 'var(--em-shadow-sm)', padding: '12px 14px', marginBottom: 8 };
