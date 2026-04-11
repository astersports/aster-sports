import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronDown, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const LS_KEY = 'sf.gettingStarted.dismissed';

// Reads localStorage without throwing in environments where storage is
// disabled (private mode, server render, etc).
function readDismissed() {
  try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
}

export default function GettingStarted({ hasSeasons, hasPrograms }) {
  const { orgId } = useAuth();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [open, setOpen] = useState(false);
  const [hasPlayers, setHasPlayers] = useState(false);
  const [hasEvents, setHasEvents] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const { count: pc } = await supabase
          .from('team_players').select('id', { count: 'exact', head: true });
        if (!cancelled) setHasPlayers((pc ?? 0) > 0);
      } catch { /* table may not exist yet */ }
      try {
        const { count: ec } = await supabase
          .from('events').select('id', { count: 'exact', head: true });
        if (!cancelled) setHasEvents((ec ?? 0) > 0);
      } catch { /* table may not exist yet */ }
    });
    return () => { cancelled = true; };
  }, [orgId]);

  if (dismissed) return null;

  const steps = [
    { label: 'Create your first season', done: hasSeasons,  to: '/admin/seasons' },
    { label: 'Add teams',                 done: hasPrograms, to: '/admin/teams'   },
    { label: 'Add players',               done: hasPlayers,  to: '/teams'         },
    { label: 'Schedule your first event', done: hasEvents,   to: '/schedule'      },
  ];
  const remaining = steps.filter((s) => !s.done).length;

  const dismiss = (e) => {
    e.stopPropagation();
    try { localStorage.setItem(LS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-subtle)',
        boxShadow: 'var(--sf-shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 sf-press"
        style={{ minHeight: 44, padding: '0 12px 0 16px' }}
        aria-expanded={open}
      >
        <span
          className="font-semibold flex-1 text-left"
          style={{ color: 'var(--sf-text-primary)', fontSize: 15 }}
        >
          Getting started
        </span>
        {remaining > 0 && (
          <span
            style={{
              fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
              backgroundColor: 'var(--sf-accent-soft)', color: 'var(--sf-accent)',
            }}
          >
            {remaining} remaining
          </span>
        )}
        <ChevronDown
          size={20}
          strokeWidth={1.75}
          color="var(--sf-text-tertiary)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease-out' }}
        />
        <span
          role="button"
          tabIndex={0}
          onClick={dismiss}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dismiss(e); }}
          aria-label="Dismiss getting started"
          className="flex items-center justify-center"
          style={{ width: 32, height: 44, color: 'var(--sf-text-tertiary)' }}
        >
          <X size={18} strokeWidth={1.75} />
        </span>
      </button>
      <div className="sf-collapsible" data-open={open ? 'true' : 'false'}>
        <div className="sf-collapsible-inner">
          <ul className="flex flex-col px-4 pb-3">
            {steps.map((s) => (
              <li key={s.label}>
                <Link
                  to={s.to}
                  className="flex items-center gap-3 sf-press"
                  style={{ minHeight: 44, color: 'var(--sf-text-primary)', fontSize: 14 }}
                >
                  {s.done ? (
                    <CheckCircle2 size={20} strokeWidth={1.75} color="var(--sf-success)" />
                  ) : (
                    <Circle size={20} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
                  )}
                  <span style={{ textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.6 : 1 }}>
                    {s.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
