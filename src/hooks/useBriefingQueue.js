import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { daysUntil, inferMessageType, tournamentStateFor, urgencyForRow } from '../lib/inferMessageType';

const POLL_INTERVAL_MS = 30000;
const SENT_WITHIN_DAYS = 14;

// Calls public.get_briefing_queue(p_org_id) and decorates each row with
// computed inferredType / status / urgency / lastSentAt. Polls every 30s
// so the inbox flips ●→✓ shortly after a send completes.
export function useBriefingQueue() {
  const { orgId } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    const { data, error: err } = await supabase.rpc('get_briefing_queue', { p_org_id: orgId });
    if (cancelledRef.current) return;
    if (err) { setError(err); setLoading(false); return; }
    const now = new Date();
    const decorated = (data || []).map((r) => {
      const tournament = { start_date: r.tournament_start_date, end_date: r.tournament_end_date };
      const inferredType = inferMessageType(tournament, now);
      const sentHistory = Array.isArray(r.sent_history) ? r.sent_history : [];
      const recentInferredSend = sentHistory.find((s) => {
        if (s.message_type !== inferredType) return false;
        const sentMs = new Date(s.sent_at).getTime();
        return (now.getTime() - sentMs) / 86400000 <= SENT_WITHIN_DAYS;
      });
      const lastSentAt = sentHistory.length > 0 ? sentHistory[0].sent_at : null;
      const daysUntilStart = daysUntil(tournament, now);
      const tournamentState = tournamentStateFor(tournament, now);
      const urgency = urgencyForRow({
        hasSentInferred: Boolean(recentInferredSend),
        daysUntilStart,
        tournamentState,
      });
      return {
        ...r,
        inferredType,
        lastSentAt,
        daysUntilStart,
        tournamentState,
        status: recentInferredSend ? 'sent' : 'pending',
        urgency,
      };
    });
    setRows(decorated);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    cancelledRef.current = false;
    Promise.resolve().then(refresh);
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [refresh]);

  return { rows, loading, error, refresh };
}
