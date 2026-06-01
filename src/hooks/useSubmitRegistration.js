import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Calls the submit_registration SECURITY DEFINER RPC (migration 20260601044918) with the
// assembled payload. Anon-callable. Returns the server-authoritative result
// ({ registration_ids, authoritative_total_cents, already_registered, guardian_id }).
// {data,error} surfaced explicitly (anti-pattern #36).
export function useSubmitRegistration() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function submit(payload) {
    setSubmitting(true);
    setError(null);
    const { data, error: rpcErr } = await supabase.rpc('submit_registration', { p_payload: payload });
    setSubmitting(false);
    if (rpcErr) {
      setError(rpcErr);
      return { ok: false, error: rpcErr };
    }
    setResult(data);
    return { ok: true, data };
  }

  return { submit, submitting, error, result };
}
