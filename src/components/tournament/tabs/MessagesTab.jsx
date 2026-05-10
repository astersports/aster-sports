import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import LoadingSkeleton from '../../shared/LoadingSkeleton';

export default function MessagesTab({ tournament, isStaff }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament?.id) return;
    let cancelled = false;
    supabase.from('comms_messages')
      .select('id, kind, subject, body_plain, sent_at, created_at')
      .eq('tournament_id', tournament.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('MessagesTab:', error.message);
        setMessages(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tournament?.id]);

  if (loading) return <LoadingSkeleton variant="card" count={2} />;

  if (messages.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 6 }}>No messages sent yet</div>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
          {isStaff ? 'Tournament briefings and updates will appear here once sent.' : 'Tournament updates from your coach will appear here.'}
        </div>
      </div>
    );
  }

  const TYPE_LABELS = {
    weekly_digest: 'Weekly Digest',
    tournament_prelim: 'Tournament Preliminary',
    tournament_final: 'Tournament Final',
    tournament_rsvp_lock: 'Tournament RSVP Lock',
    tournament_recap_interim: 'Tournament Interim Recap',
    tournament_recap_final: 'Tournament Final Recap',
    schedule_change: 'Schedule Change',
    multi_team_notice: 'Multi-Team Notice',
    academy_callup_notice: 'Academy Call-Up',
    custom_message: 'Custom',
  };

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id} style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-accent)', padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--em-accent-soft)' }}>
              {TYPE_LABELS[m.kind] || m.kind}
            </span>
            <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>
              {m.sent_at ? new Date(m.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Draft'}
            </span>
          </div>
          {m.subject && <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>{m.subject}</div>}
          {m.body_plain && <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.5, WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', display: '-webkit-box', overflow: 'hidden' }}>{m.body_plain}</div>}
        </div>
      ))}
    </div>
  );
}
