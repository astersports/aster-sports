import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useEventArrivals } from '../../hooks/useEventArrivals';
import { useNow } from '../../hooks/useNow';

export default function ParentArrivalActions({ event }) {
  const { myChildren } = useAuth();
  const { setArrival, getStatus } = useEventArrivals(event.id);
  const [lateChild, setLateChild] = useState(null);
  const now = useNow();
  const kids = (myChildren || []).filter((c) => c.teamId === event.team_id);
  const msUntil = new Date(event.start_at).getTime() - now;
  const msAfter = now - new Date(event.start_at).getTime();
  if (msUntil > 2 * 60 * 60 * 1000 || msAfter > 60 * 60 * 1000) return null;
  if (kids.length === 0) return null;

  return (
    <div style={{ padding: '12px 16px' }}>
      {kids.map((child) => {
        const status = getStatus(child.playerId);
        if (status?.status === 'arrived') {
          const t = new Date(status.status_changed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          return <div key={child.playerId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 14, color: 'var(--em-success)', fontWeight: 500 }}>✅ {child.firstName} arrived at {t}</div>;
        }
        if (status?.status === 'running_late') {
          return <div key={child.playerId} style={{ padding: '8px 0', fontSize: 14, color: 'var(--em-warning)', fontWeight: 500 }}>⏰ {child.firstName} running late — ETA {status.eta_minutes} min</div>;
        }
        return (
          <div key={child.playerId} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 6 }}>{child.firstName}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button type="button" onClick={() => setArrival(child.playerId, 'on_the_way')} className="sf-press"
                style={{ minHeight: 52, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>🏃 On the way</button>
              <button type="button" onClick={() => { setArrival(child.playerId, 'arrived'); navigator.vibrate?.(50); }} className="sf-press"
                style={{ minHeight: 52, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-success)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>✅ Here</button>
              <button type="button" onClick={() => setLateChild(child)} className="sf-press"
                style={{ minHeight: 52, borderRadius: 10, border: '1px solid var(--em-warning)', backgroundColor: 'transparent', color: 'var(--em-warning)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>⏰ Running late</button>
            </div>
          </div>
        );
      })}
      {lateChild && createPortal(
        <div className="fixed inset-0 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9998 }} onClick={() => setLateChild(null)}>
          <div className="sf-fade-in" style={{ width: '100%', maxWidth: 420, backgroundColor: 'var(--em-bg-card)', borderRadius: '16px 16px 0 0', padding: 20, paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 12 }}>How late is {lateChild.firstName}?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {[5, 10, 15, 30].map((m) => (
                <button key={m} type="button" className="sf-press" onClick={() => { setArrival(lateChild.playerId, 'running_late', { eta: m }); setLateChild(null); }}
                  style={{ minHeight: 52, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>{m} min</button>
              ))}
            </div>
            <button type="button" onClick={() => setLateChild(null)} style={{ width: '100%', minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
