import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

// HOME_DESIGN_SPEC §1.1.9 — parent home registration / payment
// reminder. Trigger: guardian has outstanding balance on active
// season's financial_account.
//
// Data: financial_accounts holds one row per (guardian_id,
// season_id), so the card surfaces a single guardian-level balance
// for the active season (not per-kid). Computation flows through
// the shared useSeasonFinancials hook via guardianId filter — same
// math as FinancialDashboardPage and admin home's payment lane.
//
// Visibility: presence-driven. Renders only when stats.outstanding
// > 0. No CTA in v1 — parent-facing payment surface isn't built;
// card is informational. Future iteration ships an admin-contact
// or external-pay link.

// Currency now routes through the shared formatCurrency (style:currency, shows
// cents — "$1,275.00") so the parent-facing balance matches admin/financials
// exactly. Was a local round-to-whole-dollars copy ("$1,275"); that parent/admin
// split was the registered AP #63 / HOME-6 divergence — resolved here by
// unifying on cents (Frank call, 2026-05-30).

export default function RegistrationReminderCard({ stats, seasonName, loading }) {
  if (loading || !stats || stats.outstanding <= 0) return null;

  return (
    <section aria-label="Payment due">
      <div
        style={{
          backgroundColor: 'var(--as-warning-soft)',
          borderRadius: 10,
          border: '1px solid var(--as-warning)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <AlertCircle
          size={20}
          strokeWidth={1.75}
          color="var(--as-warning)"
          style={{ flexShrink: 0, marginTop: 2 }}
          aria-hidden="true"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--as-warning)',
              marginBottom: 2,
            }}
          >
            Payment Due
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>
            {formatCurrency(stats.outstanding)} owed
            {seasonName ? ` · ${seasonName}` : ''}
          </div>
          <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 2 }}>
            Contact your program admin to settle your balance.
          </div>
        </div>
      </div>
    </section>
  );
}
