import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function GettingStarted({ hasSeasons, hasPrograms }) {
  const { orgId } = useAuth();
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

  const steps = [
    { label: 'Create your first season', done: hasSeasons,  to: '/admin/seasons' },
    { label: 'Add teams',                 done: hasPrograms, to: '/admin/teams'   },
    { label: 'Add players',               done: hasPlayers,  to: '/teams'         },
    { label: 'Schedule your first event', done: hasEvents,   to: '/schedule'      },
  ];
  const remaining = steps.filter((s) => !s.done).length;

  return (
    <div
      style={{
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full sf-press flex items-center justify-between p-4"
        style={{ background: 'none', border: 'none', minHeight: 44 }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 15 }}>
            Getting started
          </span>
          {remaining > 0 && (
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 999,
              backgroundColor: 'var(--em-neutral-soft)',
              color: 'var(--em-text-secondary)',
            }}>
              {remaining} left
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--em-text-tertiary)" strokeWidth="1.75"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease-out' }}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <div className="sf-collapsible" data-open={open ? 'true' : 'false'}>
        <div className="sf-collapsible-inner">
          <ul className="flex flex-col px-4 pb-3">
            {steps.map((s) => (
              <li key={s.label}>
                <Link
                  to={s.to}
                  className="flex items-center gap-3 sf-press"
                  style={{ minHeight: 44, color: 'var(--em-text-primary)', fontSize: 14 }}
                >
                  {s.done ? (
                    <CheckCircle2 size={20} strokeWidth={1.75} color="var(--em-success)" />
                  ) : (
                    <Circle size={20} strokeWidth={1.75} color="var(--em-text-tertiary)" />
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
