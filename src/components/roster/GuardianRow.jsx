import { Mail, MessageSquare, Phone } from 'lucide-react';
import InviteButton from './InviteButton';

// Guardian contact row. Stacked so the full name never truncates behind the
// contact icons (Frank 2026-06-19, LeagueApps reference): name on its own line,
// then the call / text / email / invite cluster below. 44px tap targets; only
// present channels render (no reserved spacers). `role` is the REAL role
// (useAuth) — invite is an admin ACTION, not a preview-gated display.
export default function GuardianRow({ guardian, role }) {
  const name = `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || 'Guardian';
  const canInvite = role === 'admin' && guardian.email && !guardian.userId;
  const linked = guardian.email && guardian.userId;
  const iconBtn = { width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--as-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const stop = (e) => e.stopPropagation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)' }}>{name}</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {guardian.phone && <a href={`tel:${guardian.phone}`} onClick={stop} aria-label={`Call ${name}`} style={iconBtn}><Phone size={14} strokeWidth={1.75} color="var(--as-text-secondary)" /></a>}
        {guardian.phone && <a href={`sms:${guardian.phone}`} onClick={stop} aria-label={`Text ${name}`} style={iconBtn}><MessageSquare size={14} strokeWidth={1.75} color="var(--as-text-secondary)" /></a>}
        {guardian.email && <a href={`mailto:${guardian.email}`} onClick={stop} aria-label={`Email ${name}`} style={iconBtn}><Mail size={14} strokeWidth={1.75} color="var(--as-text-secondary)" /></a>}
        {canInvite ? <span onClick={stop}><InviteButton guardianEmail={guardian.email} /></span>
          : linked ? <span style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--as-success)' }} title="Account linked">✓</span>
          : null}
      </div>
    </div>
  );
}
