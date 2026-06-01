import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePublicProgram } from '../hooks/usePublicProgram';
import DivisionCard from '../components/register/DivisionCard';

// Public (unauth) registration entry — spec §5.2. /r/:slug → program hero + division grid.
// Read-only in PR B; PR C wires DivisionCard.onSelect → the registration wizard.

function shortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

function resolveRegState(program) {
  const now = Date.now();
  const opensAt = program.reg_opens_at ? new Date(program.reg_opens_at).getTime() : null;
  const closesAt = program.reg_closes_at ? new Date(program.reg_closes_at).getTime() : null;
  if (opensAt && now < opensAt) return 'upcoming';
  if (closesAt && now >= closesAt) return 'closed';
  return 'open';
}

const centered = { padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' };

export default function RegisterEntryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = usePublicProgram(slug);
  const program = data?.program;

  useEffect(() => {
    if (program) document.title = `Register · ${program.name}`;
    return () => { document.title = 'AsterSports'; };
  }, [program]);

  if (loading) return <div style={centered}>Loading…</div>;
  if (error) return <div style={centered}>Couldn’t load this page. Try again in a moment.</div>;
  if (!data || !program) {
    return (
      <div style={{ ...centered, maxWidth: 600, margin: '0 auto', minHeight: '100vh' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginTop: 48 }}>This registration link isn’t open yet</h1>
        <p style={{ fontSize: 15, marginTop: 8 }}>Check back soon — your program admin will share the link the moment it’s live.</p>
      </div>
    );
  }

  const regState = resolveRegState(program);
  const opensLabel = shortDate(program.reg_opens_at);
  const divisions = data.divisions || [];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {program.org_logo_url && (
          <img src={program.org_logo_url} alt="" style={{ height: 48, margin: '8px auto', display: 'block' }} />
        )}
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--em-text-tertiary)' }}>{program.org_name}</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--em-text-primary)', margin: '4px 0' }}>{program.name}</h1>
        <div style={{ width: 32, height: 3, backgroundColor: 'var(--em-accent)', borderRadius: 2, margin: '8px auto' }} />
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--em-text-tertiary)', margin: '0 0 12px' }}>Pick a division</h2>

      {divisions.length === 0 && (
        <div style={{ ...centered, fontSize: 15 }}>Divisions are being finalized. Check back soon.</div>
      )}

      {divisions.map((d) => (
        <DivisionCard
          key={d.id} division={d} regState={regState} opensLabel={opensLabel}
          onSelect={() => navigate(`/r/${slug}/apply?division=${d.id}`)}
        />
      ))}

      {regState === 'closed' && divisions.length > 0 && (
        <div style={{ ...centered, fontSize: 13, marginTop: 4 }}>Registration for {program.name} has closed.</div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--em-text-tertiary)' }}>Powered by AsterSports</div>
    </div>
  );
}
