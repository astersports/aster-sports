// Wave 3.8 §5.2 — three-option choice dialog for editing a recurring
// event. Replaces the prior 2-option ConfirmDialog ("This one only" /
// "All future") that ambiguously mixed date/time intent with metadata
// intent. The new wording maps 1:1 to recurrence_scope values:
//
//   "Move this single instance"  → 'instance'
//   "Move this and future"       → 'this_and_future'
//   "Move entire series"         → 'series'
//
// Wave 3.8.1 hotfix: each option shows the affected-instance count
// computed from the event's series. Buttons enlarged to 80px. Dialog
// gates only on event.parent_event_id !== null — standalone events
// do not trigger this picker (the spec assumed every event was
// recurring; that's not the case).

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ModalBackground from '../shared/ModalBackground';

const sheet = { backgroundColor: 'var(--as-bg-card)', width: '100%', maxWidth: 520, margin: 16, borderRadius: 16, padding: 16, paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' };
const btnRow = { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 };
const btnBase = { width: '100%', minHeight: 80, borderRadius: 12, fontSize: 16, fontFamily: 'inherit', textAlign: 'left', padding: '12px 16px', cursor: 'pointer', border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 };
const btnCancel = { width: '100%', minHeight: 44, borderRadius: 10, fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--as-text-tertiary)', border: 'none' };

function fmtCount(n) { return n === 1 ? '1 event' : `${n} events`; }

export default function ScopeChoiceDialog({ event, onChoose, onCancel }) {
  const [counts, setCounts] = useState({ future: null, total: null });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      const seriesId = event?.parent_event_id || event?.id;
      if (!seriesId) return;
      const start = event?.start_at;
      const [parentRes, sibFuture, sibAll] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('id', seriesId),
        start ? supabase.from('events').select('id', { count: 'exact', head: true }).eq('parent_event_id', seriesId).gte('start_at', start) : Promise.resolve({ count: 0 }),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('parent_event_id', seriesId),
      ]);
      if (cancelled) return;
      const parentCount = parentRes?.count || 0;
      const futureCount = (sibFuture?.count || 0) + parentCount;
      const totalCount = (sibAll?.count || 0) + parentCount;
      setCounts({ future: futureCount, total: totalCount });
    });
    return () => { cancelled = true; };
  }, [event?.id, event?.parent_event_id, event?.start_at]);

  const subtitle = (label, n) => (
    <>
      <span style={{ fontWeight: 600, fontSize: 16 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>{n == null ? '…' : fmtCount(n)}</span>
    </>
  );

  return createPortal(
    <ModalBackground onClick={onCancel} zIndex={9999}>
      <div style={sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="scope-title">
        <div id="scope-title" style={{ fontSize: 18, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 4 }}>Edit recurring event</div>
        <div style={{ fontSize: 14, color: 'var(--as-text-secondary)' }}>Pick how the change applies.</div>
        <div style={btnRow}>
          <button type="button" className="as-press" style={btnBase} onClick={() => onChoose('instance')}>{subtitle('Move this single instance', 1)}</button>
          <button type="button" className="as-press" style={btnBase} onClick={() => onChoose('this_and_future')}>{subtitle('Move this and future', counts.future)}</button>
          <button type="button" className="as-press" style={btnBase} onClick={() => onChoose('series')}>{subtitle('Move entire series', counts.total)}</button>
          <button type="button" className="as-press" style={btnCancel} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </ModalBackground>,
    document.body
  );
}
