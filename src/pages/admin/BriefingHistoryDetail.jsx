// Wave 3.12 — read-only briefing history detail. Shows rendered HTML
// preview (sandboxed iframe), per-recipient delivery breakdown, audit
// metadata. Re-send to specific recipient + Archive deferred to a
// follow-up; placeholder buttons surface the intent.

import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import BriefingRatingCard from '../../components/admin/BriefingRatingCard';

const wrap = { backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' };
const inner = { maxWidth: 760, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 };
const card = { backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, padding: 14 };
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' };
const titleStyle = { fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)' };
const backBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--em-text-secondary)', fontFamily: 'inherit', cursor: 'pointer', fontSize: 13 };
const tableStyle = { width: '100%', fontSize: 13, borderCollapse: 'collapse' };
const cellStyle = { padding: '8px 6px', borderBottom: '1px solid var(--em-border-subtle)', textAlign: 'left' };
const iframeStyle = { width: '100%', minHeight: 400, border: '1px solid var(--em-border-default)', borderRadius: 10, backgroundColor: 'var(--em-bg-card)' };

export default function BriefingHistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const iframeRef = useRef(null);
  const [msg, setMsg] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [previewIdx, setPreviewIdx] = useState(0);

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

  if (!msg) return <div style={{ padding: 24, color: 'var(--em-text-tertiary)' }}>Loading…</div>;
  const meta = KIND_METADATA[msg.kind] || {};

  return (
    <div style={wrap}>
      <div style={inner}>
        <button type="button" onClick={() => navigate('/admin/briefings/history')} className="sf-press" style={backBtn}><ArrowLeft size={14} /> Back to sent</button>
        <div style={card}>
          <div style={labelStyle}>{meta.label || msg.kind}</div>
          <div style={titleStyle}>{msg.subject || '(no subject)'}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--em-text-secondary)' }}>
            Sent {msg.sent_at ? new Date(msg.sent_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : '—'} · {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
          </div>
        </div>
        <BriefingRatingCard messageId={id} />
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={labelStyle}>Preview as</span>
            <select value={previewIdx} onChange={(e) => setPreviewIdx(Number(e.target.value))} style={{ minHeight: 32, padding: '0 8px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)' }}>
              {recipients.length === 0 && <option value={0}>(message body)</option>}
              {recipients.map((r, i) => (<option key={r.id} value={i}>{r.email_at_send}</option>))}
            </select>
          </div>
          <iframe ref={iframeRef} title="Briefing history preview" sandbox="" style={iframeStyle} />
        </div>
        <div style={card}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Delivery</div>
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
              {recipients.length === 0 && (<tr><td colSpan={4} style={{ ...cellStyle, color: 'var(--em-text-tertiary)' }}>No recipient breakdown captured.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
