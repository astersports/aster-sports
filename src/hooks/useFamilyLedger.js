import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// One family's financial detail for /admin/financials/family/:accountId —
// the invoice (financial_accounts) + canonical balance (family_balances view)
// + the full append-only ledger (financial_transactions, incl. reversal links).
// All reads are org-scoped (AP#37) and error-checked (AP#36).
export function useFamilyLedger(orgId, accountId) {
  const [account, setAccount] = useState(null);
  const [balances, setBalances] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!orgId || !accountId) { setLoading(false); return; }
    setLoading(true);
    const id = ++fetchIdRef.current;
    const [accRes, balRes, txnRes] = await Promise.all([
      supabase.from('financial_accounts')
        .select('id, guardian_id, season_id, season_fee_cents, discount_cents, discount_reason, notes, guardians(first_name, last_name)')
        .eq('org_id', orgId).eq('id', accountId).maybeSingle(),
      supabase.from('family_balances')
        .select('billed_cents, net_paid_cents, total_fees_cents, balance_cents')
        .eq('org_id', orgId).eq('account_id', accountId).maybeSingle(),
      supabase.from('financial_transactions')
        .select('id, transaction_type, amount_cents, payment_method, reference, occurred_at, notes, reverses_transaction_id, processing_fee_cents')
        .eq('org_id', orgId).eq('account_id', accountId).order('occurred_at', { ascending: false }),
    ]);
    if (id !== fetchIdRef.current) return;
    if (accRes.error) console.error('useFamilyLedger account:', accRes.error.message);
    if (balRes.error) console.error('useFamilyLedger balances:', balRes.error.message);
    if (txnRes.error) console.error('useFamilyLedger txns:', txnRes.error.message);
    setAccount(accRes.data || null);
    setBalances(balRes.data || null);
    setTransactions(txnRes.data || []);
    setLoading(false);
  }, [orgId, accountId]);

  useEffect(() => { Promise.resolve().then(load); }, [load]);
  return { account, balances, transactions, loading, refetch: load };
}
