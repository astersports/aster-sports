// Wave 3.12 — read-only briefing history detail. Shows rendered HTML
// preview (sandboxed iframe), per-recipient delivery breakdown, audit
// metadata. Re-send to specific recipient + Archive deferred to a
// follow-up; placeholder buttons surface the intent.

import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

const wrap = { backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' };
const inner = { maxWidth: 760, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 };
const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 14 };
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };
const titleStyle = { fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)' };
const backBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--as-text-secondary)', fontFamily: 'inherit', cursor: 'pointer', fontSize: 13 };
const tableStyle = { width: '100%', fontSize: 13, borderCollapse: 'collapse' };
const cellStyle = { padding: '8px 6px', borderBottom: '1px solid var(--as-border-subtle)', textAlign: 'left' };
const iframeStyle = { width: '100%', minHeight: 400, border: '1px solid var(--as-border-default)', borderRadius: 10, backgroundColor: 'var(--as-bg-card)' };
const rollup = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 };
const stat = { flex: '1 1 0', minWidth: 64, padding: '8px 10px', borderRadius: 8, background: 'var(--as-bg-secondary)', textAlign: 'center' };
const statLbl = { fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', marginTop: 1 };

// SEE — minimum delivery rollup (architect FORK E gate). Aggregates the
// already-fetched per-recipient rows by provider signal; reflects H1-reconciled
// statuses (#907). No new query, no migration.
function Stat({ label, value, danger }) {
  return (
    <div style={stat}>
      <div style={{ fontSize: 18, fontWeight: 700, color: danger && value ? 'var(--as-danger)' : 'var(--as-text-primary)' }}>{value}</div>
      <div style={statLbl}>{label}</div>
    </div>
  );
}

export default function BriefingHistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const iframeRef = useRef(null);
  const [msg, setMsg] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const stats = useMemo(() => {
    let delivered = 0, opened = 0, bounced = 0;
    for (const r of recipients) {
      if (r.delivered_at) delivered += 1;
      if (r.opened_at) opened += 1;
      if (r.delivery_status === 'bounced' || r.bounce_reason) bounced += 1;
    }
    return { total: recipients.length, delivered, opened, bounced };
  }, [recipients]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      // AP #37 — org_id first on org-scoped tables.
      const { data: m, error: mErr } = await supabase.from('comms_messages').select('*').eq('org_id', orgId).eq('id', id).maybeSingle();
      if (mErr) throw mErr;
      if (cancelled) return;
      setMsg(m);
      const { data: rec } = await supabase.from('comms_message_recipients').select('id,email_at_send,delivery_status,delivered_at,opened_at,bounce_reason,body_html_rendered,body_plain_rendered').eq('message_id', id).order('email_at_send');
      if (cancelled) return;
      setRecipients(rec || []);
    });
    return () => { cancelled = true; };
  }, [id, orgId]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const html = recipients[previewIdx]?.body_html_rendered || msg?.body_html || '';
    const doc = iframe.contentDocument; if (!doc) return;
    doc.open();
    doc.write(`<!doctype html><html><body style="margin:0;background:#f8fafc;">${html}</body></html>`);
    doc.close();
  }, [previewIdx, recipients, msg?.body_html]);

  if (!msg) return <div style={{ padding: 24, color: 'var(--as-text-tertiary)' }}>Loading…</div>;
  const meta = KIND_METADATA[msg.kind] || {};

  return (
    <div style={wrap}>
      <div style={inner}>
        <button type="button" onClick={() => navigate('/admin/briefings/history')} className="as-press" style={backBtn}><ArrowLeft size={14} /> Back to sent</button>
        <div style={card}>
          <div style={labelStyle}>{meta.label || msg.kind}</div>
          <div style={titleStyle}>{msg.subject || '(no subject)'}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--as-text-secondary)' }}>
            Sent {msg.sent_at ? new Date(msg.sent_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : '—'} · {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={labelStyle}>Preview as</span>
            <select value={previewIdx} onChange={(e) => setPreviewIdx(Number(e.target.value))} style={{ minHeight: 32, padding: '0 8px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)' }}>
              {recipients.length === 0 && <option value={0}>(message body)</option>}
              {recipients.map((r, i) => (<option key={r.id} value={i}>{r.email_at_send}</option>))}
            </select>
          </div>
          <iframe ref={iframeRef} title="Briefing history preview" sandbox="" style={iframeStyle} />
        </div>
        <div style={card}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Delivery</div>
          {recipients.length > 0 && (
            <div style={rollup}>
              <Stat label="Sent" value={stats.total} />
              <Stat label="Delivered" value={stats.delivered} />
              <Stat label="Opened" value={stats.opened} />
              <Stat label="Bounced" value={stats.bounced} danger />
            </div>
          )}
          <table style={tableStyle}>
            <thead><tr><th style={cellStyle}>Email</th><th style={cellStyle}>Status</th><th style={cellStyle}>Delivered</th><th style={cellStyle}>Opened</th></tr></thead>
            <tbody>
              {recipients.map((r) => (
                <tr key={r.id}>
                  <td style={cellStyle}>{r.email_at_send}</td>
                  <td style={cellStyle}>{r.delivery_status || '—'}</td>
                  <td style={cellStyle}>{r.delivered_at ? new Date(r.delivered_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : '—'}</td>
                  <td style={cellStyle}>{r.opened_at ? '✓' : '—'}</td>
                </tr>
              ))}
              {recipients.length === 0 && (<tr><td colSpan={4} style={{ ...cellStyle, color: 'var(--as-text-tertiary)' }}>No recipient breakdown captured.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
