import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// Phase 3 D-6(a) parent inbox — detail view.
// Renders comms_message_recipients.body_html_rendered as-is — same body
// the parent received via email. Guarantees parity by construction:
// the rendered HTML lives on the recipient row, not the message row.
//
// Iframe sandbox per CLAUDE.md §12 #12 (and DevicePreviewFrame
// pattern): srcdoc isolates inline styles/scripts from the host app.

const headerBar = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '12px 16px', borderBottom: '1px solid var(--as-border-default)',
  background: 'var(--as-bg-card)',
};
const backBtn = {
  width: 36, height: 36, borderRadius: 8, border: '1px solid var(--as-border-default)',
  background: 'var(--as-bg-card)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const frameStyle = {
  width: '100%', minHeight: 'calc(100vh - 140px)',
  border: 'none', display: 'block', background: '#fff',
};

export default function InboxDetail({ recipientId, onBack }) {
  const { guardianId } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!recipientId || !guardianId) return undefined;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('comms_message_recipients')
        .select(`id, message_id, opened_at, body_html_rendered, body_plain_rendered,
          subject_rendered, email_at_send,
          comms_messages ( kind, subject, sent_at )`)
        .eq('id', recipientId)
        .eq('guardian_id', guardianId)
        .maybeSingle();
      if (cancelled) return;
      if (err) { setError(err); setRecord(null); setLoading(false); return; }
      setRecord(data || null);
      setLoading(false);
      // Best-effort mark-as-opened on detail view. Idempotent — only writes
      // if currently null. Mark-as-read state proper is deferred to a
      // follow-up wave per Phase 2 D-6(a) minimal-viable scope.
      if (data && !data.opened_at) {
        supabase.from('comms_message_recipients')
          .update({ opened_at: new Date().toISOString() })
          .eq('id', recipientId).then(() => {}, () => {});
      }
    });
    return () => { cancelled = true; };
  }, [recipientId, guardianId]);

  if (loading) return <div style={{ padding: 24 }}><LoadingSkeleton variant="card" count={2} /></div>;
  if (error) return <div style={{ padding: 24, color: 'var(--as-danger)' }} role="alert">Could not load briefing. Try again.</div>;
  if (!record) return <div style={{ padding: 24 }} role="status">Briefing not found.</div>;

  const html = record.body_html_rendered || '<p>(No content captured for this briefing.)</p>';
  const subject = record.subject_rendered || record.comms_messages?.subject || '(no subject)';

  return (
    <div>
      <div style={headerBar}>
        <button type="button" onClick={onBack} className="as-press" style={backBtn} aria-label="Back to inbox">
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>{subject}</div>
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 2 }}>
            {record.comms_messages?.sent_at ? new Date(record.comms_messages.sent_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Pending send'}
          </div>
        </div>
      </div>
      <iframe srcDoc={html} title={subject} sandbox="allow-same-origin" style={frameStyle} />
    </div>
  );
}
