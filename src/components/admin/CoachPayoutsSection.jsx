import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/formatters';
import Label from '../shared/Label';
import LoadingSkeleton from '../shared/LoadingSkeleton';

export default function CoachPayoutsSection({ orgId }) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    supabase.from('coach_payouts')
      .select('id, coach_user_id, amount_cents, status, payment_method, period_start, period_end, paid_at, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('CoachPayoutsSection:', error.message);
        setPayouts(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [orgId]);

  const STATUS_COLORS = {
    pending: 'var(--as-warning)',
    paid: 'var(--as-success)',
    disputed: 'var(--as-danger)',
  };

  if (loading) return <div style={{ marginTop: 24 }}><Label>Coach Payouts</Label><LoadingSkeleton variant="card" count={1} /></div>;

  return (
    <div style={{ marginTop: 24 }}>
      <Label>Coach Payouts</Label>
      {payouts.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', color: 'var(--as-text-tertiary)', fontSize: 13 }}>
          No payouts recorded yet. When coaching session payments are logged, they appear here.
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' }}>
          {payouts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--as-border-subtle)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--as-text-primary)' }}>
                  {p.period_start && p.period_end
                    ? `${new Date(p.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })} – ${new Date(p.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}`
                    : new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 2 }}>{p.payment_method || 'Not specified'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{formatCurrency(p.amount_cents / 100)}</div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: STATUS_COLORS[p.status] || 'var(--as-text-tertiary)' }}>{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
