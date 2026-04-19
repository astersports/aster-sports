import { useState } from 'react';
import { Phone, MessageSquare, Mail, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InviteButton from './InviteButton';

export default function PlayerRow({ player, teamColor, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const { role } = useAuth();
  const initial = (player.last_name || player.first_name || '?').charAt(0).toUpperCase();
  const isAcademy = player.member_type === 'futures_academy';
  const guardians = player.guardians || [];

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--sf-border-subtle)' }}>
      <div
        className="flex items-center sf-press"
        onClick={() => { navigator.vibrate?.(10); setExpanded((v) => !v); }}
        onTouchStart={(e) => { e.currentTarget.style.backgroundColor = `${teamColor}08`; }}
        onTouchEnd={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        style={{ padding: '10px 16px', minHeight: 56, transition: 'background-color 150ms ease-out' }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', backgroundColor: teamColor || 'var(--sf-neutral)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--sf-text-inverse)', fontSize: 15, fontWeight: 700, flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
          <div className="flex items-center gap-2">
            <div className="font-semibold truncate" style={{ color: 'var(--sf-text-primary)', fontSize: 15 }}>
              {player.first_name} {player.last_name}
            </div>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: player.payment_status === 'partial' ? 'var(--sf-warning)'
                : player.payment_status === 'overdue' ? 'var(--sf-danger)' : 'var(--sf-success)',
              flexShrink: 0,
            }} title={player.payment_status === 'partial' ? 'Partial payment' : player.payment_status === 'overdue' ? 'Payment overdue' : 'Paid'} />
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
            {isAcademy && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--sf-academy-soft)', color: 'var(--sf-academy)' }}>Academy</span>}
            <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--sf-bg-secondary)', color: 'var(--sf-text-secondary)' }}>{ordinalGrade(player.grade)}</span>
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: 3 }}>
            <div style={{ width: 40, height: 3, borderRadius: 999, backgroundColor: 'var(--sf-bg-tertiary)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${player.attendance_pct || 85}%`, backgroundColor: (player.attendance_pct || 85) >= 80 ? 'var(--sf-success)' : 'var(--sf-warning)', borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--sf-text-tertiary)' }}>{player.attendance_pct || 85}%</span>
          </div>
        </div>
        {player.jersey_number != null && (
          <div style={{
            width: 32, height: 32, borderRadius: '50%', border: `2px solid ${teamColor || 'var(--sf-neutral)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: teamColor || 'var(--sf-text-primary)', flexShrink: 0,
          }}>{player.jersey_number}</div>
        )}
        <ChevronDown size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)"
          style={{ marginLeft: 8, flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms' }} />
      </div>
      {expanded && (
        <div style={{ padding: '4px 16px 12px 68px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guardians.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', fontStyle: 'italic' }}>No guardians linked</div>
            : guardians.map((g) => <GuardianRow key={g.id} guardian={g} role={role} />)}
        </div>
      )}
    </div>
  );
}

function GuardianRow({ guardian, role }) {
  const name = `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || 'Guardian';
  const canInvite = role === 'admin' && guardian.email && !guardian.userId;
  const iconBtn = { width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--sf-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const stop = (e) => e.stopPropagation();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-text-primary)' }}>{name}</span>
      {guardian.phone && <a href={`tel:${guardian.phone}`} onClick={stop} aria-label="Call" style={iconBtn}><Phone size={14} strokeWidth={1.75} color="var(--sf-text-secondary)" /></a>}
      {guardian.phone && <a href={`sms:${guardian.phone}`} onClick={stop} aria-label="Text" style={iconBtn}><MessageSquare size={14} strokeWidth={1.75} color="var(--sf-text-secondary)" /></a>}
      {guardian.email && <a href={`mailto:${guardian.email}`} onClick={stop} aria-label="Email" style={iconBtn}><Mail size={14} strokeWidth={1.75} color="var(--sf-text-secondary)" /></a>}
      {canInvite && <span onClick={stop}><InviteButton guardianEmail={guardian.email} /></span>}
    </div>
  );
}

function ordinalGrade(g) {
  if (!g) return '';
  if (g === 1) return '1st';
  if (g === 2) return '2nd';
  if (g === 3) return '3rd';
  return `${g}th`;
}
