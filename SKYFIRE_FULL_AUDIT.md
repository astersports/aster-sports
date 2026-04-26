# SKYFIRE FULL AUDIT
# Generated: Sun Apr 19 09:56:09 PM EDT 2026
# Repo: ~/legacy-hoopers-app (branch v2)


## src/App.jsx (90 lines)
```
     1	import { lazy, Suspense } from 'react';
     2	import { Routes, Route, useLocation } from 'react-router-dom';
     3	import AppShell from './components/layout/AppShell';
     4	import RequireAuth from './components/layout/RequireAuth';
     5	import LoginPage from './pages/LoginPage';
     6	import ForgotPasswordPage from './pages/ForgotPasswordPage';
     7	import UnauthorizedPage from './pages/UnauthorizedPage';
     8	import HomePage from './pages/HomePage';
     9	import SchedulePage from './pages/SchedulePage';
    10	import ScorePage from './pages/ScorePage';
    11	import TeamsPage from './pages/TeamsPage';
    12	import TeamDetailPage from './pages/TeamDetailPage';
    13	import MessagesPage from './pages/MessagesPage';
    14	import EventDetailPage from './pages/EventDetailPage';
    15	import AccountPage from './pages/AccountPage';
    16	
    17	const AdminSeasonsPage = lazy(() => import('./pages/AdminSeasonsPage'));
    18	const AdminTeamsPage = lazy(() => import('./pages/AdminTeamsPage'));
    19	
    20	const LAZY_FALLBACK = <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading...</div>;
    21	
    22	// Wrap an authenticated route in both the shell and the auth guard. Keeps
    23	// the route table below flat and readable instead of nesting <RequireAuth>
    24	// manually on every line.
    25	const Protected = ({ children, allowedRoles }) => (
    26	  <RequireAuth allowedRoles={allowedRoles}>
    27	    <AppShell>{children}</AppShell>
    28	  </RequireAuth>
    29	);
    30	
    31	function PageTransition({ children }) {
    32	  const location = useLocation();
    33	  return (
    34	    <div key={location.pathname} className="sf-fade-in">
    35	      {children}
    36	    </div>
    37	  );
    38	}
    39	
    40	export default function App() {
    41	  return (
    42	    <PageTransition>
    43	      <Suspense fallback={LAZY_FALLBACK}>
    44	      <Routes>
    45	      {/* Public auth routes — no shell, no guard */}
    46	      <Route path="/login" element={<LoginPage />} />
    47	      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    48	      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    49	
    50	      {/* Authenticated routes */}
    51	      <Route path="/"         element={<Protected><HomePage /></Protected>} />
    52	      <Route path="/schedule" element={<Protected><SchedulePage /></Protected>} />
    53	      <Route
    54	        path="/score"
    55	        element={
    56	          <Protected allowedRoles={['admin', 'coach']}>
    57	            <ScorePage />
    58	          </Protected>
    59	        }
    60	      />
    61	      <Route path="/teams"           element={<Protected><TeamsPage /></Protected>} />
    62	      <Route path="/teams/:teamId"   element={<Protected><TeamDetailPage /></Protected>} />
    63	      <Route path="/messages"        element={<Protected><MessagesPage /></Protected>} />
    64	      <Route path="/account"         element={<Protected><AccountPage /></Protected>} />
    65	
    66	      {/* Full-screen authenticated routes — auth guard without AppShell chrome */}
    67	      <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />
    68	
    69	      {/* Admin-only management routes */}
    70	      <Route
    71	        path="/admin/seasons"
    72	        element={
    73	          <Protected allowedRoles={['admin']}>
    74	            <AdminSeasonsPage />
    75	          </Protected>
    76	        }
    77	      />
    78	      <Route
    79	        path="/admin/teams"
    80	        element={
    81	          <Protected allowedRoles={['admin']}>
    82	            <AdminTeamsPage />
    83	          </Protected>
    84	        }
    85	      />
    86	    </Routes>
    87	      </Suspense>
    88	    </PageTransition>
    89	  );
    90	}
```

## src/components/admin/ActiveSeasonCard.jsx (104 lines)
```
     1	import { Link } from 'react-router-dom';
     2	import { formatDateFull } from '../../lib/formatters';
     3	
     4	// Computes week-of-season progress as a 0..1 float. Dates that haven't
     5	// started yet clamp to 0; dates past the end clamp to 1. End dates in the
     6	// same week as today still show the final week count so the UI never
     7	// flips to "Week 0 of 0".
     8	function seasonProgress(start, end) {
     9	  if (!start || !end) return { pct: 0, weekIdx: 0, totalWeeks: 0 };
    10	  const s = new Date(start).getTime();
    11	  const e = new Date(end).getTime();
    12	  const now = Date.now();
    13	  const totalMs = Math.max(e - s, 1);
    14	  const WEEK = 7 * 24 * 60 * 60 * 1000;
    15	  const totalWeeks = Math.max(1, Math.round(totalMs / WEEK));
    16	  const elapsed = Math.min(Math.max(now - s, 0), totalMs);
    17	  const weekIdx = Math.min(totalWeeks, Math.max(1, Math.ceil((elapsed / WEEK) || 1)));
    18	  return { pct: elapsed / totalMs, weekIdx, totalWeeks };
    19	}
    20	
    21	export default function ActiveSeasonCard({ season }) {
    22	  if (!season) {
    23	    return (
    24	      <div
    25	        className="p-4"
    26	        style={{
    27	          backgroundColor: 'var(--em-bg-card)',
    28	          borderRadius: 10,
    29	          border: '1px solid var(--em-border-default)',
    30	          boxShadow: 'var(--em-shadow-sm)',
    31	        }}
    32	      >
    33	        <div style={{ color: 'var(--em-text-secondary)', fontSize: 14, marginBottom: 8 }}>
    34	          No active season
    35	        </div>
    36	        <Link
    37	          to="/admin/seasons"
    38	          className="inline-flex items-center sf-press font-semibold"
    39	          style={{
    40	            minHeight: 44, padding: '0 16px', borderRadius: 10,
    41	            backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 14,
    42	          }}
    43	        >
    44	          Create your first season
    45	        </Link>
    46	      </div>
    47	    );
    48	  }
    49	
    50	  const { pct, weekIdx, totalWeeks } = seasonProgress(season.start_date, season.end_date);
    51	  return (
    52	    <Link
    53	      to="/admin/seasons"
    54	      className="block p-4 sf-press"
    55	      style={{
    56	        backgroundColor: 'var(--em-bg-card)',
    57	        borderRadius: 10,
    58	        border: '1px solid var(--em-border-default)',
    59	        boxShadow: 'var(--em-shadow-sm)',
    60	        color: 'inherit',
    61	      }}
    62	    >
    63	      <div style={{ color: 'var(--em-text-secondary)', fontSize: 13, marginBottom: 10 }}>
    64	        {formatDateFull(season.start_date)} – {formatDateFull(season.end_date)}
    65	      </div>
    66	      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
    67	        <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
    68	          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--em-bg-tertiary)" strokeWidth="3" />
    69	          <circle
    70	            cx="24" cy="24" r="20" fill="none"
    71	            stroke="var(--em-accent)"
    72	            strokeWidth="3"
    73	            strokeLinecap="round"
    74	            strokeDasharray={`${2 * Math.PI * 20}`}
    75	            strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct)}`}
    76	            style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
    77	          />
    78	          <text
    79	            x="24" y="24"
    80	            textAnchor="middle"
    81	            dominantBaseline="central"
    82	            style={{
    83	              fontSize: 11,
    84	              fontWeight: 700,
    85	              fill: 'var(--em-text-primary)',
    86	              transform: 'rotate(90deg)',
    87	              transformOrigin: '24px 24px',
    88	            }}
    89	          >
    90	            {Math.round(pct * 100)}%
    91	          </text>
    92	        </svg>
    93	        <div>
    94	          <div className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 15 }}>
    95	            Week {weekIdx} of {totalWeeks}
    96	          </div>
    97	          <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>
    98	            {Math.round(pct * 100)}% complete
    99	          </div>
   100	        </div>
   101	      </div>
   102	    </Link>
   103	  );
   104	}
```

## src/components/admin/FormControls.jsx (72 lines)
```
     1	// Tiny building blocks for the admin CRUD sheets. Kept separate so the
     2	// TeamFormSheet and SeasonFormSheet don't each reinvent the same input
     3	// styles — everything that writes to --em-* tokens lives here.
     4	
     5	export function Field({ label, children }) {
     6	  return (
     7	    <div className="mb-3">
     8	      <div style={{ color: 'var(--em-text-secondary)', fontSize: 13, marginBottom: 6 }}>
     9	        {label}
    10	      </div>
    11	      {children}
    12	    </div>
    13	  );
    14	}
    15	
    16	export function Input({ value, onChange, placeholder, type = 'text' }) {
    17	  return (
    18	    <input
    19	      type={type}
    20	      value={value}
    21	      placeholder={placeholder}
    22	      onChange={(e) => onChange(e.target.value)}
    23	      style={{
    24	        width: '100%',
    25	        minHeight: 44,
    26	        padding: '0 14px',
    27	        borderRadius: 10,
    28	        border: '1px solid var(--em-border-default)',
    29	        backgroundColor: 'var(--em-bg-card)',
    30	        color: 'var(--em-text-primary)',
    31	        fontSize: 15,
    32	        outline: 'none',
    33	      }}
    34	    />
    35	  );
    36	}
    37	
    38	// Radio-style chip row for single-value selectors (age group, gender,
    39	// competition type, day of week, etc.). `options` is an array of
    40	// { key, label }; the key is what gets persisted.
    41	export function ChipField({ label, options, value, onChange }) {
    42	  return (
    43	    <Field label={label}>
    44	      <div className="flex flex-wrap gap-2">
    45	        {options.map(({ key, label: optLabel }) => {
    46	          const active = value === key;
    47	          return (
    48	            <button
    49	              key={key}
    50	              type="button"
    51	              onClick={() => onChange(key)}
    52	              className="sf-press"
    53	              style={{
    54	                minHeight: 44,
    55	                padding: '0 16px',
    56	                borderRadius: 999,
    57	                fontSize: 13,
    58	                border: `1px solid ${active ? 'var(--em-accent)' : 'var(--em-border-default)'}`,
    59	                backgroundColor: active ? 'var(--em-accent-soft)' : 'var(--em-bg-card)',
    60	                color: active ? 'var(--em-accent)' : 'var(--em-text-primary)',
    61	                fontWeight: 500,
    62	              }}
    63	              aria-pressed={active}
    64	            >
    65	              {optLabel}
    66	            </button>
    67	          );
    68	        })}
    69	      </div>
    70	    </Field>
    71	  );
    72	}
```

## src/components/admin/GettingStarted.jsx (107 lines)
```
     1	import { useEffect, useState } from 'react';
     2	import { Link } from 'react-router-dom';
     3	import { CheckCircle2, Circle } from 'lucide-react';
     4	import { supabase } from '../../lib/supabase';
     5	import { useAuth } from '../../context/AuthContext';
     6	
     7	export default function GettingStarted({ hasSeasons, hasPrograms }) {
     8	  const { orgId } = useAuth();
     9	  const [open, setOpen] = useState(false);
    10	  const [hasPlayers, setHasPlayers] = useState(false);
    11	  const [hasEvents, setHasEvents] = useState(false);
    12	
    13	  useEffect(() => {
    14	    if (!orgId) return;
    15	    let cancelled = false;
    16	    Promise.resolve().then(async () => {
    17	      try {
    18	        const { count: pc } = await supabase
    19	          .from('team_players').select('id', { count: 'exact', head: true });
    20	        if (!cancelled) setHasPlayers((pc ?? 0) > 0);
    21	      } catch { /* table may not exist yet */ }
    22	      try {
    23	        const { count: ec } = await supabase
    24	          .from('events').select('id', { count: 'exact', head: true });
    25	        if (!cancelled) setHasEvents((ec ?? 0) > 0);
    26	      } catch { /* table may not exist yet */ }
    27	    });
    28	    return () => { cancelled = true; };
    29	  }, [orgId]);
    30	
    31	  const steps = [
    32	    { label: 'Create your first season', done: hasSeasons,  to: '/admin/seasons' },
    33	    { label: 'Add teams',                 done: hasPrograms, to: '/admin/teams'   },
    34	    { label: 'Add players',               done: hasPlayers,  to: '/teams'         },
    35	    { label: 'Schedule your first event', done: hasEvents,   to: '/schedule'      },
    36	  ];
    37	  const remaining = steps.filter((s) => !s.done).length;
    38	
    39	  return (
    40	    <div
    41	      style={{
    42	        backgroundColor: 'var(--em-bg-card)',
    43	        borderRadius: 10,
    44	        border: '1px solid var(--em-border-default)',
    45	        boxShadow: 'var(--em-shadow-sm)',
    46	        overflow: 'hidden',
    47	      }}
    48	    >
    49	      <button
    50	        type="button"
    51	        onClick={() => setOpen((v) => !v)}
    52	        className="w-full sf-press flex items-center justify-between p-4"
    53	        style={{ background: 'none', border: 'none', minHeight: 44 }}
    54	      >
    55	        <div className="flex items-center gap-2">
    56	          <span className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 15 }}>
    57	            Getting started
    58	          </span>
    59	          {remaining > 0 && (
    60	            <span style={{
    61	              fontSize: 11,
    62	              fontWeight: 600,
    63	              padding: '2px 8px',
    64	              borderRadius: 999,
    65	              backgroundColor: 'var(--em-neutral-soft)',
    66	              color: 'var(--em-text-secondary)',
    67	            }}>
    68	              {remaining} left
    69	            </span>
    70	          )}
    71	        </div>
    72	        <svg
    73	          width="16" height="16" viewBox="0 0 24 24" fill="none"
    74	          stroke="var(--em-text-tertiary)" strokeWidth="1.75"
    75	          strokeLinecap="round" strokeLinejoin="round"
    76	          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease-out' }}
    77	        >
    78	          <path d="m6 9 6 6 6-6"/>
    79	        </svg>
    80	      </button>
    81	      <div className="sf-collapsible" data-open={open ? 'true' : 'false'}>
    82	        <div className="sf-collapsible-inner">
    83	          <ul className="flex flex-col px-4 pb-3">
    84	            {steps.map((s) => (
    85	              <li key={s.label}>
    86	                <Link
    87	                  to={s.to}
    88	                  className="flex items-center gap-3 sf-press"
    89	                  style={{ minHeight: 44, color: 'var(--em-text-primary)', fontSize: 14 }}
    90	                >
    91	                  {s.done ? (
    92	                    <CheckCircle2 size={20} strokeWidth={1.75} color="var(--em-success)" />
    93	                  ) : (
    94	                    <Circle size={20} strokeWidth={1.75} color="var(--em-text-tertiary)" />
    95	                  )}
    96	                  <span style={{ textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.6 : 1 }}>
    97	                    {s.label}
    98	                  </span>
    99	                </Link>
   100	              </li>
   101	            ))}
   102	          </ul>
   103	        </div>
   104	      </div>
   105	    </div>
   106	  );
   107	}
```

## src/components/admin/KpiGrid.jsx (137 lines)
```
     1	import { useState, useEffect } from 'react';
     2	import { Users, Calendar, DollarSign, AlertCircle } from 'lucide-react';
     3	import { formatCurrency } from '../../lib/formatters';
     4	
     5	// Animates a number from 0 to `target` over `duration` ms with an
     6	// ease-out cubic curve. Called per Card with the resolved numeric value
     7	// so non-numeric values (currency strings) bypass the hook via the
     8	// isNumber check in Card and render unchanged.
     9	function useCountUp(target, duration = 600) {
    10	  const [value, setValue] = useState(0);
    11	  useEffect(() => {
    12	    if (target === 0) { setValue(0); return; }
    13	    const start = performance.now();
    14	    const step = (now) => {
    15	      const progress = Math.min((now - start) / duration, 1);
    16	      const eased = 1 - Math.pow(1 - progress, 3);
    17	      setValue(Math.round(eased * target));
    18	      if (progress < 1) requestAnimationFrame(step);
    19	    };
    20	    requestAnimationFrame(step);
    21	  }, [target, duration]);
    22	  return value;
    23	}
    24	
    25	// Tiny fixed-shape sparkline placeholder. Until we wire a real
    26	// time-series into the card, every numeric KPI gets the same 7-point
    27	// upward polyline — mimics a trending line at 1/48px resolution.
    28	function Sparkline({ color }) {
    29	  return (
    30	    <svg width="48" height="16" viewBox="0 0 48 16" style={{ marginTop: 4, opacity: 0.5 }}>
    31	      <polyline
    32	        points="0,14 8,10 16,12 24,6 32,8 40,3 48,5"
    33	        fill="none"
    34	        stroke={color || 'var(--em-text-tertiary)'}
    35	        strokeWidth="1.5"
    36	        strokeLinecap="round"
    37	        strokeLinejoin="round"
    38	      />
    39	    </svg>
    40	  );
    41	}
    42	
    43	// Pulsing placeholder block for the value row. Used while stats are
    44	// still loading so the card doesn't flash "0 → real value" on mount.
    45	function ValueSkeleton() {
    46	  return (
    47	    <div
    48	      className="sf-pulse"
    49	      style={{
    50	        width: '60%',
    51	        height: 24,
    52	        borderRadius: 6,
    53	        backgroundColor: 'var(--em-bg-tertiary)',
    54	      }}
    55	      aria-hidden="true"
    56	    />
    57	  );
    58	}
    59	
    60	// 2x2 KPI grid at the top of the admin dashboard. Each card renders the
    61	// same shell — small icon top-left, big value, small secondary label.
    62	// `min-w-0` on the card is load-bearing: without it, a long currency
    63	// value like "$999,999.99" would widen its grid column past 50% of the
    64	// viewport and blow out the parent (CSS grid items default to
    65	// min-width: auto, which refuses to shrink below content width).
    66	function Card(props) {
    67	  const { label, value, accent, accentValue, loading, stagger } = props;
    68	  const Icon = props.icon;
    69	  const isNumber = typeof value === 'number';
    70	  const animated = useCountUp(loading ? 0 : (isNumber ? value : 0));
    71	
    72	  return (
    73	    <div
    74	      className={`p-4 min-w-0 sf-press ${stagger || ''}`}
    75	      style={{
    76	        backgroundColor: 'var(--em-bg-card)',
    77	        borderRadius: 10,
    78	        border: '1px solid var(--em-border-default)',
    79	        boxShadow: 'var(--em-shadow-sm)',
    80	        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
    81	      }}
    82	      onClick={() => navigator.vibrate?.(10)}
    83	    >
    84	      <div style={{ color: accent || 'var(--em-text-tertiary)', marginBottom: 8 }}>
    85	        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
    86	      </div>
    87	      {loading ? (
    88	        <ValueSkeleton />
    89	      ) : (
    90	        <div
    91	          className="font-bold truncate"
    92	          style={{
    93	            color: accentValue ? accent : 'var(--em-text-primary)',
    94	            fontSize: 24,
    95	            lineHeight: 1.1,
    96	          }}
    97	          title={String(value)}
    98	        >
    99	          {isNumber ? animated : value}
   100	        </div>
   101	      )}
   102	      {!loading && isNumber && value > 0 && <Sparkline color={accent} />}
   103	      <div className="truncate" style={{ color: 'var(--em-text-secondary)', fontSize: 13, marginTop: 2 }}>
   104	        {label}
   105	      </div>
   106	    </div>
   107	  );
   108	}
   109	
   110	export default function KpiGrid({ stats }) {
   111	  const { players, events, collected, outstanding, loading } = stats;
   112	
   113	  return (
   114	    <div className="grid grid-cols-2 gap-3">
   115	      <Card icon={Users} label="Players" value={players} loading={loading} stagger="sf-stagger-1" />
   116	      <Card icon={Calendar} label="Events" value={events} loading={loading} accent="var(--em-info)" stagger="sf-stagger-2" />
   117	      <Card
   118	        icon={DollarSign}
   119	        label="Collected"
   120	        value={formatCurrency(collected)}
   121	        loading={loading}
   122	        accent="var(--em-success)"
   123	        accentValue
   124	        stagger="sf-stagger-3"
   125	      />
   126	      <Card
   127	        icon={AlertCircle}
   128	        label="Outstanding"
   129	        value={formatCurrency(outstanding)}
   130	        loading={loading}
   131	        accent={outstanding > 0 ? 'var(--em-warning)' : 'var(--em-text-tertiary)'}
   132	        accentValue={outstanding > 0}
   133	        stagger="sf-stagger-4"
   134	      />
   135	    </div>
   136	  );
   137	}
```

## src/components/admin/NextEventCard.jsx (66 lines)
```
     1	import { useState, useEffect } from 'react';
     2	
     3	// Live countdown. Re-renders every second while targetDate is truthy —
     4	// used only on the Home dashboard below the Season card so the
     5	// dashboard has one always-ticking element. Returns null if no date.
     6	function useLiveCountdown(targetDate) {
     7	  const [now, setNow] = useState(Date.now());
     8	  useEffect(() => {
     9	    if (!targetDate) return;
    10	    const id = setInterval(() => setNow(Date.now()), 1000);
    11	    return () => clearInterval(id);
    12	  }, [targetDate]);
    13	
    14	  if (!targetDate) return null;
    15	  const diff = new Date(targetDate).getTime() - now;
    16	  if (diff <= 0) return 'Now';
    17	  const days = Math.floor(diff / 86400000);
    18	  const hours = Math.floor((diff % 86400000) / 3600000);
    19	  const mins = Math.floor((diff % 3600000) / 60000);
    20	  const secs = Math.floor((diff % 60000) / 1000);
    21	  if (days > 0) return `${days}d ${hours}h ${mins}m`;
    22	  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    23	  return `${mins}m ${secs}s`;
    24	}
    25	
    26	// Next Event countdown card. Target date + label are hardcoded
    27	// placeholders — swap for an activities query once the events API
    28	// is wired up.
    29	export default function NextEventCard() {
    30	  // TODO: replace with real next event date from activities query
    31	  const countdown = useLiveCountdown('2026-04-16T18:30:00');
    32	  return (
    33	    <div
    34	      className="sf-stagger-5"
    35	      style={{
    36	        backgroundColor: 'var(--em-bg-card)',
    37	        borderRadius: 10,
    38	        border: '1px solid var(--em-border-default)',
    39	        boxShadow: 'var(--em-shadow-sm)',
    40	        padding: 16,
    41	        marginTop: 12,
    42	        display: 'flex',
    43	        alignItems: 'center',
    44	        justifyContent: 'space-between',
    45	      }}
    46	    >
    47	      <div>
    48	        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' }}>
    49	          NEXT EVENT
    50	        </div>
    51	        <div className="font-semibold" style={{ fontSize: 15, color: 'var(--em-text-primary)', marginTop: 2 }}>
    52	          Practice · 10U Black
    53	        </div>
    54	      </div>
    55	      <div style={{ textAlign: 'right' }}>
    56	        <div className="font-bold" style={{ fontSize: 20, color: 'var(--em-accent)', fontVariantNumeric: 'tabular-nums' }}>
    57	          {countdown || '—'}
    58	        </div>
    59	        <div className="sf-pulse-dot" style={{
    60	          width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--em-success)',
    61	          margin: '4px 0 0 auto',
    62	        }} />
    63	      </div>
    64	    </div>
    65	  );
    66	}
```

## src/components/admin/QuickActions.jsx (54 lines)
```
     1	import { Link } from 'react-router-dom';
     2	import { CalendarPlus, UserPlus, MessageSquare, Calendar } from 'lucide-react';
     3	
     4	// Four-chip horizontal scroll row for the admin home shortcuts. The create
     5	// routes are placeholders for now — they deep-link into the schedule/roster
     6	// pages and will gain dedicated /new routes in a later prompt.
     7	const ACTIONS = [
     8	  { label: '+ Event',  icon: CalendarPlus,  to: '/schedule' },
     9	  { label: '+ Player', icon: UserPlus,      to: '/teams'    },
    10	  { label: 'Message',  icon: MessageSquare, to: '/messages' },
    11	  { label: 'Schedule', icon: Calendar,      to: '/schedule' },
    12	];
    13	
    14	export default function QuickActions() {
    15	  // Previously used `-mx-4 px-4` to bleed edge-to-edge inside the
    16	  // parent's px-4 gutter, but the negative margins were blowing out the
    17	  // page wrapper's computed width on iOS Safari and letting the whole
    18	  // admin dashboard drag horizontally. A plain scroll row sits inside
    19	  // the gutter — slightly less chrome-y, no overflow risk.
    20	  return (
    21	    <div
    22	      className="flex gap-2 overflow-x-auto sf-no-scrollbar"
    23	      style={{ maxWidth: '100%' }}
    24	      aria-label="Quick actions"
    25	    >
    26	      {ACTIONS.map((action) => {
    27	        const Icon = action.icon;
    28	        return (
    29	          <Link
    30	            key={action.label}
    31	            to={action.to}
    32	            onClick={() => navigator.vibrate?.(10)}
    33	            className="flex items-center gap-2 sf-press whitespace-nowrap"
    34	            style={{
    35	              minHeight: 44,
    36	              padding: '0 16px',
    37	              borderRadius: 10,
    38	              backgroundColor: 'var(--em-bg-card)',
    39	              border: '1px solid var(--em-border-default)',
    40	              boxShadow: 'var(--em-shadow-sm)',
    41	              color: 'var(--em-text-primary)',
    42	              fontSize: 14,
    43	              fontWeight: 500,
    44	              transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
    45	            }}
    46	          >
    47	            <Icon size={20} strokeWidth={1.75} style={{ color: 'var(--em-text-tertiary)' }} aria-hidden="true" />
    48	            {action.label}
    49	          </Link>
    50	        );
    51	      })}
    52	    </div>
    53	  );
    54	}
```

## src/components/admin/SeasonFormSheet.jsx (129 lines)
```
     1	import { useState } from 'react';
     2	import FullScreenForm from '../shared/FullScreenForm';
     3	
     4	// Maps a preset quarter label to (monthStart, monthEnd) pairs that we'll
     5	// combine with the chosen year to produce start_date / end_date. Months
     6	// are 1-indexed here because it keeps the date string construction below
     7	// a lot easier to read.
     8	const PRESETS = {
     9	  Spring: { start: [3, 1],  end: [6, 30] },
    10	  Summer: { start: [7, 1],  end: [8, 31] },
    11	  Fall:   { start: [9, 1],  end: [11, 30] },
    12	  Winter: { start: [12, 1], end: [2, 28] }, // Winter rolls into next year
    13	};
    14	
    15	const ymd = (y, m, d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    16	
    17	function applyPreset(quarter, year) {
    18	  const p = PRESETS[quarter];
    19	  const start = ymd(year, p.start[0], p.start[1]);
    20	  const endYear = quarter === 'Winter' ? year + 1 : year;
    21	  const end = ymd(endYear, p.end[0], p.end[1]);
    22	  return { name: `${quarter} ${year}`, start_date: start, end_date: end };
    23	}
    24	
    25	// FullScreenForm unmounts its children when closed, so Body mounts fresh
    26	// on every open and initializes useState directly from the season prop —
    27	// no effect-based reset needed. The `key` also remounts Body when the
    28	// edited season changes while the sheet is already open.
    29	export default function SeasonFormSheet({ open, season, onClose, onSave }) {
    30	  const title = season ? 'Edit season' : 'New season';
    31	  return (
    32	    <FullScreenForm open={open} onClose={onClose} title={title}>
    33	      <Body key={season?.id ?? 'new'} season={season} onSave={onSave} />
    34	    </FullScreenForm>
    35	  );
    36	}
    37	
    38	function Body({ season, onSave }) {
    39	  const editing = !!season;
    40	  const [name, setName] = useState(season?.name ?? '');
    41	  const [startDate, setStartDate] = useState(season?.start_date ?? '');
    42	  const [endDate, setEndDate] = useState(season?.end_date ?? '');
    43	  const thisYear = new Date().getFullYear();
    44	  const [year, setYear] = useState(
    45	    season?.start_date ? new Date(season.start_date).getFullYear() : thisYear,
    46	  );
    47	
    48	  const pickPreset = (quarter) => {
    49	    const preset = applyPreset(quarter, year);
    50	    setName(preset.name);
    51	    setStartDate(preset.start_date);
    52	    setEndDate(preset.end_date);
    53	  };
    54	
    55	  const submit = () => {
    56	    if (!name.trim() || !startDate || !endDate) return;
    57	    onSave({ name: name.trim(), start_date: startDate, end_date: endDate });
    58	  };
    59	
    60	  const chip = (active) => ({
    61	    minHeight: 44, padding: '0 16px', borderRadius: 999, fontSize: 13,
    62	    border: `1px solid ${active ? 'var(--em-accent)' : 'var(--em-border-default)'}`,
    63	    backgroundColor: active ? 'var(--em-accent-soft)' : 'var(--em-bg-card)',
    64	    color: active ? 'var(--em-accent)' : 'var(--em-text-primary)',
    65	    fontWeight: 500,
    66	  });
    67	  const inputStyle = {
    68	    width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10,
    69	    border: '1px solid var(--em-border-default)',
    70	    backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
    71	    fontSize: 15, outline: 'none',
    72	  };
    73	  const label = { color: 'var(--em-text-secondary)', fontSize: 13, marginBottom: 6, display: 'block' };
    74	
    75	  return (
    76	    <div>
    77	        <div className="mb-4">
    78	          <span style={label}>Preset</span>
    79	          <div className="flex flex-wrap gap-2 mb-2">
    80	            {Object.keys(PRESETS).map((q) => (
    81	              <button key={q} type="button" className="sf-press" style={chip(false)} onClick={() => pickPreset(q)}>
    82	                {q} {year}
    83	              </button>
    84	            ))}
    85	          </div>
    86	          <div className="flex gap-2">
    87	            {[thisYear, thisYear + 1].map((y) => (
    88	              <button
    89	                key={y}
    90	                type="button"
    91	                className="sf-press"
    92	                style={chip(y === year)}
    93	                onClick={() => setYear(y)}
    94	              >
    95	                {y}
    96	              </button>
    97	            ))}
    98	          </div>
    99	        </div>
   100	
   101	        <label className="block mb-3">
   102	          <span style={label}>Name</span>
   103	          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring 2026" />
   104	        </label>
   105	
   106	        <label className="block mb-3">
   107	          <span style={label}>Start date</span>
   108	          <input type="date" style={inputStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
   109	        </label>
   110	
   111	        <label className="block mb-5">
   112	          <span style={label}>End date</span>
   113	          <input type="date" style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
   114	        </label>
   115	
   116	        <button
   117	          type="button"
   118	          onClick={submit}
   119	          className="w-full font-semibold sf-press sf-bounce-tap"
   120	          style={{
   121	            minHeight: 44, borderRadius: 10,
   122	            backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15,
   123	          }}
   124	        >
   125	        {editing ? 'Save changes' : 'Create season'}
   126	      </button>
   127	    </div>
   128	  );
   129	}
```

## src/components/admin/TeamFormSheet.jsx (144 lines)
```
     1	import { useState } from 'react';
     2	import FullScreenForm from '../shared/FullScreenForm';
     3	import ConfirmDialog from '../shared/ConfirmDialog';
     4	import { Field, Input, ChipField } from './FormControls';
     5	
     6	const AGE_GROUPS = ['8U', '9U', '10U', '11U', '12U'].map((a) => ({ key: a, label: a }));
     7	const GENDERS = [
     8	  { key: 'male',   label: 'Male'   },
     9	  { key: 'female', label: 'Female' },
    10	  { key: 'coed',   label: 'Coed'   },
    11	];
    12	const CIRCUITS = [
    13	  { key: 'aau',         label: 'AAU'         },
    14	  { key: 'league_play', label: 'League Play' },
    15	  { key: 'tournament',  label: 'Tournament'  },
    16	];
    17	const COLOR_SWATCHES = ['#7C3AED', '#18181B', '#2563EB', '#DC2626', '#EA580C', '#059669'];
    18	const DAYS = [
    19	  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' },
    20	  { key: 'wed', label: 'Wed' }, { key: 'thu', label: 'Thu' },
    21	  { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
    22	  { key: 'sun', label: 'Sun' },
    23	];
    24	
    25	// Columns the form edits. Everything else on the row (id, org_id, season_id,
    26	// timestamps) is owned by the server and stripped before save.
    27	const EMPTY = {
    28	  name: '', age_group: '10U', gender: 'male', circuit: 'aau',
    29	  circuit_name: '', team_color: '#2563EB', practice_day: '',
    30	  practice_location: '', sort_order: 0,
    31	};
    32	
    33	// FullScreenForm unmounts children when closed, so Body mounts fresh
    34	// each open and initializes state from `program` directly — no effect-
    35	// based reset needed. The title flips on new vs. edit.
    36	export default function TeamFormSheet({ open, program, onClose, onSave, onDelete }) {
    37	  const title = program ? 'Edit team' : 'New team';
    38	  return (
    39	    <FullScreenForm open={open} onClose={onClose} title={title}>
    40	      <Body key={program?.id ?? 'new'} program={program} onSave={onSave} onDelete={onDelete} />
    41	    </FullScreenForm>
    42	  );
    43	}
    44	
    45	function Body({ program, onSave, onDelete }) {
    46	  const editing = !!program;
    47	  const [form, setForm] = useState(editing ? { ...EMPTY, ...program } : EMPTY);
    48	  const [confirmDel, setConfirmDel] = useState(false);
    49	  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    50	
    51	  const submit = () => {
    52	    if (!form.name.trim()) return;
    53	    onSave({
    54	      name: form.name.trim(),
    55	      age_group: form.age_group,
    56	      gender: form.gender,
    57	      circuit: form.circuit,
    58	      circuit_name: form.circuit === 'aau' ? (form.circuit_name || null) : null,
    59	      team_color: form.team_color,
    60	      practice_day: form.practice_day || null,
    61	      practice_location: form.practice_location || null,
    62	      sort_order: Number(form.sort_order) || 0,
    63	    });
    64	  };
    65	
    66	  return (
    67	    <>
    68	      <div>
    69	        <Field label="Display name">
    70	          <Input value={form.name} onChange={(v) => patch('name', v)} placeholder="10U Black" />
    71	        </Field>
    72	        <ChipField label="Age group" options={AGE_GROUPS} value={form.age_group} onChange={(v) => patch('age_group', v)} />
    73	        <ChipField label="Gender" options={GENDERS} value={form.gender} onChange={(v) => patch('gender', v)} />
    74	        <ChipField label="Competition type" options={CIRCUITS} value={form.circuit} onChange={(v) => patch('circuit', v)} />
    75	        {form.circuit === 'aau' && (
    76	          <Field label="Circuit name">
    77	            <Input value={form.circuit_name ?? ''} onChange={(v) => patch('circuit_name', v)} placeholder="Zero Gravity" />
    78	          </Field>
    79	        )}
    80	
    81	        <Field label="Team color">
    82	          <div className="flex flex-wrap gap-2">
    83	            {COLOR_SWATCHES.map((hex) => (
    84	              <button
    85	                key={hex} type="button" className="sf-press"
    86	                onClick={() => patch('team_color', hex)}
    87	                aria-label={`Color ${hex}`} aria-pressed={form.team_color === hex}
    88	                style={{
    89	                  width: 44, height: 44, borderRadius: '50%', backgroundColor: hex,
    90	                  border: `3px solid ${form.team_color === hex ? 'var(--em-text-primary)' : 'transparent'}`,
    91	                }}
    92	              />
    93	            ))}
    94	            <input
    95	              type="color" aria-label="Custom color"
    96	              value={form.team_color || '#2563EB'}
    97	              onChange={(e) => patch('team_color', e.target.value)}
    98	              style={{ width: 44, height: 44, border: 'none', background: 'none' }}
    99	            />
   100	          </div>
   101	        </Field>
   102	
   103	        <ChipField label="Practice day" options={DAYS} value={form.practice_day ?? ''} onChange={(v) => patch('practice_day', v)} />
   104	        <Field label="Practice location">
   105	          <Input value={form.practice_location ?? ''} onChange={(v) => patch('practice_location', v)} placeholder="St. Patrick's Gym" />
   106	        </Field>
   107	        <Field label="Sort order">
   108	          <Input type="number" value={String(form.sort_order ?? 0)} onChange={(v) => patch('sort_order', v)} />
   109	        </Field>
   110	
   111	        <div className="flex gap-2 mt-4">
   112	          {editing && (
   113	            <button
   114	              type="button" onClick={() => setConfirmDel(true)}
   115	              className="flex-1 font-semibold sf-press"
   116	              style={{
   117	                minHeight: 44, borderRadius: 10, fontSize: 15,
   118	                backgroundColor: 'var(--em-danger-soft)', color: 'var(--em-danger)',
   119	              }}
   120	            >Delete</button>
   121	          )}
   122	          <button
   123	            type="button" onClick={submit}
   124	            className="flex-1 font-semibold sf-press sf-bounce-tap"
   125	            style={{
   126	              minHeight: 44, borderRadius: 10, fontSize: 15,
   127	              backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
   128	            }}
   129	          >{editing ? 'Save changes' : 'Create team'}</button>
   130	        </div>
   131	      </div>
   132	
   133	      <ConfirmDialog
   134	        open={confirmDel}
   135	        title="Delete this team?"
   136	        message="Events, roster assignments, and RSVPs for this team will also be removed."
   137	        confirmLabel="Delete"
   138	        destructive
   139	        onCancel={() => setConfirmDel(false)}
   140	        onConfirm={() => { setConfirmDel(false); onDelete?.(program.id); }}
   141	      />
   142	    </>
   143	  );
   144	}
```

## src/components/admin/TeamPerformanceStrip.jsx (38 lines)
```
     1	// Horizontal scroll strip of team performance cards on the Admin
     2	// Home. Each card shows team name, W-L record placeholder, and a
     3	// short metadata line. Tapping navigates to the team detail page.
     4	export default function TeamPerformanceStrip({ programs, navigate }) {
     5	  return (
     6	    <div className="flex gap-3 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 4 }}>
     7	      {programs.map((team) => (
     8	        <button
     9	          key={team.id}
    10	          type="button"
    11	          onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${team.id}`); }}
    12	          className="sf-press sf-fade-in"
    13	          style={{
    14	            flexShrink: 0,
    15	            width: 140,
    16	            padding: 12,
    17	            borderRadius: 10,
    18	            backgroundColor: 'var(--em-bg-card)',
    19	            border: '1px solid var(--em-border-default)',
    20	            boxShadow: 'var(--em-shadow-sm)',
    21	            textAlign: 'left',
    22	            borderTop: `3px solid ${team.team_color || 'var(--em-neutral)'}`,
    23	          }}
    24	        >
    25	          <div className="font-semibold truncate" style={{ fontSize: 14, color: 'var(--em-text-primary)' }}>
    26	            {team.name}
    27	          </div>
    28	          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginTop: 4 }}>
    29	            0-0
    30	          </div>
    31	          <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
    32	            {team.age_group} · {team.circuit === 'aau' ? 'AAU' : 'League Play'}
    33	          </div>
    34	        </button>
    35	      ))}
    36	    </div>
    37	  );
    38	}
```

## src/components/ErrorBoundary.jsx (55 lines)
```
     1	import { Component } from 'react';
     2	
     3	// Root-level error boundary. Catches synchronous render errors anywhere
     4	// below it and shows a refresh prompt instead of a white screen.
     5	export default class ErrorBoundary extends Component {
     6	  constructor(props) {
     7	    super(props);
     8	    this.state = { hasError: false };
     9	  }
    10	
    11	  static getDerivedStateFromError() {
    12	    return { hasError: true };
    13	  }
    14	
    15	  componentDidCatch(error, errorInfo) {
    16	    console.error('Uncaught error:', error, errorInfo);
    17	  }
    18	
    19	  render() {
    20	    if (!this.state.hasError) return this.props.children;
    21	    return (
    22	      <div
    23	        className="sf-fullscreen flex items-center justify-center px-4"
    24	        style={{ backgroundColor: 'var(--em-bg-page)' }}
    25	      >
    26	        <div className="text-center">
    27	          <h1
    28	            className="font-semibold"
    29	            style={{ color: 'var(--em-text-primary)', fontSize: 20, marginBottom: 8 }}
    30	          >
    31	            Something went wrong
    32	          </h1>
    33	          <p style={{ color: 'var(--em-text-secondary)', fontSize: 14, marginBottom: 16 }}>
    34	            Please try refreshing the page.
    35	          </p>
    36	          <button
    37	            type="button"
    38	            onClick={() => window.location.reload()}
    39	            className="font-semibold sf-press"
    40	            style={{
    41	              minHeight: 44,
    42	              padding: '0 20px',
    43	              borderRadius: 10,
    44	              backgroundColor: 'var(--em-accent)',
    45	              color: 'var(--em-text-inverse)',
    46	              fontSize: 15,
    47	            }}
    48	          >
    49	            Refresh
    50	          </button>
    51	        </div>
    52	      </div>
    53	    );
    54	  }
    55	}
```

## src/components/event/AddToCalendarButton.jsx (18 lines)
```
     1	import { Calendar } from 'lucide-react';
     2	import { downloadIcs } from '../../lib/icalHelpers';
     3	
     4	export default function AddToCalendarButton({ event }) {
     5	  if (!(new Date(event.start_at) > new Date())) return null;
     6	  return (
     7	    <button type="button" onClick={() => downloadIcs(event)} style={{
     8	      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
     9	      width: 'calc(100% - 32px)', margin: '0 16px 16px', minHeight: 44,
    10	      borderRadius: 10, border: '1px solid var(--em-border-default)',
    11	      backgroundColor: 'var(--em-bg-card)', color: 'var(--em-accent)',
    12	      fontSize: 14, fontWeight: 500,
    13	    }}>
    14	      <Calendar size={16} strokeWidth={1.75} />
    15	      Add to Calendar
    16	    </button>
    17	  );
    18	}
```

## src/components/event/EventCancelActions.jsx (46 lines)
```
     1	import { Ban } from 'lucide-react';
     2	import { supabase } from '../../lib/supabase';
     3	
     4	export default function EventCancelActions({ event, onStatusChange }) {
     5	  const doCancel = async () => {
     6	    const ok = window.confirm('Cancel this event? It will stay on the schedule as cancelled.');
     7	    if (!ok) return;
     8	    const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', event.id);
     9	    if (error) { window.alert(`Cancel failed: ${error.message}`); return; }
    10	    onStatusChange?.('cancelled');
    11	  };
    12	
    13	  const doReinstate = async () => {
    14	    const { error } = await supabase.from('events').update({ status: 'scheduled' }).eq('id', event.id);
    15	    if (error) { window.alert(`Reinstate failed: ${error.message}`); return; }
    16	    onStatusChange?.('scheduled');
    17	  };
    18	
    19	  return (
    20	    <div style={{ padding: '16px' }}>
    21	      {event.status !== 'cancelled' && (
    22	        <button type="button" onClick={doCancel} className="sf-press"
    23	          style={{
    24	            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    25	            width: '100%', minHeight: 44, borderRadius: 10,
    26	            border: '1px solid var(--em-warning)', backgroundColor: 'transparent',
    27	            color: 'var(--em-warning)', fontSize: 14, fontWeight: 500,
    28	          }}>
    29	          <Ban size={16} strokeWidth={1.75} />
    30	          Cancel Event
    31	        </button>
    32	      )}
    33	      {event.status === 'cancelled' && (
    34	        <button type="button" onClick={doReinstate} className="sf-press"
    35	          style={{
    36	            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    37	            width: '100%', minHeight: 44, borderRadius: 10,
    38	            border: '1px solid var(--em-accent)', backgroundColor: 'transparent',
    39	            color: 'var(--em-accent)', fontSize: 14, fontWeight: 500,
    40	          }}>
    41	          Reinstate Event
    42	        </button>
    43	      )}
    44	    </div>
    45	  );
    46	}
```

## src/components/event/EventCheckinOverlay.jsx (22 lines)
```
     1	import { createPortal } from 'react-dom';
     2	import { ArrowLeft } from 'lucide-react';
     3	import EventCheckinTab from './EventCheckinTab';
     4	
     5	const iconBtn = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };
     6	
     7	export default function EventCheckinOverlay({ eventId, roster, teamColor, onClose }) {
     8	  return createPortal(
     9	    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--em-bg-page)', zIndex: 9999, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
    10	      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' }}>
    11	        <button type="button" onClick={onClose} className="sf-press" style={iconBtn}>
    12	          <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-primary)" />
    13	        </button>
    14	        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--em-text-primary)' }}>Take Attendance</h2>
    15	      </div>
    16	      <div style={{ flex: 1, overflowY: 'auto' }}>
    17	        <EventCheckinTab eventId={eventId} roster={roster} teamColor={teamColor} />
    18	      </div>
    19	    </div>,
    20	    document.body,
    21	  );
    22	}
```

## src/components/event/EventCheckinTab.jsx (64 lines)
```
     1	import { Check, Circle } from 'lucide-react';
     2	import { useCheckIns } from '../../hooks/useCheckIns';
     3	
     4	// Check-in tab — one toggle per player (present / absent). Writes
     5	// upserts into check_ins with checked_in bool + timestamp. Count
     6	// of checked-in players shown at the top.
     7	export default function EventCheckinTab({ eventId, roster, teamColor }) {
     8	  const { checkIns, loading, toggle } = useCheckIns(eventId);
     9	
    10	  if (loading) {
    11	    return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 14 }}>Loading check-ins...</div>;
    12	  }
    13	  if (roster.length === 0) {
    14	    return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 14 }}>No players on this team yet.</div>;
    15	  }
    16	
    17	  const map = {};
    18	  checkIns.forEach((c) => { map[c.player_id] = c.checked_in; });
    19	  const checkedCount = roster.filter((p) => map[p.id]).length;
    20	
    21	  return (
    22	    <div style={{ padding: '16px 16px 32px' }}>
    23	      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', marginBottom: 12 }}>
    24	        {checkedCount} of {roster.length} checked in
    25	      </div>
    26	      {roster.map((player) => {
    27	        const on = !!map[player.id];
    28	        return (
    29	          <div key={player.id} onClick={() => toggle(player.id, on)}
    30	            className="sf-press"
    31	            style={{
    32	              display: 'flex', alignItems: 'center', gap: 10,
    33	              padding: '10px 0',
    34	              borderBottom: '1px solid var(--em-border-subtle)',
    35	              cursor: 'pointer',
    36	            }}>
    37	            <div style={{
    38	              width: 32, height: 32, borderRadius: 16,
    39	              backgroundColor: teamColor || 'var(--em-bg-tertiary)',
    40	              color: 'var(--em-text-inverse)', fontSize: 12, fontWeight: 600,
    41	              display: 'flex', alignItems: 'center', justifyContent: 'center',
    42	              flexShrink: 0,
    43	            }}>
    44	              {player.jersey_number || '—'}
    45	            </div>
    46	            <div style={{ flex: 1, fontSize: 14, color: 'var(--em-text-primary)', fontWeight: 500 }}>
    47	              {player.first_name} {player.last_name}
    48	            </div>
    49	            <div style={{
    50	              width: 36, height: 36, borderRadius: 18,
    51	              backgroundColor: on ? 'var(--em-success-soft)' : 'transparent',
    52	              border: on ? 'none' : '1px solid var(--em-border-default)',
    53	              display: 'flex', alignItems: 'center', justifyContent: 'center',
    54	            }}>
    55	              {on
    56	                ? <Check size={18} strokeWidth={2.5} color="var(--em-success)" />
    57	                : <Circle size={18} strokeWidth={1.5} color="var(--em-text-tertiary)" />}
    58	            </div>
    59	          </div>
    60	        );
    61	      })}
    62	    </div>
    63	  );
    64	}
```

## src/components/event/EventCommentsTab.jsx (67 lines)
```
     1	import { useState } from 'react';
     2	import { Send, Pin } from 'lucide-react';
     3	import { useComments } from '../../hooks/useComments';
     4	
     5	// Comments thread for an event. Pinned comments float to the top with
     6	// a pin icon, then chronological oldest-first like a chat transcript.
     7	// Text input at the bottom posts a new comment.
     8	export default function EventCommentsTab({ eventId }) {
     9	  const { comments, loading, post } = useComments(eventId);
    10	  const [draft, setDraft] = useState('');
    11	
    12	  const send = async () => {
    13	    if (!draft.trim()) return;
    14	    await post(draft);
    15	    setDraft('');
    16	  };
    17	
    18	  return (
    19	    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
    20	      {loading && <div style={{ color: 'var(--em-text-tertiary)', fontSize: 14 }}>Loading comments...</div>}
    21	      {!loading && comments.length === 0 && (
    22	        <div style={{ color: 'var(--em-text-tertiary)', fontSize: 14 }}>No comments yet. Start the conversation.</div>
    23	      )}
    24	      {comments.map((c) => (
    25	        <div key={c.id} style={{
    26	          backgroundColor: c.pinned ? 'var(--em-warning-soft)' : 'var(--em-bg-card)',
    27	          borderRadius: 10,
    28	          border: '1px solid ' + (c.pinned ? 'var(--em-warning)' : 'var(--em-border-default)'),
    29	          padding: 12,
    30	        }}>
    31	          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
    32	            {c.pinned && <Pin size={12} strokeWidth={2} color="var(--em-warning)" />}
    33	            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--em-text-primary)' }}>
    34	              {c.author_name || 'User'}
    35	            </span>
    36	            <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>
    37	              {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
    38	            </span>
    39	          </div>
    40	          <div style={{ fontSize: 14, color: 'var(--em-text-primary)', whiteSpace: 'pre-wrap' }}>{c.body}</div>
    41	        </div>
    42	      ))}
    43	
    44	      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
    45	        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
    46	          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
    47	          placeholder="Write a comment..."
    48	          style={{
    49	            flex: 1, minHeight: 44, padding: '0 14px', borderRadius: 10,
    50	            border: '1px solid var(--em-border-default)',
    51	            backgroundColor: 'var(--em-bg-card)', fontSize: 15,
    52	            color: 'var(--em-text-primary)',
    53	          }} />
    54	        <button type="button" onClick={send} disabled={!draft.trim()} className="sf-press"
    55	          aria-label="Send comment"
    56	          style={{
    57	            width: 44, height: 44, borderRadius: 10, border: 'none',
    58	            backgroundColor: draft.trim() ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
    59	            color: draft.trim() ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)',
    60	            display: 'flex', alignItems: 'center', justifyContent: 'center',
    61	          }}>
    62	          <Send size={18} strokeWidth={1.75} />
    63	        </button>
    64	      </div>
    65	    </div>
    66	  );
    67	}
```

## src/components/event/EventDetailHeader.jsx (53 lines)
```
     1	import { useNavigate } from 'react-router-dom';
     2	import { ArrowLeft, Pencil, Trash2, UserCheck, Ban } from 'lucide-react';
     3	import { TYPE_LABELS } from '../../lib/constants';
     4	
     5	const iconBtn = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };
     6	
     7	export default function EventDetailHeader({ event, team, isStaff, onEdit, onDelete, onCheckin }) {
     8	  const navigate = useNavigate();
     9	  const teamColor = team?.team_color || 'var(--em-text-tertiary)';
    10	  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
    11	
    12	  return (
    13	    <>
    14	      <div style={{ backgroundColor: teamColor, padding: '0 8px 16px 4px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
    15	        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    16	          <button type="button" onClick={() => navigate(-1)} className="sf-press" style={iconBtn}>
    17	            <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
    18	          </button>
    19	          <div style={{ display: 'flex', gap: 4 }}>
    20	            {isStaff && (
    21	              <button type="button" onClick={onCheckin} className="sf-press" aria-label="Take attendance" style={iconBtn}>
    22	                <UserCheck size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
    23	              </button>
    24	            )}
    25	            <button type="button" onClick={onEdit} className="sf-press" aria-label="Edit event" style={iconBtn}>
    26	              <Pencil size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
    27	            </button>
    28	            <button type="button" onClick={onDelete} className="sf-press" aria-label="Delete event" style={iconBtn}>
    29	              <Trash2 size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
    30	            </button>
    31	          </div>
    32	        </div>
    33	        <div style={{ padding: '0 12px', marginTop: 4 }}>
    34	          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 6 }}>{typeLabel}</span>
    35	          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--em-text-inverse)', margin: '12px 0 0 0' }}>
    36	            {event.title || typeLabel}
    37	          </h1>
    38	          {team && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{team.name}</div>}
    39	        </div>
    40	      </div>
    41	      {event.status === 'cancelled' && (
    42	        <div style={{
    43	          backgroundColor: 'var(--em-danger-soft)', padding: '8px 16px',
    44	          display: 'flex', alignItems: 'center', gap: 8,
    45	          fontSize: 14, fontWeight: 500, color: 'var(--em-danger)',
    46	        }}>
    47	          <Ban size={16} strokeWidth={1.75} />
    48	          This event has been cancelled
    49	        </div>
    50	      )}
    51	    </>
    52	  );
    53	}
```

## src/components/event/EventDetailTab.jsx (39 lines)
```
     1	import { Calendar, Clock } from 'lucide-react';
     2	
     3	// Info block — date/time, location, arrival, opponent, jersey.
     4	// Parent and coach notes are rendered separately in EventDetailPage.
     5	export default function EventDetailTab({ event }) {
     6	  const date = event.start_at ? new Date(event.start_at) : null;
     7	  const endDate = event.end_at ? new Date(event.end_at) : null;
     8	
     9	  const fmt = (d) => d?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    10	  const fmtTime = (d) => d?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    11	
    12	  return (
    13	    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    14	      {date && (
    15	        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--em-text-primary)' }}>
    16	          <Calendar size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
    17	          <span>{fmt(date)}{endDate ? ` · ${fmtTime(date)} – ${fmtTime(endDate)}` : ''}</span>
    18	        </div>
    19	      )}
    20	      {event.arrival_minutes_before > 0 && (
    21	        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--em-text-secondary)' }}>
    22	          <Clock size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
    23	          <span>Arrive {event.arrival_minutes_before} min early</span>
    24	        </div>
    25	      )}
    26	      {event.opponent && (
    27	        <div style={{
    28	          fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)',
    29	          padding: '8px 12px', backgroundColor: 'var(--em-bg-secondary)', borderRadius: 10,
    30	        }}>
    31	          vs. {event.opponent} · {(event.home_away || 'tbd').toUpperCase()}
    32	        </div>
    33	      )}
    34	      {event.jersey && (
    35	        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>Jersey: {event.jersey}</div>
    36	      )}
    37	    </div>
    38	  );
    39	}
```

## src/components/event/EventDutiesTab.jsx (74 lines)
```
     1	import { useDuties } from '../../hooks/useDuties';
     2	import { useAuth } from '../../context/AuthContext';
     3	
     4	// Duties tab — grouped by duty_name. Each row in event_duties is one
     5	// claimable slot (guardian_id nullable). Users tap Claim to take an
     6	// open slot; Release if it's theirs.
     7	export default function EventDutiesTab({ eventId }) {
     8	  const { guardianId } = useAuth();
     9	  const { duties, loading, claim, unclaim } = useDuties(eventId);
    10	
    11	  if (loading) return <Empty text="Loading duties..." />;
    12	  if (duties.length === 0) return <Empty text="No duties set for this event." />;
    13	
    14	  const groups = {};
    15	  duties.forEach((d) => {
    16	    if (!groups[d.duty_name]) groups[d.duty_name] = [];
    17	    groups[d.duty_name].push(d);
    18	  });
    19	
    20	  return (
    21	    <div style={{ padding: '16px 16px 32px' }}>
    22	      {Object.entries(groups).map(([name, slots]) => (
    23	        <div key={name} style={{ marginBottom: 20 }}>
    24	          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', marginBottom: 8 }}>
    25	            {name}
    26	          </div>
    27	          <div style={{
    28	            backgroundColor: 'var(--em-bg-card)', borderRadius: 10,
    29	            border: '1px solid var(--em-border-default)', overflow: 'hidden',
    30	          }}>
    31	            {slots.map((slot, i) => {
    32	              const claimed = !!slot.guardian_id;
    33	              const isMine = claimed && guardianId && slot.guardian_id === guardianId;
    34	              return (
    35	                <div key={slot.id} style={{
    36	                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    37	                  padding: '12px 14px',
    38	                  borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)',
    39	                }}>
    40	                  <div style={{ fontSize: 14, color: claimed ? 'var(--em-text-primary)' : 'var(--em-text-tertiary)' }}>
    41	                    {claimed ? (slot.claimed_by_name || 'Claimed') : 'Open'}
    42	                  </div>
    43	                  {!claimed && (
    44	                    <button type="button" onClick={() => claim(slot.id)} className="sf-press"
    45	                      style={btnStyle('var(--em-accent)', 'var(--em-text-inverse)')}>
    46	                      Claim
    47	                    </button>
    48	                  )}
    49	                  {isMine && (
    50	                    <button type="button" onClick={() => unclaim(slot.id)} className="sf-press"
    51	                      style={btnStyle('var(--em-bg-card)', 'var(--em-text-secondary)', true)}>
    52	                      Release
    53	                    </button>
    54	                  )}
    55	                </div>
    56	              );
    57	            })}
    58	          </div>
    59	        </div>
    60	      ))}
    61	    </div>
    62	  );
    63	}
    64	
    65	function Empty({ text }) {
    66	  return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 14 }}>{text}</div>;
    67	}
    68	
    69	const btnStyle = (bg, color, bordered) => ({
    70	  minHeight: 44, padding: '0 14px', borderRadius: 8,
    71	  backgroundColor: bg, color,
    72	  border: bordered ? '1px solid var(--em-border-default)' : 'none',
    73	  fontSize: 13, fontWeight: 600,
    74	});
```

## src/components/event/EventLocationTab.jsx (87 lines)
```
     1	import { useState, useEffect } from 'react';
     2	import { supabase } from '../../lib/supabase';
     3	import { Navigation } from 'lucide-react';
     4	
     5	export default function EventLocationTab({ event }) {
     6	  const [locationData, setLocationData] = useState(null);
     7	
     8	  useEffect(() => {
     9	    if (!event.location) return;
    10	    const searchName = event.location.replace(/[\u2018\u2019\u2032]/g, "'").split(' - ')[0].split('(')[0].trim();
    11	    if (!searchName) return;
    12	    supabase.from('locations').select('name, address, city, state, lat, lon')
    13	      .ilike('name', `%${searchName}%`)
    14	      .limit(1)
    15	      .then(({ data }) => {
    16	        if (data && data[0]) setLocationData(data[0]);
    17	      });
    18	  }, [event.location]);
    19	
    20	  return (
    21	    <div style={{
    22	      margin: '0 16px',
    23	      padding: 16,
    24	      backgroundColor: 'var(--em-bg-card)',
    25	      border: '1px solid var(--em-border-default)',
    26	      borderRadius: 10,
    27	      boxShadow: 'var(--em-shadow-sm)',
    28	    }}>
    29	      {event.location ? (
    30	        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
    31	          {event.location}
    32	        </div>
    33	      ) : (
    34	        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', fontStyle: 'italic' }}>
    35	          Location TBD
    36	        </div>
    37	      )}
    38	      {(event.location_address || locationData?.address) && (
    39	        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 4 }}>
    40	          {event.location_address || `${locationData.address}, ${locationData.city}, ${locationData.state}`}
    41	        </div>
    42	      )}
    43	      {event.sub_location && (
    44	        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
    45	          {event.sub_location}
    46	        </div>
    47	      )}
    48	      {locationData?.lat && locationData?.lon && (
    49	        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
    50	          <a href={`https://maps.apple.com/?daddr=${locationData.lat},${locationData.lon}`}
    51	            className="sf-press"
    52	            style={{
    53	              flex: 1, minHeight: 44, borderRadius: 10,
    54	              border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
    55	              color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500,
    56	              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
    57	            }}>
    58	            <Navigation size={14} strokeWidth={1.75} />
    59	            Apple
    60	          </a>
    61	          <a href={`https://www.google.com/maps/dir/?api=1&destination=${locationData.lat},${locationData.lon}`}
    62	            className="sf-press"
    63	            style={{
    64	              flex: 1, minHeight: 44, borderRadius: 10,
    65	              border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
    66	              color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500,
    67	              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
    68	            }}>
    69	            <Navigation size={14} strokeWidth={1.75} />
    70	            Google
    71	          </a>
    72	          <a href={`https://waze.com/ul?ll=${locationData.lat},${locationData.lon}&navigate=yes`}
    73	            className="sf-press"
    74	            style={{
    75	              flex: 1, minHeight: 44, borderRadius: 10,
    76	              border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
    77	              color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500,
    78	              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
    79	            }}>
    80	            <Navigation size={14} strokeWidth={1.75} />
    81	            Waze
    82	          </a>
    83	        </div>
    84	      )}
    85	    </div>
    86	  );
    87	}
```

## src/components/event/EventNotes.jsx (18 lines)
```
     1	export default function EventNotes({ notes, coachNotes }) {
     2	  return (
     3	    <div style={{ padding: '0 16px' }}>
     4	      {notes && (
     5	        <div style={{ fontSize: 14, color: 'var(--em-text-secondary)', marginBottom: 12 }}>
     6	          <div style={{ fontWeight: 500, color: 'var(--em-text-primary)', marginBottom: 4, fontSize: 13 }}>Parent instructions</div>
     7	          {notes}
     8	        </div>
     9	      )}
    10	      {coachNotes && (
    11	        <div style={{ fontSize: 14, color: 'var(--em-text-secondary)' }}>
    12	          <div style={{ fontWeight: 500, color: 'var(--em-warning)', marginBottom: 4, fontSize: 13 }}>Coach notes (not visible to parents)</div>
    13	          {coachNotes}
    14	        </div>
    15	      )}
    16	    </div>
    17	  );
    18	}
```

## src/components/event/EventRidesTab.jsx (99 lines)
```
     1	import { useEffect, useState } from 'react';
     2	import { Car, UserRound, Plus } from 'lucide-react';
     3	import { supabase } from '../../lib/supabase';
     4	import { useRides } from '../../hooks/useRides';
     5	import { useAuth } from '../../context/AuthContext';
     6	import { useToast } from '../../context/ToastContext';
     7	import RideCard from './RideCard';
     8	import RideFormOverlay from './RideFormOverlay';
     9	
    10	const defaultPickupTime = (startAt) => {
    11	  if (!startAt) return '';
    12	  const d = new Date(startAt);
    13	  d.setMinutes(d.getMinutes() - 45);
    14	  return d.toTimeString().slice(0, 5);
    15	};
    16	
    17	export default function EventRidesTab({ eventId, eventStartAt, eventLocation, eventEndAt }) {
    18	  const { user, guardianId } = useAuth();
    19	  const { showToast } = useToast();
    20	  const { rides, loading, create, claim, remove } = useRides(eventId);
    21	  const [form, setForm] = useState(null);
    22	  const [draft, setDraft] = useState({ pickup_location: '', departure_time: '', seats: 1, phone: '', notes: '' });
    23	  const [guardian, setGuardian] = useState(null);
    24	
    25	  useEffect(() => {
    26	    if (!user?.id) return;
    27	    supabase.from('guardians').select('first_name, last_name, phone').eq('user_id', user.id).maybeSingle()
    28	      .then(({ data }) => setGuardian(data || null));
    29	  }, [user?.id]);
    30	
    31	  if (loading) return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 14 }}>Loading rides...</div>;
    32	
    33	  const offers = rides.filter((r) => r.ride_type === 'offering');
    34	  const requests = rides.filter((r) => r.ride_type === 'requesting');
    35	  const authorName = guardian ? `${guardian.first_name || ''} ${guardian.last_name || ''}`.trim() || null : null;
    36	
    37	  const openForm = (kind) => {
    38	    setDraft({ pickup_location: '', departure_time: defaultPickupTime(eventStartAt), seats: 1, phone: guardian?.phone || '', notes: '' });
    39	    setForm(kind);
    40	  };
    41	
    42	  const submit = async () => {
    43	    const ok = await create({ ride_type: form, ...draft, authorName, event_date: eventStartAt?.slice(0, 10) });
    44	    if (ok) { setForm(null); setDraft({ pickup_location: '', departure_time: '', seats: 1, phone: '', notes: '' }); }
    45	    else showToast('Could not save ride', 'error');
    46	  };
    47	
    48	  const handleClaim = async (offer) => {
    49	    const ok = await claim(offer, authorName, guardian?.phone || null);
    50	    if (ok) showToast('You claimed a seat', 'success');
    51	  };
    52	
    53	  return (
    54	    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
    55	      <RideSection title="Drivers offering rides" icon={Car} empty="No drivers yet.">
    56	        {offers.map((r) => <RideCard key={r.id} ride={r} user={user} currentGuardianId={guardianId} onRemove={remove} onClaim={handleClaim} eventLocation={eventLocation} eventEndAt={eventEndAt} />)}
    57	      </RideSection>
    58	      <RideSection title="Riders needing a ride" icon={UserRound} empty="No requests yet.">
    59	        {requests.map((r) => <RideCard key={r.id} ride={r} user={user} currentGuardianId={guardianId} onRemove={remove} eventLocation={eventLocation} eventEndAt={eventEndAt} />)}
    60	      </RideSection>
    61	
    62	      <div style={{ display: 'flex', gap: 8 }}>
    63	        <button type="button" onClick={() => openForm('offering')} className="sf-press"
    64	          style={ghostBtn}><Plus size={16} strokeWidth={1.75} /> Offer ride</button>
    65	        <button type="button" onClick={() => openForm('requesting')} className="sf-press"
    66	          style={ghostBtn}><Plus size={16} strokeWidth={1.75} /> Request ride</button>
    67	      </div>
    68	
    69	      {form && (
    70	        <RideFormOverlay
    71	          form={form}
    72	          draft={draft}
    73	          setDraft={setDraft}
    74	          onClose={() => setForm(null)}
    75	          onSubmit={submit}
    76	          eventLocation={eventLocation}
    77	          eventEndAt={eventEndAt}
    78	          phoneKnown={!!guardian?.phone}
    79	        />
    80	      )}
    81	    </div>
    82	  );
    83	}
    84	
    85	function RideSection({ title, icon: Icon, empty, children }) {
    86	  const arr = Array.isArray(children) ? children : [children];
    87	  return (
    88	    <div>
    89	      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', marginBottom: 8 }}>
    90	        <Icon size={14} strokeWidth={1.75} /> {title}
    91	      </div>
    92	      {arr.filter(Boolean).length === 0
    93	        ? <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{empty}</div>
    94	        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>}
    95	    </div>
    96	  );
    97	}
    98	
    99	const ghostBtn = { flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
```

## src/components/event/EventRsvpTab.jsx (55 lines)
```
     1	import RsvpSummary from '../rsvp/RsvpSummary';
     2	import RsvpPlayerRow from '../rsvp/RsvpPlayerRow';
     3	
     4	// RSVP tab — summary bar + one row per roster player with 3-button
     5	// going/maybe/not-going selector. Thin wrapper around the existing
     6	// RSVP components; kept as a tab so the page-level state can own
     7	// the useRsvps hook and pass in the resulting data.
     8	export default function EventRsvpTab({ roster, rsvps, rsvpMap, teamColor, onSetRsvp, onSaveNote, loading }) {
     9	  if (loading) {
    10	    return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 14 }}>Loading roster...</div>;
    11	  }
    12	  if (roster.length === 0) {
    13	    return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 14 }}>No players on this team yet.</div>;
    14	  }
    15	
    16	  const statusOrder = { going: 0, maybe: 1, not_going: 2 };
    17	  const sorted = [...roster].sort((a, b) => {
    18	    const aStatus = rsvpMap[a.id] || 'none';
    19	    const bStatus = rsvpMap[b.id] || 'none';
    20	    const aOrder = statusOrder[aStatus] ?? 3;
    21	    const bOrder = statusOrder[bStatus] ?? 3;
    22	    if (aOrder !== bOrder) return aOrder - bOrder;
    23	    return a.last_name.localeCompare(b.last_name);
    24	  });
    25	
    26	  const headerLabels = { going: 'Going', maybe: 'Maybe', not_going: 'Not Going', none: 'No Response' };
    27	
    28	  return (
    29	    <div style={{ padding: '16px 16px 32px' }}>
    30	      <RsvpSummary roster={roster} rsvps={rsvps} />
    31	      {sorted.map((player, i) => {
    32	        const status = rsvpMap[player.id] || 'none';
    33	        const prevStatus = i > 0 ? (rsvpMap[sorted[i - 1].id] || 'none') : null;
    34	        const showHeader = i === 0 || status !== prevStatus;
    35	        return (
    36	          <div key={player.id}>
    37	            {showHeader && (
    38	              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: i > 0 ? 12 : 0, marginBottom: 4 }}>
    39	                {headerLabels[status]}
    40	              </div>
    41	            )}
    42	            <RsvpPlayerRow
    43	              player={player}
    44	              response={rsvpMap[player.id] || null}
    45	              existingNote={rsvps.find((r) => r.player_id === player.id)?.comment || ''}
    46	              teamColor={teamColor}
    47	              onSetRsvp={onSetRsvp}
    48	              onSaveNote={onSaveNote}
    49	            />
    50	          </div>
    51	        );
    52	      })}
    53	    </div>
    54	  );
    55	}
```

## src/components/event/RideCard.jsx (59 lines)
```
     1	import { ExternalLink } from 'lucide-react';
     2	import { useAuth } from '../../context/AuthContext';
     3	
     4	export default function RideCard({ ride, user, onRemove, onClaim, eventLocation, eventEndAt }) {
     5	  const { guardianId } = useAuth();
     6	  const viewerGuardianId = guardianId;
     7	  const authorName = user?.user_metadata?.full_name || user?.email;
     8	  const isAuthor = ride.guardian_id
     9	    ? ride.guardian_id === viewerGuardianId
    10	    : ride.name === authorName;
    11	  const canRemove = isAuthor;
    12	  const showClaim = onClaim && ride.ride_type === 'offering' && !isAuthor;
    13	  const mapsUrl = ride.pickup_location ? `https://maps.google.com/maps?q=${encodeURIComponent(ride.pickup_location)}` : null;
    14	
    15	  return (
    16	    <div style={{ backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
    17	      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>
    18	        {ride.name} {ride.ride_type === 'offering' ? `is offering ${ride.seats} seat${ride.seats > 1 ? 's' : ''}` : `needs a ride for ${ride.seats}`}
    19	      </div>
    20	      {ride.phone && (
    21	        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
    22	          <a href={`tel:${ride.phone}`} className="sf-press" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 36, borderRadius: 8, border: '1px solid var(--em-border-default)', fontSize: 13, color: 'var(--em-text-primary)', textDecoration: 'none' }}>
    23	            Call
    24	          </a>
    25	          <a href={`sms:${ride.phone}`} className="sf-press" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 36, borderRadius: 8, border: '1px solid var(--em-border-default)', fontSize: 13, color: 'var(--em-text-primary)', textDecoration: 'none' }}>
    26	            Text
    27	          </a>
    28	        </div>
    29	      )}
    30	      <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
    31	        {ride.pickup_location && (
    32	          <div>
    33	            Pickup:{' '}
    34	            <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--em-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
    35	              {ride.pickup_location}
    36	              <ExternalLink size={12} strokeWidth={1.75} />
    37	            </a>
    38	            {ride.departure_time ? `, ${new Date(ride.departure_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
    39	          </div>
    40	        )}
    41	        {eventLocation && <div>Drop-off: {eventLocation}</div>}
    42	        {eventEndAt && <div>Est. return: {new Date(new Date(eventEndAt).getTime() + 15 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>}
    43	        {ride.notes && <div style={{ fontStyle: 'italic', color: 'var(--em-text-tertiary)' }}>&ldquo;{ride.notes}&rdquo;</div>}
    44	      </div>
    45	      {showClaim && (
    46	        <button type="button" onClick={() => onClaim(ride)} className="sf-press"
    47	          style={{ marginTop: 8, fontSize: 13, color: 'var(--em-accent)', minHeight: 36, padding: '0 10px', backgroundColor: 'var(--em-accent-soft)', border: '1px solid var(--em-accent)', borderRadius: 8, fontWeight: 500 }}>
    48	          Claim seat
    49	        </button>
    50	      )}
    51	      {canRemove && (
    52	        <button type="button" onClick={() => onRemove(ride.id)} className="sf-press"
    53	          style={{ marginTop: 8, fontSize: 13, color: 'var(--em-danger)', minHeight: 36, padding: '0 8px', background: 'none', border: 'none' }}>
    54	          Remove
    55	        </button>
    56	      )}
    57	    </div>
    58	  );
    59	}
```

## src/components/event/RideFormOverlay.jsx (75 lines)
```
     1	import { createPortal } from 'react-dom';
     2	import { ArrowLeft } from 'lucide-react';
     3	
     4	const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 2, display: 'block' };
     5	const inputStyle = { minHeight: 40, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', padding: '0 10px', fontSize: 14, color: 'var(--em-text-primary)' };
     6	
     7	export default function RideFormOverlay({ form, draft, setDraft, onClose, onSubmit, eventLocation, eventEndAt, phoneKnown }) {
     8	  const estReturn = eventEndAt
     9	    ? new Date(new Date(eventEndAt).getTime() + 15 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    10	    : 'TBD';
    11	
    12	  return createPortal(
    13	    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--em-bg-page)', zIndex: 9999, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
    14	      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' }}>
    15	        <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} className="sf-press" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    16	          <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-primary)" />
    17	        </button>
    18	        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--em-text-primary)' }}>
    19	          {form === 'offering' ? 'Offer a ride' : 'Request a ride'}
    20	        </h2>
    21	      </div>
    22	      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    23	        {!phoneKnown && (
    24	          <div>
    25	            <label style={labelStyle}>Phone (required)</label>
    26	            <input type="tel" placeholder="(914) 555-1234" value={draft.phone} required
    27	              onChange={(e) => setDraft({ ...draft, phone: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
    28	          </div>
    29	        )}
    30	        <div>
    31	          <label style={labelStyle}>Pickup address</label>
    32	          <input type="text" placeholder="4 Byram Brook Place, Armonk" value={draft.pickup_location}
    33	            onChange={(e) => setDraft({ ...draft, pickup_location: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
    34	        </div>
    35	        <div>
    36	          <label style={labelStyle}>Departure time</label>
    37	          <input type="time" value={draft.departure_time}
    38	            onChange={(e) => setDraft({ ...draft, departure_time: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
    39	        </div>
    40	        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>
    41	          Drop-off: {eventLocation || 'TBD'} · Est. return: {estReturn}
    42	        </div>
    43	        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    44	          <span style={{ fontSize: 14, color: 'var(--em-text-secondary)' }}>
    45	            {form === 'offering' ? 'Seats available' : 'Riders'}
    46	          </span>
    47	          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    48	            <button type="button" onClick={() => setDraft({ ...draft, seats: Math.max(1, draft.seats - 1) })}
    49	              disabled={draft.seats <= 1}
    50	              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 16 }}>
    51	              -
    52	            </button>
    53	            <span style={{ minWidth: 24, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>{draft.seats}</span>
    54	            <button type="button" onClick={() => setDraft({ ...draft, seats: Math.min(8, draft.seats + 1) })}
    55	              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 16 }}>
    56	              +
    57	            </button>
    58	          </div>
    59	        </div>
    60	        <div>
    61	          <label style={labelStyle}>Notes</label>
    62	          <input type="text" placeholder="Will text when leaving and when we arrive" value={draft.notes || ''}
    63	            onChange={(e) => setDraft({ ...draft, notes: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
    64	        </div>
    65	      </div>
    66	      <div style={{ padding: 16, borderTop: '1px solid var(--em-border-default)' }}>
    67	        <button type="button" onClick={onSubmit} className="sf-press"
    68	          style={{ width: '100%', minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 16, fontWeight: 600 }}>
    69	          {form === 'offering' ? 'Offer ride' : 'Request ride'}
    70	        </button>
    71	      </div>
    72	    </div>,
    73	    document.body,
    74	  );
    75	}
```

## src/components/layout/AppShell.jsx (49 lines)
```
     1	import Header from './Header';
     2	import BottomNav from './BottomNav';
     3	import { useOnlineStatus } from '../../hooks/useOnlineStatus';
     4	
     5	// App shell for every authenticated page. The root is pinned to the
     6	// dynamic viewport height (100dvh, with 100vh fallback) and clips
     7	// overflow so the body can never become the scroll container. Header
     8	// and BottomNav are position:fixed (out of flow), so <main> is the
     9	// sole flex child and the sole scroll container — pages scroll inside
    10	// it while the header/nav stay locked to the viewport.
    11	export default function AppShell({ children }) {
    12	  const online = useOnlineStatus();
    13	  return (
    14	    <div
    15	      className="sf-app-shell flex flex-col"
    16	      style={{ backgroundColor: 'var(--em-bg-page)' }}
    17	    >
    18	      <Header />
    19	      {!online && (
    20	        <div style={{
    21	          backgroundColor: 'var(--em-danger)',
    22	          color: 'var(--em-text-inverse)',
    23	          textAlign: 'center',
    24	          padding: '6px 16px',
    25	          fontSize: 13,
    26	          fontWeight: 500,
    27	          flexShrink: 0,
    28	        }}>
    29	          You're offline — some features may not work
    30	        </div>
    31	      )}
    32	      {/* overscroll-behavior: contain kills pull-to-refresh / rubber-band
    33	          bounce inside main. Padding top/bottom clear the fixed Header
    34	          and BottomNav (both of which include their safe-area insets). */}
    35	      <main
    36	        className="flex-1 overflow-x-hidden overflow-y-auto"
    37	        style={{
    38	          paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))',
    39	          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
    40	          overscrollBehavior: 'contain',
    41	          WebkitOverflowScrolling: 'touch',
    42	        }}
    43	      >
    44	        {children}
    45	      </main>
    46	      <BottomNav />
    47	    </div>
    48	  );
    49	}
```

## src/components/layout/BottomNav.jsx (77 lines)
```
     1	import { NavLink } from 'react-router-dom';
     2	import { House, Calendar, Trophy, Users, MessageSquare } from 'lucide-react';
     3	import { useAuth } from '../../context/AuthContext';
     4	import { isStaff } from '../../lib/permissions';
     5	
     6	// Admin/Coach see the Score tab; parents don't. Defining the full tab set in
     7	// one array keeps the active-state styling and a11y labels consistent across
     8	// both role variants.
     9	const ALL_TABS = [
    10	  { to: '/',         label: 'Home',     icon: House,         staffOnly: false },
    11	  { to: '/schedule', label: 'Schedule', icon: Calendar,      staffOnly: false },
    12	  { to: '/score',    label: 'Score',    icon: Trophy,        staffOnly: true  },
    13	  { to: '/teams',    label: 'Teams',    icon: Users,         staffOnly: false },
    14	  { to: '/messages', label: 'Messages', icon: MessageSquare, staffOnly: false },
    15	];
    16	
    17	export default function BottomNav() {
    18	  const { role } = useAuth();
    19	  const tabs = ALL_TABS.filter((t) => !t.staffOnly || isStaff(role));
    20	
    21	  return (
    22	    <nav
    23	      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
    24	      style={{
    25	        backgroundColor: 'var(--em-bg-card)',
    26	        borderTop: '1px solid var(--em-border-default)',
    27	        paddingBottom: 'env(safe-area-inset-bottom)',
    28	      }}
    29	      aria-label="Primary"
    30	    >
    31	      {tabs.map((tab) => (
    32	        <NavItem key={tab.to} {...tab} />
    33	      ))}
    34	    </nav>
    35	  );
    36	}
    37	
    38	function NavItem(tab) {
    39	  // Destructuring `icon: Icon` defeats the eslint varsIgnorePattern because
    40	  // the parser checks the original key, not the alias — so we grab the
    41	  // component via property access instead and alias locally.
    42	  const Icon = tab.icon;
    43	  return (
    44	    <NavLink
    45	      to={tab.to}
    46	      end={tab.to === '/'}
    47	      onClick={() => navigator.vibrate?.(10)}
    48	      className="flex-1 sf-press"
    49	      style={({ isActive }) => ({
    50	        minHeight: 44,
    51	        color: isActive ? 'var(--em-accent)' : 'var(--em-text-tertiary)',
    52	      })}
    53	      aria-label={tab.label}
    54	    >
    55	      {({ isActive }) => (
    56	        <div className="flex flex-col items-center justify-center" style={{ gap: 2, paddingTop: 6, paddingBottom: 2 }}>
    57	          <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
    58	          <span style={{
    59	            fontSize: 10,
    60	            fontWeight: isActive ? 600 : 400,
    61	            letterSpacing: '0.02em',
    62	            color: isActive ? 'var(--em-accent)' : 'var(--em-text-tertiary)',
    63	          }}>{tab.label}</span>
    64	          {isActive && (
    65	            <div style={{
    66	              width: 4,
    67	              height: 4,
    68	              borderRadius: '50%',
    69	              backgroundColor: 'var(--em-accent)',
    70	              marginTop: -1,
    71	            }} />
    72	          )}
    73	        </div>
    74	      )}
    75	    </NavLink>
    76	  );
    77	}
```

## src/components/layout/Header.jsx (94 lines)
```
     1	import { Bell, Settings } from 'lucide-react';
     2	import { useNavigate } from 'react-router-dom';
     3	import { useAuth } from '../../context/AuthContext';
     4	
     5	// Top app bar: org initial + name on the left, notification bell on the right.
     6	// Org logo is a future enhancement — for now we always render the initial
     7	// circle because no org stores a logo URL yet.
     8	export default function Header() {
     9	  const { org, orgName } = useAuth();
    10	  const navigate = useNavigate();
    11	  const initial = (orgName || 'S').trim().charAt(0).toUpperCase();
    12	  // Future: read unread count from a notifications query. Hardcoded to 0 for
    13	  // now so the dot stays hidden until that feature lands.
    14	  const unread = 0;
    15	
    16	  // Total rendered height = 56px of content + env(safe-area-inset-top).
    17	  // On a notched iPhone, the inset pushes the content row below the notch
    18	  // while the blue background extends behind it; on devices with no inset
    19	  // the header collapses to exactly 56px. `flex-shrink: 0` + explicit
    20	  // min/max height keep the row from ever growing past its content area
    21	  // if a future parent uses flex-grow or similar.
    22	  return (
    23	    <header
    24	      className="fixed top-0 left-0 right-0 z-50 flex items-center px-4"
    25	      style={{
    26	        height: 'calc(56px + env(safe-area-inset-top, 0px))',
    27	        minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
    28	        maxHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
    29	        paddingTop: 'env(safe-area-inset-top, 0px)',
    30	        flexShrink: 0,
    31	        background: 'linear-gradient(180deg, var(--em-header) 0%, color-mix(in srgb, var(--em-header) 85%, black) 100%)',
    32	        color: 'var(--em-text-on-dark)',
    33	        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    34	      }}
    35	    >
    36	      <div className="flex items-center gap-3 flex-1 min-w-0">
    37	        <img
    38	          src={org?.logo_url || '/skyfire_phoenix.webp'}
    39	          onError={(e) => { if (e.currentTarget.src.endsWith('/skyfire_phoenix.webp')) return; e.currentTarget.src = '/skyfire_phoenix.webp'; }}
    40	          alt=""
    41	          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
    42	        />
    43	        <div
    44	          className="truncate font-semibold"
    45	          style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}
    46	          title={orgName || ''}
    47	        >
    48	          {org ? orgName : 'Skyfire'}
    49	        </div>
    50	      </div>
    51	      <button
    52	        type="button"
    53	        className="relative flex items-center justify-center sf-press"
    54	        style={{ width: 44, height: 44, color: 'var(--em-text-on-dark)' }}
    55	        aria-label="Notifications"
    56	      >
    57	        <div className="sf-bell-shake" style={{
    58	          width: 40,
    59	          height: 40,
    60	          borderRadius: '50%',
    61	          display: 'flex',
    62	          alignItems: 'center',
    63	          justifyContent: 'center',
    64	          backgroundColor: 'rgba(255,255,255,0.1)',
    65	        }}>
    66	          <Bell size={22} strokeWidth={1.75} />
    67	        </div>
    68	        {unread > 0 && (
    69	          <span
    70	            className="absolute"
    71	            style={{
    72	              top: 10,
    73	              right: 10,
    74	              width: 8,
    75	              height: 8,
    76	              borderRadius: '50%',
    77	              backgroundColor: 'var(--em-danger)',
    78	            }}
    79	            aria-label={`${unread} unread notifications`}
    80	          />
    81	        )}
    82	      </button>
    83	      <button
    84	        type="button"
    85	        onClick={() => navigate('/account')}
    86	        className="sf-press flex items-center justify-center"
    87	        style={{ width: 44, height: 44, color: 'var(--em-text-on-dark)', background: 'none', border: 'none' }}
    88	        aria-label="Account"
    89	      >
    90	        <Settings size={20} strokeWidth={1.75} />
    91	      </button>
    92	    </header>
    93	  );
    94	}
```

## src/components/layout/RequireAuth.jsx (29 lines)
```
     1	import { Navigate, useLocation } from 'react-router-dom';
     2	import { useAuth } from '../../context/AuthContext';
     3	import LoadingSkeleton from '../shared/LoadingSkeleton';
     4	
     5	// Route guard. Blocks children until auth state resolves, then either
     6	// redirects to /login, /unauthorized, or renders.
     7	// `allowedRoles` is optional — when omitted, any authenticated user passes.
     8	export default function RequireAuth({ children, allowedRoles }) {
     9	  const { user, role, loading } = useAuth();
    10	  const location = useLocation();
    11	
    12	  if (loading) {
    13	    return (
    14	      <div className="p-4">
    15	        <LoadingSkeleton variant="card" count={3} />
    16	      </div>
    17	    );
    18	  }
    19	
    20	  if (!user) {
    21	    return <Navigate to="/login" state={{ from: location }} replace />;
    22	  }
    23	
    24	  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    25	    return <Navigate to="/unauthorized" replace />;
    26	  }
    27	
    28	  return children;
    29	}
```

## src/components/roster/CopyRosterButton.jsx (51 lines)
```
     1	import { useToast } from '../../context/ToastContext';
     2	
     3	// Small "Copy" pill next to the ROSTER section header. Serializes the
     4	// team name + sorted player list to plain text and writes it to the
     5	// clipboard for quick pasting into a group text or email.
     6	//
     7	// ordinalGrade is duplicated from PlayerRow — will consolidate into
     8	// lib/formatters.js in a future cleanup pass.
     9	function ordinalGrade(g) {
    10	  if (!g) return '';
    11	  if (g === 1) return '1st';
    12	  if (g === 2) return '2nd';
    13	  if (g === 3) return '3rd';
    14	  return `${g}th`;
    15	}
    16	
    17	export default function CopyRosterButton({ team, sortedPlayers }) {
    18	  const { showToast } = useToast();
    19	  const onCopy = async () => {
    20	    const text = sortedPlayers.map((p) =>
    21	      `#${p.jersey_number || '-'} ${p.first_name} ${p.last_name} (${ordinalGrade(p.grade)})`
    22	    ).join('\n');
    23	    navigator.vibrate?.(10);
    24	    try {
    25	      await navigator.clipboard.writeText(`${team.name} Roster\n\n${text}`);
    26	      showToast('Roster copied');
    27	    } catch {
    28	      showToast('Copy failed', 'error');
    29	    }
    30	  };
    31	
    32	  return (
    33	    <button
    34	      type="button"
    35	      onClick={onCopy}
    36	      className="sf-press flex items-center gap-1"
    37	      style={{
    38	        minHeight: 44, padding: '0 14px', borderRadius: 8,
    39	        border: '1px solid var(--em-border-default)',
    40	        backgroundColor: 'var(--em-bg-card)',
    41	        color: 'var(--em-text-secondary)',
    42	        fontSize: 12, fontWeight: 500,
    43	      }}
    44	    >
    45	      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    46	        <rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    47	      </svg>
    48	      Copy
    49	    </button>
    50	  );
    51	}
```

## src/components/roster/InviteButton.jsx (58 lines)
```
     1	import { useState } from 'react';
     2	import { supabase } from '../../lib/supabase';
     3	
     4	// Small pill button that triggers the invite-parent Edge Function. Admin-only
     5	// placement is the caller's responsibility — this component just handles the
     6	// request lifecycle and in-place status swap.
     7	export default function InviteButton({ guardianEmail }) {
     8	  const [status, setStatus] = useState('idle');
     9	  const [error, setError] = useState(null);
    10	
    11	  const invite = async () => {
    12	    setStatus('loading'); setError(null);
    13	    try {
    14	      const { data: { session } } = await supabase.auth.getSession();
    15	      if (!session) throw new Error('Not signed in');
    16	      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-parent`;
    17	      console.log('Invite URL:', url, 'email:', guardianEmail);
    18	      const res = await fetch(url, {
    19	        method: 'POST',
    20	        headers: {
    21	          'Content-Type': 'application/json',
    22	          'Authorization': `Bearer ${session.access_token}`,
    23	          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    24	        },
    25	        body: JSON.stringify({ email: guardianEmail }),
    26	      });
    27	      const text = await res.text();
    28	      console.error('Invite response:', res.status, text);
    29	      if (!res.ok) {
    30	        let body = {}; try { body = JSON.parse(text); } catch { /* not json */ }
    31	        throw new Error(body.error || text?.slice(0, 80) || `HTTP ${res.status}`);
    32	      }
    33	      setStatus('sent');
    34	    } catch (e) {
    35	      setError(e.message || 'Error'); setStatus('error');
    36	    }
    37	  };
    38	
    39	  const pill = { minHeight: 32, padding: '0 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, backgroundColor: 'transparent' };
    40	
    41	  if (status === 'sent') {
    42	    return <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--em-success)' }}>Invited ✓</span>;
    43	  }
    44	  if (status === 'error') {
    45	    return (
    46	      <button type="button" onClick={invite} className="sf-press" title={error}
    47	        style={{ ...pill, border: '1.5px solid var(--em-danger)', color: 'var(--em-danger)', maxWidth: '100%', whiteSpace: 'normal', textAlign: 'left', padding: '6px 10px', borderRadius: 8 }}>
    48	        {error || 'Error — tap to retry'}
    49	      </button>
    50	    );
    51	  }
    52	  return (
    53	    <button type="button" onClick={invite} disabled={status === 'loading'} className="sf-press"
    54	      style={{ ...pill, border: '1.5px solid var(--em-accent)', color: 'var(--em-accent)', opacity: status === 'loading' ? 0.6 : 1 }}>
    55	      {status === 'loading' ? 'Sending…' : 'Invite'}
    56	    </button>
    57	  );
    58	}
```

## src/components/roster/MessageTeamFAB.jsx (31 lines)
```
     1	// Floating action button pinned to the bottom-right of the team
     2	// detail page. Position is fixed so it doesn't scroll with content;
     3	// z-index 40 sits below BottomNav (z-50) and above in-page content.
     4	export default function MessageTeamFAB() {
     5	  return (
     6	    <div style={{
     7	      position: 'fixed',
     8	      bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)',
     9	      right: 16,
    10	      zIndex: 40,
    11	    }}>
    12	      <button
    13	        type="button"
    14	        onClick={() => { navigator.vibrate?.(10); /* TODO: navigate to compose with team pre-selected */ }}
    15	        className="sf-press sf-bounce-tap"
    16	        style={{
    17	          width: 56, height: 56, borderRadius: '50%',
    18	          backgroundColor: 'var(--em-accent)',
    19	          boxShadow: 'var(--em-shadow-lg)',
    20	          display: 'flex', alignItems: 'center', justifyContent: 'center',
    21	          border: 'none',
    22	        }}
    23	        aria-label="Message team"
    24	      >
    25	        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--em-text-inverse)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    26	          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    27	        </svg>
    28	      </button>
    29	    </div>
    30	  );
    31	}
```

## src/components/roster/PlayerRow.jsx (99 lines)
```
     1	import { useState } from 'react';
     2	import { Phone, MessageSquare, Mail, ChevronDown } from 'lucide-react';
     3	import { useAuth } from '../../context/AuthContext';
     4	import InviteButton from './InviteButton';
     5	
     6	export default function PlayerRow({ player, teamColor, isLast }) {
     7	  const [expanded, setExpanded] = useState(false);
     8	  const { role } = useAuth();
     9	  const initial = (player.last_name || player.first_name || '?').charAt(0).toUpperCase();
    10	  const isAcademy = player.member_type === 'futures_academy';
    11	  const guardians = player.guardians || [];
    12	
    13	  return (
    14	    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--em-border-subtle)' }}>
    15	      <div
    16	        className="flex items-center sf-press"
    17	        onClick={() => { navigator.vibrate?.(10); setExpanded((v) => !v); }}
    18	        onTouchStart={(e) => { e.currentTarget.style.backgroundColor = `${teamColor}08`; }}
    19	        onTouchEnd={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    20	        style={{ padding: '10px 16px', minHeight: 56, transition: 'background-color 150ms ease-out' }}
    21	      >
    22	        <div style={{
    23	          width: 40, height: 40, borderRadius: '50%', backgroundColor: teamColor || 'var(--em-neutral)',
    24	          display: 'flex', alignItems: 'center', justifyContent: 'center',
    25	          color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 700, flexShrink: 0,
    26	        }}>{initial}</div>
    27	        <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
    28	          <div className="flex items-center gap-2">
    29	            <div className="font-semibold truncate" style={{ color: 'var(--em-text-primary)', fontSize: 15 }}>
    30	              {player.first_name} {player.last_name}
    31	            </div>
    32	            <div style={{
    33	              width: 6, height: 6, borderRadius: '50%',
    34	              backgroundColor: player.payment_status === 'partial' ? 'var(--em-warning)'
    35	                : player.payment_status === 'overdue' ? 'var(--em-danger)' : 'var(--em-success)',
    36	              flexShrink: 0,
    37	            }} title={player.payment_status === 'partial' ? 'Partial payment' : player.payment_status === 'overdue' ? 'Payment overdue' : 'Paid'} />
    38	          </div>
    39	          <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
    40	            {isAcademy && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--em-academy-soft)', color: 'var(--em-academy)' }}>Academy</span>}
    41	            <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)' }}>{ordinalGrade(player.grade)}</span>
    42	          </div>
    43	          <div className="flex items-center gap-1" style={{ marginTop: 3 }}>
    44	            <div style={{ width: 40, height: 3, borderRadius: 999, backgroundColor: 'var(--em-bg-tertiary)', overflow: 'hidden' }}>
    45	              <div style={{ height: '100%', width: `${player.attendance_pct || 85}%`, backgroundColor: (player.attendance_pct || 85) >= 80 ? 'var(--em-success)' : 'var(--em-warning)', borderRadius: 999 }} />
    46	            </div>
    47	            <span style={{ fontSize: 10, color: 'var(--em-text-tertiary)' }}>{player.attendance_pct || 85}%</span>
    48	          </div>
    49	        </div>
    50	        {player.jersey_number != null && (
    51	          <div style={{
    52	            width: 32, height: 32, borderRadius: '50%', border: `2px solid ${teamColor || 'var(--em-neutral)'}`,
    53	            display: 'flex', alignItems: 'center', justifyContent: 'center',
    54	            fontSize: 13, fontWeight: 700, color: teamColor || 'var(--em-text-primary)', flexShrink: 0,
    55	          }}>{player.jersey_number}</div>
    56	        )}
    57	        <ChevronDown size={16} strokeWidth={1.75} color="var(--em-text-tertiary)"
    58	          style={{ marginLeft: 8, flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms' }} />
    59	      </div>
    60	      {expanded && (
    61	        <div style={{ padding: '4px 16px 12px 68px', display: 'flex', flexDirection: 'column', gap: 8 }}>
    62	          {guardians.length === 0
    63	            ? <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', fontStyle: 'italic' }}>No guardians linked</div>
    64	            : guardians.map((g) => <GuardianRow key={g.id} guardian={g} role={role} />)}
    65	        </div>
    66	      )}
    67	    </div>
    68	  );
    69	}
    70	
    71	function GuardianRow({ guardian, role }) {
    72	  const name = `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || 'Guardian';
    73	  const canInvite = role === 'admin' && guardian.email && !guardian.userId;
    74	  const linked = guardian.email && guardian.userId;
    75	  const iconBtn = { width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--em-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    76	  const spacer = <div style={{ width: 32, height: 32, flexShrink: 0 }} />;
    77	  const stop = (e) => e.stopPropagation();
    78	  return (
    79	    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 36 }}>
    80	      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    81	      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
    82	        {guardian.phone ? <a href={`tel:${guardian.phone}`} onClick={stop} aria-label="Call" style={iconBtn}><Phone size={14} strokeWidth={1.75} color="var(--em-text-secondary)" /></a> : spacer}
    83	        {guardian.phone ? <a href={`sms:${guardian.phone}`} onClick={stop} aria-label="Text" style={iconBtn}><MessageSquare size={14} strokeWidth={1.75} color="var(--em-text-secondary)" /></a> : spacer}
    84	        {guardian.email ? <a href={`mailto:${guardian.email}`} onClick={stop} aria-label="Email" style={iconBtn}><Mail size={14} strokeWidth={1.75} color="var(--em-text-secondary)" /></a> : spacer}
    85	        {canInvite ? <span onClick={stop}><InviteButton guardianEmail={guardian.email} /></span>
    86	          : linked ? <span style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--em-success)' }} title="Account linked">✓</span>
    87	          : spacer}
    88	      </div>
    89	    </div>
    90	  );
    91	}
    92	
    93	function ordinalGrade(g) {
    94	  if (!g) return '';
    95	  if (g === 1) return '1st';
    96	  if (g === 2) return '2nd';
    97	  if (g === 3) return '3rd';
    98	  return `${g}th`;
    99	}
```

## src/components/roster/RosterControls.jsx (59 lines)
```
     1	// Search input + jersey/name/grade sort toggle. Local UI only — state
     2	// lives in the parent (TeamDetailPage) so the filter/sort results stay
     3	// in sync with the player list there.
     4	export default function RosterControls({ search, setSearch, sortBy, setSortBy }) {
     5	  return (
     6	    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
     7	      <div style={{
     8	        flex: 1,
     9	        display: 'flex',
    10	        alignItems: 'center',
    11	        backgroundColor: 'var(--em-bg-secondary)',
    12	        borderRadius: 10,
    13	        padding: '0 12px',
    14	        minHeight: 40,
    15	      }}>
    16	        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--em-text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    17	          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    18	        </svg>
    19	        <input
    20	          type="text"
    21	          placeholder="Search players..."
    22	          value={search}
    23	          onChange={(e) => setSearch(e.target.value)}
    24	          style={{
    25	            flex: 1,
    26	            background: 'none',
    27	            border: 'none',
    28	            outline: 'none',
    29	            fontSize: 14,
    30	            color: 'var(--em-text-primary)',
    31	            marginLeft: 8,
    32	            minHeight: 40,
    33	          }}
    34	        />
    35	      </div>
    36	      <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--em-border-default)' }}>
    37	        {[
    38	          { key: 'jersey', label: '#' },
    39	          { key: 'name', label: 'A-Z' },
    40	          { key: 'grade', label: 'Gr' },
    41	        ].map((opt) => (
    42	          <button
    43	            key={opt.key}
    44	            type="button"
    45	            onClick={() => { setSortBy(opt.key); navigator.vibrate?.(10); }}
    46	            style={{
    47	              minWidth: 36, minHeight: 40, border: 'none',
    48	              backgroundColor: sortBy === opt.key ? 'var(--em-accent)' : 'var(--em-bg-card)',
    49	              color: sortBy === opt.key ? 'var(--em-text-inverse)' : 'var(--em-text-secondary)',
    50	              fontSize: 12, fontWeight: 600,
    51	            }}
    52	          >
    53	            {opt.label}
    54	          </button>
    55	        ))}
    56	      </div>
    57	    </div>
    58	  );
    59	}
```

## src/components/roster/TeamHeaderCard.jsx (60 lines)
```
     1	const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };
     2	
     3	// Team summary card at the top of TeamDetailPage: full-width color
     4	// stripe, team name, team-color age-group roundel, grey pill badges,
     5	// W-L placeholder, and a three-stat row (Players / Roster / Academy).
     6	// The component is presentational — it does not query anything; both
     7	// `team` and `players` come from the page.
     8	export default function TeamHeaderCard({ team, players }) {
     9	  const rosterCount = players.filter((p) => p.member_type === 'roster').length;
    10	  const academyCount = players.filter((p) => p.member_type === 'futures_academy').length;
    11	
    12	  return (
    13	    <div className="sf-fade-in" style={{
    14	      backgroundColor: 'var(--em-bg-card)',
    15	      borderRadius: 10,
    16	      border: '1px solid var(--em-border-default)',
    17	      boxShadow: 'var(--em-shadow-sm)',
    18	      overflow: 'hidden',
    19	      marginBottom: 16,
    20	    }}>
    21	      <div style={{ height: 6, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
    22	      <div style={{ padding: 16 }}>
    23	        <div className="flex items-center justify-between">
    24	          <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20, letterSpacing: '-0.025em' }}>
    25	            {team.name}
    26	          </h1>
    27	          <div style={{
    28	            width: 40, height: 40, borderRadius: '50%',
    29	            backgroundColor: team.team_color || 'var(--em-neutral)',
    30	            display: 'flex', alignItems: 'center', justifyContent: 'center',
    31	            color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 700,
    32	          }}>
    33	            {team.age_group}
    34	          </div>
    35	        </div>
    36	        <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
    37	          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)' }}>{team.age_group}</span>
    38	          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)' }}>{CIRCUIT_LABELS[team.circuit] || team.circuit}</span>
    39	          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-text-tertiary)' }}>0-0</span>
    40	        </div>
    41	        <div className="flex items-center gap-4" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--em-border-subtle)' }}>
    42	          <div style={{ textAlign: 'center' }}>
    43	            <div className="font-bold" style={{ fontSize: 20, color: 'var(--em-text-primary)' }}>{players.length}</div>
    44	            <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Players</div>
    45	          </div>
    46	          <div style={{ width: 1, height: 32, backgroundColor: 'var(--em-border-subtle)' }} />
    47	          <div style={{ textAlign: 'center' }}>
    48	            <div className="font-bold" style={{ fontSize: 20, color: 'var(--em-text-primary)' }}>{rosterCount}</div>
    49	            <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roster</div>
    50	          </div>
    51	          <div style={{ width: 1, height: 32, backgroundColor: 'var(--em-border-subtle)' }} />
    52	          <div style={{ textAlign: 'center' }}>
    53	            <div className="font-bold" style={{ fontSize: 20, color: 'var(--em-academy)' }}>{academyCount}</div>
    54	            <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academy</div>
    55	          </div>
    56	        </div>
    57	      </div>
    58	    </div>
    59	  );
    60	}
```

## src/components/roster/TeamSwitcher.jsx (31 lines)
```
     1	// Horizontal pill strip for quick team switching without going back
     2	// to the Teams list. Renders one pill per team in the active season,
     3	// styled with the team's color. Active team is filled; others outlined.
     4	export default function TeamSwitcher({ programs, teamId, navigate }) {
     5	  return (
     6	    <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ marginBottom: 12, paddingBottom: 4 }}>
     7	      {programs.map((p) => (
     8	        <button
     9	          key={p.id}
    10	          type="button"
    11	          onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${p.id}`); }}
    12	          className="sf-press"
    13	          style={{
    14	            flexShrink: 0,
    15	            minHeight: 32,
    16	            padding: '0 12px',
    17	            borderRadius: 999,
    18	            fontSize: 12,
    19	            fontWeight: p.id === teamId ? 600 : 400,
    20	            border: `2px solid ${p.team_color || 'var(--em-border-default)'}`,
    21	            backgroundColor: p.id === teamId ? (p.team_color || 'var(--em-accent)') : 'var(--em-bg-card)',
    22	            color: p.id === teamId ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
    23	            whiteSpace: 'nowrap',
    24	          }}
    25	        >
    26	          {p.name}
    27	        </button>
    28	      ))}
    29	    </div>
    30	  );
    31	}
```

## src/components/roster/UpcomingEvents.jsx (71 lines)
```
     1	// Placeholder upcoming events list shown under the team roster. The
     2	// three events are hardcoded until the activities query is wired up;
     3	// swap UPCOMING_SEED for a real query filtered by team_id.
     4	const UPCOMING_SEED = [
     5	  { type: 'Practice', date: 'Wed, Apr 16', time: '5:00 PM', location: 'WCC Gym' },
     6	  { type: 'Game', date: 'Sat, Apr 19', time: '9:00 AM', location: "St. Patrick's Gym", opponent: 'vs Storm AAU' },
     7	  { type: 'Practice', date: 'Wed, Apr 23', time: '5:00 PM', location: 'WCC Gym' },
     8	];
     9	
    10	export default function UpcomingEvents() {
    11	  return (
    12	    <div style={{ marginTop: 24 }}>
    13	      <div style={{
    14	        fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
    15	        textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 8,
    16	      }}>UPCOMING</div>
    17	      <div style={{
    18	        backgroundColor: 'var(--em-bg-card)',
    19	        borderRadius: 10,
    20	        border: '1px solid var(--em-border-default)',
    21	        boxShadow: 'var(--em-shadow-sm)',
    22	        overflow: 'hidden',
    23	      }}>
    24	        {UPCOMING_SEED.map((evt, i, arr) => (
    25	          <div
    26	            key={i}
    27	            className="sf-press"
    28	            onClick={() => navigator.vibrate?.(10)}
    29	            style={{
    30	              padding: '12px 16px',
    31	              borderBottom: i < arr.length - 1 ? '1px solid var(--em-border-subtle)' : 'none',
    32	              display: 'flex',
    33	              justifyContent: 'space-between',
    34	              alignItems: 'center',
    35	              minHeight: 52,
    36	            }}
    37	          >
    38	            <div>
    39	              <div className="font-semibold" style={{ fontSize: 14, color: 'var(--em-text-primary)' }}>
    40	                {evt.opponent || evt.type}
    41	              </div>
    42	              <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
    43	                {evt.date} · {evt.location}
    44	              </div>
    45	            </div>
    46	            <div className="font-semibold" style={{ fontSize: 14, color: 'var(--em-text-primary)' }}>
    47	              {evt.time}
    48	            </div>
    49	          </div>
    50	        ))}
    51	      </div>
    52	      <button
    53	        type="button"
    54	        onClick={() => { navigator.vibrate?.(10); /* TODO: navigate to /schedule filtered by team */ }}
    55	        className="w-full sf-press"
    56	        style={{
    57	          marginTop: 8,
    58	          minHeight: 44,
    59	          borderRadius: 10,
    60	          border: '1px solid var(--em-border-default)',
    61	          backgroundColor: 'var(--em-bg-card)',
    62	          color: 'var(--em-accent)',
    63	          fontSize: 14,
    64	          fontWeight: 500,
    65	        }}
    66	      >
    67	        View full schedule →
    68	      </button>
    69	    </div>
    70	  );
    71	}
```

## src/components/rsvp/RsvpPlayerRow.jsx (127 lines)
```
     1	import { useState } from 'react';
     2	import { Check, X, HelpCircle } from 'lucide-react';
     3	import { useAuth } from '../../context/AuthContext';
     4	
     5	const BUTTONS = [
     6	  { key: 'going', icon: Check, color: 'var(--em-success)', bg: 'var(--em-success-soft)', label: 'Going' },
     7	  { key: 'maybe', icon: HelpCircle, color: 'var(--em-warning)', bg: 'var(--em-warning-soft)', label: 'Maybe' },
     8	  { key: 'not_going', icon: X, color: 'var(--em-danger)', bg: 'var(--em-danger-soft)', label: 'Not going' },
     9	];
    10	
    11	const STATUS_LABELS = {
    12	  going:     { label: 'Going',     color: 'var(--em-success)' },
    13	  maybe:     { label: 'Maybe',     color: 'var(--em-warning)' },
    14	  not_going: { label: 'Not Going', color: 'var(--em-danger)' },
    15	};
    16	
    17	export default function RsvpPlayerRow({ player, response, existingNote, teamColor, onSetRsvp, onSaveNote }) {
    18	  const { role, myChildren } = useAuth();
    19	  const [showNote, setShowNote] = useState(false);
    20	  const [noteText, setNoteText] = useState(existingNote || '');
    21	  const isMyChild = (myChildren || []).some((c) => c.playerId === player.id);
    22	  const readOnly = role === 'parent' && !isMyChild;
    23	
    24	  return (
    25	    <div style={{
    26	      padding: '10px 0',
    27	      borderBottom: '1px solid var(--em-border-subtle)',
    28	    }}>
    29	      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    30	        {/* Jersey circle */}
    31	        <div style={{
    32	          width: 32, height: 32, borderRadius: 16,
    33	          backgroundColor: teamColor || 'var(--em-bg-tertiary)',
    34	          color: 'var(--em-text-inverse)', fontSize: 12, fontWeight: 600,
    35	          display: 'flex', alignItems: 'center', justifyContent: 'center',
    36	          flexShrink: 0,
    37	        }}>
    38	          {player.jersey_number || '—'}
    39	        </div>
    40	
    41	        {/* Name */}
    42	        <div style={{ flex: 1, minWidth: 0 }}>
    43	          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)' }}>
    44	            {player.first_name} {player.last_name}
    45	          </div>
    46	          {player.member_type === 'futures_academy' && (
    47	            <span style={{
    48	              fontSize: 11, color: 'var(--em-academy)', fontWeight: 500,
    49	              backgroundColor: 'var(--em-academy-soft)', padding: '1px 6px', borderRadius: 4,
    50	            }}>Academy</span>
    51	          )}
    52	        </div>
    53	
    54	        {/* RSVP buttons or read-only status */}
    55	        {readOnly ? (
    56	          <div style={{ fontSize: 13, fontWeight: 500, color: STATUS_LABELS[response]?.color || 'var(--em-text-tertiary)' }}>
    57	            {STATUS_LABELS[response]?.label || 'No response'}
    58	          </div>
    59	        ) : (
    60	          <div style={{ display: 'flex', gap: 6 }}>
    61	            {BUTTONS.map((b) => {
    62	              const Icon = b.icon;
    63	              const active = response === b.key;
    64	              return (
    65	                <button
    66	                  key={b.key}
    67	                  type="button"
    68	                  onClick={() => onSetRsvp(player.id, b.key)}
    69	                  className="sf-press"
    70	                  aria-label={b.label}
    71	                  style={{
    72	                    width: 36, height: 36, borderRadius: 18,
    73	                    border: active ? 'none' : '1px solid var(--em-border-default)',
    74	                    backgroundColor: active ? b.bg : 'transparent',
    75	                    color: active ? b.color : 'var(--em-text-tertiary)',
    76	                    display: 'flex', alignItems: 'center', justifyContent: 'center',
    77	                  }}
    78	                >
    79	                  <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
    80	                </button>
    81	              );
    82	            })}
    83	          </div>
    84	        )}
    85	      </div>
    86	      {!readOnly && (
    87	        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
    88	          {!showNote && (
    89	            <button type="button" onClick={() => setShowNote(true)}
    90	              style={{ fontSize: 12, color: 'var(--em-text-tertiary)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}>
    91	              {existingNote ? 'Edit note' : 'Add note'}
    92	            </button>
    93	          )}
    94	        </div>
    95	      )}
    96	      {!readOnly && showNote && (
    97	        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
    98	          <input
    99	            type="text"
   100	            value={noteText}
   101	            onChange={(e) => setNoteText(e.target.value)}
   102	            placeholder="Out of town, back Thursday..."
   103	            style={{
   104	              flex: 1, fontSize: 13, padding: '6px 10px', borderRadius: 8,
   105	              border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
   106	              color: 'var(--em-text-primary)',
   107	            }}
   108	          />
   109	          <button type="button" onClick={() => { onSaveNote?.(player.id, noteText); setShowNote(false); }}
   110	            className="sf-press"
   111	            style={{
   112	              fontSize: 13, fontWeight: 500, color: 'var(--em-accent)',
   113	              padding: '6px 12px', borderRadius: 8,
   114	              border: '1px solid var(--em-accent)', backgroundColor: 'transparent',
   115	            }}>
   116	            Save
   117	          </button>
   118	        </div>
   119	      )}
   120	      {existingNote && !showNote && (
   121	        <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', fontStyle: 'italic', marginTop: 2 }}>
   122	          &ldquo;{existingNote}&rdquo;
   123	        </div>
   124	      )}
   125	    </div>
   126	  );
   127	}
```

## src/components/rsvp/RsvpSummary.jsx (30 lines)
```
     1	export default function RsvpSummary({ roster, rsvps }) {
     2	  const total = roster.length;
     3	  if (total === 0) return null;
     4	
     5	  const going = rsvps.filter((r) => r.response === 'going').length;
     6	  const notGoing = rsvps.filter((r) => r.response === 'not_going').length;
     7	  const maybe = rsvps.filter((r) => r.response === 'maybe').length;
     8	  const noResponse = total - going - notGoing - maybe;
     9	
    10	  const pct = (n) => Math.round((n / total) * 100);
    11	
    12	  return (
    13	    <div style={{ marginBottom: 16 }}>
    14	      {/* Colored bar */}
    15	      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
    16	        {going > 0 && <div style={{ width: `${pct(going)}%`, backgroundColor: 'var(--em-success)' }} />}
    17	        {maybe > 0 && <div style={{ width: `${pct(maybe)}%`, backgroundColor: 'var(--em-warning)' }} />}
    18	        {notGoing > 0 && <div style={{ width: `${pct(notGoing)}%`, backgroundColor: 'var(--em-danger)' }} />}
    19	        {noResponse > 0 && <div style={{ width: `${pct(noResponse)}%`, backgroundColor: 'var(--em-neutral)' }} />}
    20	      </div>
    21	      {/* Counts */}
    22	      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--em-text-secondary)', flexWrap: 'wrap' }}>
    23	        <span><strong style={{ color: 'var(--em-success)' }}>{going}</strong> Going</span>
    24	        {maybe > 0 && <span><strong style={{ color: 'var(--em-warning)' }}>{maybe}</strong> Maybe</span>}
    25	        <span><strong style={{ color: 'var(--em-danger)' }}>{notGoing}</strong> Not Going</span>
    26	        <span><strong style={{ color: 'var(--em-neutral)' }}>{noResponse}</strong> No Response</span>
    27	      </div>
    28	    </div>
    29	  );
    30	}
```

## src/components/schedule/ChildRsvp.jsx (83 lines)
```
     1	import { useCallback, useEffect, useState } from 'react';
     2	import { supabase } from '../../lib/supabase';
     3	import { useAuth } from '../../context/AuthContext';
     4	
     5	// Module-level cache so response survives component unmount/remount on nav.
     6	const responseCache = new Map();
     7	const cacheKey = (eventId, playerId) => `${eventId}:${playerId}`;
     8	
     9	const PILLS = [
    10	  { value: 'going',     label: 'Going',     color: 'var(--em-success)' },
    11	  { value: 'maybe',     label: 'Maybe',     color: 'var(--em-warning)' },
    12	  { value: 'not_going', label: 'Not Going', color: 'var(--em-danger)' },
    13	];
    14	
    15	const CONFIRMED = {
    16	  going:     { icon: '✓', label: 'Going',     color: 'var(--em-success)' },
    17	  maybe:     { icon: '?', label: 'Maybe',     color: 'var(--em-warning)' },
    18	  not_going: { icon: '✗', label: 'Not Going', color: 'var(--em-danger)' },
    19	};
    20	
    21	export default function ChildRsvp({ child, eventId, compact = false }) {
    22	  const { guardianId } = useAuth();
    23	  const [response, setResponse] = useState(() => responseCache.get(cacheKey(eventId, child.playerId)) ?? null);
    24	  const [saving, setSaving] = useState(false);
    25	
    26	  const fetchRsvp = useCallback(async () => {
    27	    const { data } = await supabase.from('event_rsvps').select('response')
    28	      .eq('event_id', eventId).eq('player_id', child.playerId).maybeSingle();
    29	    const next = data?.response ?? null;
    30	    responseCache.set(cacheKey(eventId, child.playerId), next);
    31	    setResponse((prev) => (prev === next ? prev : next));
    32	  }, [eventId, child.playerId]);
    33	
    34	  useEffect(() => {
    35	    fetchRsvp();
    36	    const handler = () => fetchRsvp();
    37	    window.addEventListener('focus', handler);
    38	    return () => window.removeEventListener('focus', handler);
    39	  }, [fetchRsvp]);
    40	
    41	  const save = async (value) => {
    42	    setSaving(true);
    43	    navigator.vibrate?.(10);
    44	    const { error } = await supabase.from('event_rsvps').upsert({
    45	      event_id: eventId, player_id: child.playerId, guardian_id: guardianId ?? null,
    46	      response: value, responded_at: new Date().toISOString(),
    47	    }, { onConflict: 'event_id,player_id' });
    48	    setSaving(false);
    49	    if (!error) { responseCache.set(cacheKey(eventId, child.playerId), value); setResponse(value); }
    50	    else console.error('RSVP save failed:', error.message);
    51	  };
    52	
    53	  const minH = compact ? 36 : 44;
    54	  const nameSize = compact ? 12 : 14;
    55	  const pillSize = compact ? 12 : 13;
    56	
    57	  const state = CONFIRMED[response];
    58	  if (state) {
    59	    return (
    60	      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: minH, marginTop: compact ? 4 : 8 }}>
    61	        <span style={{ fontSize: nameSize, fontWeight: 500, color: state.color }}>
    62	          {state.icon} {child.firstName} {state.label}
    63	        </span>
    64	        <button type="button" onClick={(e) => { e.stopPropagation(); setResponse(null); }}
    65	          style={{ background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: pillSize, fontWeight: 500, padding: 4 }}>
    66	          Change
    67	        </button>
    68	      </div>
    69	    );
    70	  }
    71	
    72	  return (
    73	    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: compact ? 4 : 8 }}>
    74	      <span style={{ fontSize: pillSize, fontWeight: 500, color: 'var(--em-text-primary)', minWidth: 60 }}>{child.firstName}</span>
    75	      {PILLS.map((p) => (
    76	        <button key={p.value} type="button" onClick={(e) => { e.stopPropagation(); save(p.value); }} disabled={saving} className="sf-press"
    77	          style={{ flex: 1, minHeight: minH, borderRadius: 10, fontSize: pillSize, fontWeight: 600, border: `1.5px solid ${p.color}`, backgroundColor: 'transparent', color: p.color, opacity: saving ? 0.6 : 1 }}>
    78	          {p.label}
    79	        </button>
    80	      ))}
    81	    </div>
    82	  );
    83	}
```

## src/components/schedule/CompactCard.jsx (46 lines)
```
     1	import { useNavigate } from 'react-router-dom';
     2	import { formatTime } from '../../lib/formatters';
     3	import { TYPE_LABELS } from '../../lib/constants';
     4	
     5	export default function CompactCard({ event, stagger }) {
     6	  const navigate = useNavigate();
     7	  const team = event.teams;
     8	  const teamColor = team?.team_color || 'var(--em-neutral)';
     9	  const teamName = team?.name || '';
    10	  const endTime = event.end_at ? new Date(event.end_at).getTime() : null;
    11	  const startTime = event.start_at ? new Date(event.start_at).getTime() : null;
    12	  const isPast = endTime ? endTime < Date.now() : (startTime ? startTime < Date.now() : false);
    13	
    14	  return (
    15	    <div
    16	      className={`sf-press ${isPast ? '' : (stagger || '')}`}
    17	      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
    18	      style={{
    19	        display: 'flex',
    20	        alignItems: 'center',
    21	        minHeight: 48,
    22	        backgroundColor: 'var(--em-bg-card)',
    23	        borderRadius: 8,
    24	        border: '1px solid var(--em-border-default)',
    25	        overflow: 'hidden',
    26	        opacity: isPast ? 0.5 : 1,
    27	        cursor: 'pointer',
    28	        transition: 'box-shadow 150ms ease-out, opacity 150ms ease-out',
    29	      }}
    30	    >
    31	      <div style={{ width: 3, alignSelf: 'stretch', flexShrink: 0, backgroundColor: teamColor }} />
    32	      <div className="flex items-center flex-1 gap-3" style={{ padding: '6px 12px' }}>
    33	        <span className="font-bold" style={{ fontSize: 14, color: 'var(--em-text-primary)', minWidth: 56 }}>
    34	          {formatTime(event.start_time || '00:00')}
    35	        </span>
    36	        <span style={{
    37	          fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
    38	          backgroundColor: teamColor, color: 'var(--em-text-inverse)',
    39	        }}>{teamName}</span>
    40	        <span className="truncate" style={{ flex: 1, fontSize: 13, color: 'var(--em-text-secondary)' }}>
    41	          {event.title || TYPE_LABELS[event.event_type] || event.event_type || 'Event'}
    42	        </span>
    43	      </div>
    44	    </div>
    45	  );
    46	}
```

## src/components/schedule/DateGroupedList.jsx (21 lines)
```
     1	import { groupByDate, formatDateHeader } from '../../lib/scheduleHelpers';
     2	import EventCard from './EventCard';
     3	
     4	export default function DateGroupedList({ events, rsvpCounts, rideCounts, dutyCounts }) {
     5	  return groupByDate(events).map(([date, evts]) => (
     6	    <div key={date} data-date-group={date}>
     7	      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--em-text-tertiary)', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' }}>
     8	        {formatDateHeader(date)}
     9	      </div>
    10	      {evts.map((event) => (
    11	        <EventCard
    12	          key={event.id}
    13	          event={event}
    14	          rsvpCount={rsvpCounts?.[event.id]}
    15	          rideCount={rideCounts?.[event.id]}
    16	          dutyCount={dutyCounts?.[event.id]}
    17	        />
    18	      ))}
    19	    </div>
    20	  ));
    21	}
```

## src/components/schedule/EventCard.jsx (145 lines)
```
     1	import { MapPin, Car, Repeat } from 'lucide-react';
     2	import { useNavigate } from 'react-router-dom';
     3	import { formatTime } from '../../lib/formatters';
     4	import { TYPE_LABELS } from '../../lib/constants';
     5	import { useAuth } from '../../context/AuthContext';
     6	import ChildRsvp from './ChildRsvp';
     7	
     8	export default function EventCard({ event, rsvpCount, rideCount, dutyCount, stagger }) {
     9	  const navigate = useNavigate();
    10	  const { role, myChildren } = useAuth();
    11	  const childrenOnTeam = (myChildren || []).filter((c) => c.teamId === event.team_id);
    12	  const team = event.teams;
    13	  const teamColor = team?.team_color || 'var(--em-neutral)';
    14	  const teamName = team?.name || '';
    15	  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
    16	  const isCancelled = event.status === 'cancelled';
    17	  const isPast = event.end_at ? new Date(event.end_at) < new Date() : false;
    18	  const dimmed = isCancelled || isPast;
    19	  const rawTitle = event.title || typeLabel;
    20	  const alreadyPrefixed = rawTitle.startsWith('vs.') || rawTitle.startsWith('vs ') || rawTitle.startsWith('@ ') || rawTitle.startsWith('@');
    21	  const titlePrefix = !alreadyPrefixed && (event.event_type === 'game' || event.event_type === 'tournament') && event.opponent
    22	    ? (event.home_away === 'away' ? '@ ' : 'vs. ')
    23	    : '';
    24	
    25	  return (
    26	    <div
    27	      className={`sf-press ${dimmed ? '' : (stagger || '')}`}
    28	      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
    29	      style={{
    30	        display: 'flex',
    31	        alignItems: 'stretch',
    32	        backgroundColor: (event.event_type === 'game' || event.event_type === 'tournament') ? 'rgba(74, 143, 212, 0.06)' : 'var(--em-bg-card)',
    33	        borderRadius: 10,
    34	        border: '1px solid var(--em-border-default)',
    35	        boxShadow: 'var(--em-shadow-sm)',
    36	        overflow: 'hidden',
    37	        opacity: dimmed ? 0.5 : 1,
    38	        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out, opacity 150ms ease-out',
    39	      }}
    40	    >
    41	      <div style={{ width: 4, flexShrink: 0, backgroundColor: teamColor }} />
    42	      <div style={{ flex: 1, padding: '10px 14px' }}>
    43	        {/* Row 1: Time · Type + recurring + updated dot + cancelled */}
    44	        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center' }}>
    45	          <span className="font-bold" style={{ fontSize: 17, color: 'var(--em-text-primary)' }}>
    46	            {formatTime(event.start_time || '00:00')}
    47	          </span>
    48	          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginLeft: 6 }}>
    49	            · {typeLabel}
    50	          </span>
    51	          {event.is_scrimmage && (
    52	            <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginLeft: 4 }}>
    53	              Scrimmage
    54	            </span>
    55	          )}
    56	          {event.parent_event_id && (
    57	            <Repeat size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" style={{ marginLeft: 4 }} />
    58	          )}
    59	          {event.updated_at && (new Date(event.updated_at).getTime() > Date.now() - 86400000) && !isPast && !isCancelled && (
    60	            <span style={{
    61	              display: 'inline-block', width: 6, height: 6, borderRadius: 3,
    62	              backgroundColor: 'var(--em-info)', marginLeft: 6, verticalAlign: 'middle',
    63	            }} />
    64	          )}
    65	          {isCancelled && (
    66	            <span style={{
    67	              fontSize: 11, fontWeight: 600, color: 'var(--em-danger)',
    68	              backgroundColor: 'var(--em-danger-soft)', padding: '1px 6px',
    69	              borderRadius: 4, marginLeft: 4, textTransform: 'uppercase',
    70	            }}>
    71	              Cancelled
    72	            </span>
    73	          )}
    74	        </div>
    75	        {/* Row 2: Title */}
    76	        <div style={{ fontSize: 15, color: 'var(--em-text-primary)', marginBottom: 2, textDecoration: isCancelled ? 'line-through' : 'none' }}>
    77	          {titlePrefix}{rawTitle}
    78	        </div>
    79	        {/* Row 3: Team · pin Location */}
    80	        {(teamName || event.location_name) && (
    81	          <div className="flex items-center" style={{ fontSize: 13, gap: 4 }}>
    82	            {teamName && <span style={{ color: teamColor, fontWeight: 500 }}>{teamName}</span>}
    83	            {teamName && event.location_name && <span style={{ color: 'var(--em-text-tertiary)' }}>·</span>}
    84	            {event.location_name && (
    85	              <>
    86	                <MapPin size={12} strokeWidth={1.75} color="var(--em-text-tertiary)" />
    87	                <span style={{ color: 'var(--em-text-tertiary)' }}>{event.location_name}</span>
    88	              </>
    89	            )}
    90	          </div>
    91	        )}
    92	        {/* Row 3a: Notes excerpt */}
    93	        {event.notes && (
    94	          <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
    95	            {event.notes.length > 60 ? event.notes.slice(0, 60) + '...' : event.notes}
    96	          </div>
    97	        )}
    98	        {/* Row 3b: Jersey color (games/tournaments when set) */}
    99	        {event.jersey && (
   100	          <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
   101	            {event.jersey} jersey
   102	          </div>
   103	        )}
   104	        {/* Row 4: RSVP counts */}
   105	        {rsvpCount && (
   106	          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 4, color: 'var(--em-text-tertiary)' }}>
   107	            <span style={{ color: 'var(--em-success)' }}>{rsvpCount.going || 0}</span>
   108	            <span>going</span>
   109	            <span>·</span>
   110	            <span style={{ color: 'var(--em-danger)' }}>{rsvpCount.not_going || 0}</span>
   111	            <span>out</span>
   112	            <span>·</span>
   113	            <span>{rsvpCount.noResponse || 0} no reply</span>
   114	          </div>
   115	        )}
   116	        {/* Row 5: Ride counts */}
   117	        {rideCount && (rideCount.offers > 0 || rideCount.requests > 0) && (
   118	          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4 }}>
   119	            <Car size={12} strokeWidth={1.75} color={rideCount.urgent ? 'var(--em-danger)' : rideCount.requests > 0 ? 'var(--em-warning)' : 'var(--em-text-tertiary)'} />
   120	            {rideCount.offers > 0 && <span style={{ color: 'var(--em-text-secondary)' }}>{rideCount.offers} seat{rideCount.offers !== 1 ? 's' : ''}</span>}
   121	            {rideCount.offers > 0 && rideCount.requests > 0 && <span style={{ color: 'var(--em-text-tertiary)' }}>·</span>}
   122	            {rideCount.requests > 0 && (
   123	              <span style={{ color: rideCount.urgent ? 'var(--em-danger)' : 'var(--em-warning)', fontWeight: 500 }}>
   124	                {rideCount.urgent ? 'URGENT: ' : ''}{rideCount.requests} ride{rideCount.requests !== 1 ? 's' : ''} needed
   125	              </span>
   126	            )}
   127	          </div>
   128	        )}
   129	        {/* Row 6: Volunteer counts */}
   130	        {dutyCount && dutyCount.total > 0 && (
   131	          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4, color: dutyCount.claimed < dutyCount.total ? 'var(--em-warning)' : 'var(--em-success)' }}>
   132	            {dutyCount.claimed}/{dutyCount.total} volunteers filled
   133	          </div>
   134	        )}
   135	        {role === 'parent' && childrenOnTeam.length > 0 && (
   136	          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
   137	            {childrenOnTeam.map((child) => (
   138	              <ChildRsvp key={child.playerId} child={child} eventId={event.id} compact />
   139	            ))}
   140	          </div>
   141	        )}
   142	      </div>
   143	    </div>
   144	  );
   145	}
```

## src/components/schedule/FilterBar.jsx (74 lines)
```
     1	import { TYPE_OPTIONS } from '../../lib/constants';
     2	
     3	export default function FilterBar({ teams, selectedTeam, onSelectTeam, selectedType, onSelectType, showCancelled, onToggleCancelled }) {
     4	  const uniqueTeams = [];
     5	  const seen = new Set();
     6	  (teams || []).forEach((a) => {
     7	    if (a.team_id && !seen.has(a.team_id) && a.teams) {
     8	      seen.add(a.team_id);
     9	      uniqueTeams.push({ id: a.team_id, name: a.teams.name, team_color: a.teams.team_color, sort_order: a.teams.sort_order });
    10	    }
    11	  });
    12	  uniqueTeams.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    13	
    14	  return (
    15	    <div style={{ padding: '8px 0' }}>
    16	      <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 6 }}>
    17	        <Chip
    18	          label="All Teams"
    19	          active={!selectedTeam}
    20	          onClick={() => onSelectTeam(null)}
    21	        />
    22	        {uniqueTeams.map((t) => (
    23	          <Chip
    24	            key={t.id}
    25	            label={t.name}
    26	            active={selectedTeam === t.id}
    27	            color={t.team_color}
    28	            onClick={() => onSelectTeam(selectedTeam === t.id ? null : t.id)}
    29	          />
    30	        ))}
    31	      </div>
    32	      <div className="flex gap-2 overflow-x-auto sf-no-scrollbar">
    33	        {TYPE_OPTIONS.map((opt) => (
    34	          <Chip
    35	            key={opt.key || 'all'}
    36	            label={opt.label}
    37	            active={selectedType === opt.key}
    38	            onClick={() => onSelectType(opt.key)}
    39	          />
    40	        ))}
    41	      </div>
    42	      {onToggleCancelled && (
    43	        <button type="button" onClick={onToggleCancelled}
    44	          style={{ fontSize: 12, color: 'var(--em-text-tertiary)', background: 'none', border: 'none', padding: '4px 0', marginTop: 4 }}>
    45	          {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
    46	        </button>
    47	      )}
    48	    </div>
    49	  );
    50	}
    51	
    52	function Chip({ label, active, color, onClick }) {
    53	  return (
    54	    <button
    55	      type="button"
    56	      onClick={() => { navigator.vibrate?.(10); onClick(); }}
    57	      className="sf-press"
    58	      style={{
    59	        flexShrink: 0,
    60	        minHeight: 32,
    61	        padding: '0 12px',
    62	        borderRadius: 999,
    63	        fontSize: 12,
    64	        fontWeight: active ? 600 : 400,
    65	        border: `1.5px solid ${active ? (color || 'var(--em-accent)') : 'var(--em-border-default)'}`,
    66	        backgroundColor: active ? (color ? `${color}15` : 'var(--em-accent-soft)') : 'var(--em-bg-card)',
    67	        color: active ? (color || 'var(--em-accent)') : 'var(--em-text-primary)',
    68	        whiteSpace: 'nowrap',
    69	      }}
    70	    >
    71	      {label}
    72	    </button>
    73	  );
    74	}
```

## src/components/schedule/NextUpCardInfo.jsx (47 lines)
```
     1	// Compact info rows for NextUpCard, split so the parent can place
     2	// each piece at the right spot in the visual order:
     3	//   WhenRow  → above the location line
     4	//   GameInfo → below the location line (only renders for games)
     5	
     6	export function WhenRow({ event }) {
     7	  return (
     8	    <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 }}>
     9	      {new Date(event.start_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, {new Date(event.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
    10	      {event.end_at && ` - ${new Date(event.end_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
    11	    </div>
    12	  );
    13	}
    14	
    15	export function GameInfo({ event }) {
    16	  const isGame = event.event_type === 'game' || event.event_type === 'tournament';
    17	  const showJerseyOrChip = isGame && (event.jersey || (event.home_away && event.home_away !== 'tbd'));
    18	  return (
    19	    <>
    20	      {event.arrival_minutes_before > 0 && (
    21	        <div style={{ fontSize: 12, color: 'var(--em-warning)', fontWeight: 500, marginTop: 2 }}>
    22	          Arrive {event.arrival_minutes_before} min early
    23	        </div>
    24	      )}
    25	      {showJerseyOrChip && (
    26	        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
    27	          {event.jersey && <span style={{ fontSize: 12, color: 'var(--em-text-secondary)' }}>{event.jersey} jersey</span>}
    28	          {event.home_away && event.home_away !== 'tbd' && event.home_away !== 'neutral' && (
    29	            <span style={{
    30	              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
    31	              padding: '1px 6px', borderRadius: 4,
    32	              backgroundColor: event.home_away === 'home' ? 'var(--em-success-soft)' : 'var(--em-info-soft)',
    33	              color: event.home_away === 'home' ? 'var(--em-success)' : 'var(--em-info)',
    34	            }}>
    35	              {event.home_away}
    36	            </span>
    37	          )}
    38	        </div>
    39	      )}
    40	      {event.is_scrimmage && (
    41	        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>
    42	          Scrimmage
    43	        </span>
    44	      )}
    45	    </>
    46	  );
    47	}
```

## src/components/schedule/NextUpCard.jsx (138 lines)
```
     1	import { useState, useEffect } from 'react';
     2	import { useNavigate } from 'react-router-dom';
     3	import { MapPin, Car, Repeat, ExternalLink } from 'lucide-react';
     4	import { TYPE_LABELS } from '../../lib/constants';
     5	import { formatCountdown } from '../../lib/formatters';
     6	import { WhenRow, GameInfo } from './NextUpCardInfo';
     7	import { useAuth } from '../../context/AuthContext';
     8	import { useMapsUrl } from '../../hooks/useMapsUrl';
     9	import ChildRsvp from './ChildRsvp';
    10	
    11	export default function NextUpCard({ event, rsvpCount, rideCount, dutyCount, onRefresh }) {
    12	  const navigate = useNavigate();
    13	  const { role, myChildren } = useAuth();
    14	  const childrenOnTeam = (myChildren || []).filter((c) => c.teamId === event.team_id);
    15	  const [countdown, setCountdown] = useState(() => formatCountdown(event.start_at));
    16	
    17	  useEffect(() => {
    18	    const id = setInterval(() => setCountdown(formatCountdown(event.start_at)), 60000);
    19	    return () => clearInterval(id);
    20	  }, [event.start_at]);
    21	
    22	  // Every 60s, check whether the currently-featured event has ended.
    23	  // If yes, ask the parent to refresh so nextEvent can advance to the
    24	  // next upcoming event. Belt-and-suspenders with SchedulePage's tick.
    25	  useEffect(() => {
    26	    if (!event.end_at || !onRefresh) return;
    27	    const id = setInterval(() => {
    28	      if (new Date(event.end_at) < new Date()) onRefresh();
    29	    }, 60000);
    30	    return () => clearInterval(id);
    31	  }, [event.end_at, onRefresh]);
    32	
    33	  const directionsUrl = useMapsUrl(event.location);
    34	
    35	  const teamColor = event.teams?.team_color || event.team_color || 'var(--em-text-tertiary)';
    36	  const teamName = event.teams?.name || event.team_name || '';
    37	  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
    38	  const secondsUntil = (new Date(event.start_at).getTime() - Date.now()) / 1000;
    39	  const imminent = secondsUntil > 0 && secondsUntil < 7200;
    40	
    41	  return (
    42	    <div
    43	      style={{
    44	        backgroundColor: 'var(--em-bg-card)', borderRadius: 12,
    45	        border: '1px solid var(--em-border-default)', overflow: 'hidden',
    46	        marginBottom: 16,
    47	      }}
    48	    >
    49	      <div
    50	        onClick={() => navigate(`/events/${event.id}`, { state: { event } })}
    51	        style={{ display: 'flex', cursor: 'pointer' }}
    52	      >
    53	        <div style={{ width: 4, backgroundColor: teamColor, flexShrink: 0 }} />
    54	        <div style={{ flex: 1, padding: 16 }}>
    55	          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
    56	            <span style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
    57	              {typeLabel}
    58	              {event.parent_event_id && (
    59	                <Repeat size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" style={{ marginLeft: 4 }} />
    60	              )}
    61	            </span>
    62	            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-accent)', display: 'inline-flex', alignItems: 'center', gap: 6 }} data-seconds-until={Math.round(secondsUntil)}>
    63	              {imminent && (
    64	                <span className="sf-pulse-dot" aria-hidden="true" style={{
    65	                  display: 'inline-block', width: 8, height: 8, borderRadius: 4,
    66	                  backgroundColor: 'var(--em-success)', flexShrink: 0,
    67	                }} />
    68	              )}
    69	              {countdown}
    70	            </span>
    71	          </div>
    72	          {(event.teams?.name || event.team_name) && (
    73	            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginBottom: 4 }}>
    74	              {event.teams?.name || event.team_name}
    75	            </div>
    76	          )}
    77	          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 4 }}>
    78	            {event.title || typeLabel}
    79	          </div>
    80	          <WhenRow event={event} />
    81	          {event.location && (
    82	            directionsUrl ? (
    83	              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
    84	                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginTop: 2, marginBottom: 8, textDecoration: 'none' }}>
    85	                <MapPin size={12} strokeWidth={1.75} color="var(--em-text-tertiary)" />
    86	                <span style={{ color: 'var(--em-text-secondary)' }}>{event.location}</span>
    87	                <ExternalLink size={10} strokeWidth={1.75} color="var(--em-text-tertiary)" />
    88	              </a>
    89	            ) : (
    90	              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginTop: 2, marginBottom: 8 }}>
    91	                <MapPin size={12} strokeWidth={1.75} color="var(--em-text-tertiary)" />
    92	                <span style={{ color: 'var(--em-text-secondary)' }}>{event.location}</span>
    93	              </div>
    94	            )
    95	          )}
    96	          {event.notes && (
    97	            <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
    98	              {event.notes.length > 60 ? event.notes.slice(0, 60) + '...' : event.notes}
    99	            </div>
   100	          )}
   101	          <GameInfo event={event} />
   102	          {rsvpCount && (
   103	            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--em-text-secondary)' }}>
   104	              <span><strong style={{ color: 'var(--em-success)' }}>{rsvpCount.going}</strong> going</span>
   105	              <span><strong style={{ color: 'var(--em-danger)' }}>{rsvpCount.not_going}</strong> not going</span>
   106	              <span><strong style={{ color: 'var(--em-neutral)' }}>{rsvpCount.noResponse}</strong> no response</span>
   107	            </div>
   108	          )}
   109	          {rideCount && (rideCount.offers > 0 || rideCount.requests > 0) && (
   110	            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--em-text-secondary)', marginTop: 4 }}>
   111	              <Car size={12} strokeWidth={1.75} color="var(--em-text-tertiary)" />
   112	              {rideCount.offers > 0 && <span>{rideCount.offers} seat{rideCount.offers !== 1 ? 's' : ''} offered</span>}
   113	              {rideCount.offers > 0 && rideCount.requests > 0 && <span style={{ color: 'var(--em-text-tertiary)' }}>·</span>}
   114	              {rideCount.requests > 0 && <span style={{ color: 'var(--em-warning)', fontWeight: 500 }}>{rideCount.requests} ride{rideCount.requests !== 1 ? 's' : ''} needed</span>}
   115	            </div>
   116	          )}
   117	          {dutyCount && dutyCount.total > 0 && (
   118	            <div style={{ fontSize: 12, marginTop: 4, color: dutyCount.claimed < dutyCount.total ? 'var(--em-warning)' : 'var(--em-success)' }}>
   119	              {dutyCount.claimed}/{dutyCount.total} volunteers filled
   120	            </div>
   121	          )}
   122	        </div>
   123	      </div>
   124	      {role === 'parent' && childrenOnTeam.length > 0 ? (
   125	        <div style={{ padding: '0 16px 16px' }}>
   126	          {childrenOnTeam.map((c) => <ChildRsvp key={c.playerId} child={c} eventId={event.id} />)}
   127	        </div>
   128	      ) : (
   129	        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
   130	          <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}?tab=rsvps`, { state: { event } }); }} className="sf-press"
   131	            style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-accent)', fontSize: 14, fontWeight: 500 }}>
   132	            Manage RSVPs
   133	          </button>
   134	        </div>
   135	      )}
   136	    </div>
   137	  );
   138	}
```

## src/components/shared/Avatar.jsx (41 lines)
```
     1	// Circular avatar. Renders an image when `src` is provided, otherwise falls
     2	// back to the first letter of `name` on a colored background (defaults to
     3	// --em-accent, or use `color` to pass a team_color straight from the DB —
     4	// the one legitimate case for inline hex in the app).
     5	
     6	const SIZES = { 24: 24, 32: 32, 40: 40, 56: 56 };
     7	const FONT_FOR = { 24: 10, 32: 13, 40: 15, 56: 20 };
     8	
     9	export default function Avatar({ src, name = '', size = 32, color, alt, className = '' }) {
    10	  const px = SIZES[size] || 32;
    11	  const initial = (name.trim() || '?').charAt(0).toUpperCase();
    12	  const bg = color || 'var(--em-accent)';
    13	
    14	  if (src) {
    15	    return (
    16	      <img
    17	        src={src}
    18	        alt={alt || name}
    19	        className={`object-cover ${className}`}
    20	        style={{ width: px, height: px, borderRadius: '50%' }}
    21	      />
    22	    );
    23	  }
    24	
    25	  return (
    26	    <div
    27	      className={`inline-flex items-center justify-center font-semibold ${className}`}
    28	      style={{
    29	        width: px,
    30	        height: px,
    31	        borderRadius: '50%',
    32	        backgroundColor: bg,
    33	        color: 'var(--em-text-inverse)',
    34	        fontSize: FONT_FOR[px] || 13,
    35	      }}
    36	      aria-label={alt || name}
    37	    >
    38	      {initial}
    39	    </div>
    40	  );
    41	}
```

## src/components/shared/Badge.jsx (32 lines)
```
     1	// Small status pill used for RSVP state, event status, role tags, etc.
     2	// Variants map to the Skyfire status tokens — "soft" bg + solid text —
     3	// which keeps contrast readable in both light and dark surfaces.
     4	
     5	const VARIANTS = {
     6	  success: { bg: 'var(--em-success-soft)', fg: 'var(--em-success)' },
     7	  warning: { bg: 'var(--em-warning-soft)', fg: 'var(--em-warning)' },
     8	  danger:  { bg: 'var(--em-danger-soft)',  fg: 'var(--em-danger)'  },
     9	  info:    { bg: 'var(--em-info-soft)',    fg: 'var(--em-info)'    },
    10	  neutral: { bg: 'var(--em-neutral-soft)', fg: 'var(--em-neutral)' },
    11	  academy: { bg: 'var(--em-academy-soft)', fg: 'var(--em-academy)' },
    12	};
    13	
    14	export default function Badge({ children, variant = 'neutral', className = '' }) {
    15	  const v = VARIANTS[variant] || VARIANTS.neutral;
    16	  return (
    17	    <span
    18	      className={`inline-flex items-center font-medium ${className}`}
    19	      style={{
    20	        backgroundColor: v.bg,
    21	        color: v.fg,
    22	        borderRadius: 6,
    23	        fontSize: 11,
    24	        lineHeight: 1,
    25	        padding: '4px 8px',
    26	        letterSpacing: 0.2,
    27	      }}
    28	    >
    29	      {children}
    30	    </span>
    31	  );
    32	}
```

## src/components/shared/BottomSheet.jsx (150 lines)
```
     1	import { useEffect, useState } from 'react';
     2	
     3	// Mobile-native bottom sheet. Height is CONTENT-DRIVEN with a cap:
     4	// the panel is a plain block container (NOT a flex container) that
     5	// shrink-wraps its children — handle (44px block) + content region.
     6	// The content region carries its own `max-height: cap - 44px` and
     7	// `overflow-y: auto`, so short forms produce a short sheet with the
     8	// Save button sitting flush against the content, and tall forms hit
     9	// the cap and scroll inside the content region while the handle stays
    10	// pinned. Tapping the handle toggles between `initialHeight` and
    11	// `expandedHeight`. Backdrop click or Escape dismisses.
    12	//
    13	// Viewport handling: `initialHeight`/`expandedHeight` are percentage
    14	// strings like "85%". We measure `window.visualViewport.height` (with
    15	// `window.innerHeight` as fallback) and compute the cap in pixels
    16	// ourselves instead of relying on CSS `%` or `dvh`. Why:
    17	//   - CSS `%` inside `position: fixed; inset: 0` resolves against the
    18	//     iOS layout viewport (tall, extends behind the URL bar), so caps
    19	//     extend below the visible screen.
    20	//   - CSS `dvh` fixes that on iOS 15.4+, but older Safari ignores it.
    21	//   - `window.visualViewport.height` is the authoritative visible
    22	//     viewport and is supported back to iOS 13.
    23	//
    24	// BottomSheet returns null when closed so the inner <Sheet> unmounts
    25	// and its useState resets to `expanded=false` on every reopen.
    26	export default function BottomSheet({
    27	  open,
    28	  onClose,
    29	  children,
    30	  initialHeight = '40%',
    31	  expandedHeight = '90%',
    32	}) {
    33	  if (!open) return null;
    34	  return (
    35	    <Sheet
    36	      onClose={onClose}
    37	      initialHeight={initialHeight}
    38	      expandedHeight={expandedHeight}
    39	    >
    40	      {children}
    41	    </Sheet>
    42	  );
    43	}
    44	
    45	// "85%" → 0.85. Returns 0.4 for anything unparseable so tests/calls
    46	// that pass garbage still get a visible sheet.
    47	function parsePct(s) {
    48	  if (typeof s !== 'string') return 0.4;
    49	  const m = s.match(/^(\d+(?:\.\d+)?)%$/);
    50	  return m ? Number(m[1]) / 100 : 0.4;
    51	}
    52	
    53	// Tracks the visible viewport height. Subscribes to visualViewport
    54	// resize on modern browsers (iOS 13+, everything evergreen) and to
    55	// window resize as a fallback. Intentionally does NOT listen to
    56	// visualViewport `scroll` — on iOS that fires as the URL bar auto-
    57	// hides, which would cause the sheet to resize mid-interaction.
    58	function useVisualVh() {
    59	  const read = () => {
    60	    if (typeof window === 'undefined') return 800;
    61	    return Math.round(window.visualViewport?.height ?? window.innerHeight);
    62	  };
    63	  const [vh, setVh] = useState(read);
    64	  useEffect(() => {
    65	    const update = () => setVh(read());
    66	    const vv = window.visualViewport;
    67	    vv?.addEventListener('resize', update);
    68	    window.addEventListener('resize', update);
    69	    window.addEventListener('orientationchange', update);
    70	    return () => {
    71	      vv?.removeEventListener('resize', update);
    72	      window.removeEventListener('resize', update);
    73	      window.removeEventListener('orientationchange', update);
    74	    };
    75	  }, []);
    76	  return vh;
    77	}
    78	
    79	function Sheet({ onClose, children, initialHeight, expandedHeight }) {
    80	  const [expanded, setExpanded] = useState(false);
    81	  const vh = useVisualVh();
    82	
    83	  useEffect(() => {
    84	    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    85	    window.addEventListener('keydown', onKey);
    86	    return () => window.removeEventListener('keydown', onKey);
    87	  }, [onClose]);
    88	
    89	  const HANDLE_PX = 44;
    90	  const pct = expanded ? parsePct(expandedHeight) : parsePct(initialHeight);
    91	  const maxHeightPx = Math.round(vh * pct);
    92	  // Scroll region gets the cap minus the fixed handle row, so the
    93	  // handle is always visible even when the content scrolls.
    94	  const contentMaxHeightPx = Math.max(0, maxHeightPx - HANDLE_PX);
    95	
    96	  return (
    97	    <div
    98	      className="fixed inset-0 z-50 flex items-end justify-center"
    99	      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
   100	      onClick={onClose}
   101	      role="dialog"
   102	      aria-modal="true"
   103	    >
   104	      {/* Panel is a plain block element — NO flex layout. Normal block
   105	          flow sizes it to the sum of its children's natural heights
   106	          (handle + content), capped by maxHeight. Short forms get a
   107	          short sheet with zero dead space; tall forms hit the cap and
   108	          the inner scroll region engages. `overflow: hidden` keeps the
   109	          rounded corners from being clipped by the scrollable child. */}
   110	      <div
   111	        className="w-full sf-sheet-rise"
   112	        style={{
   113	          maxHeight: `${maxHeightPx}px`,
   114	          overflow: 'hidden',
   115	          backgroundColor: 'var(--em-bg-card)',
   116	          borderTopLeftRadius: 16,
   117	          borderTopRightRadius: 16,
   118	          boxShadow: 'var(--em-shadow-lg)',
   119	          transition: 'max-height 250ms ease-out',
   120	        }}
   121	        onClick={(e) => e.stopPropagation()}
   122	      >
   123	        <button
   124	          type="button"
   125	          onClick={() => setExpanded((v) => !v)}
   126	          className="sf-press flex items-center justify-center"
   127	          style={{ display: 'flex', width: '100%', height: HANDLE_PX }}
   128	          aria-label={expanded ? 'Collapse sheet' : 'Expand sheet'}
   129	        >
   130	          <span
   131	            style={{
   132	              width: 36, height: 4, borderRadius: 999,
   133	              backgroundColor: 'var(--em-border-default)',
   134	            }}
   135	          />
   136	        </button>
   137	        <div
   138	          className="overflow-y-auto px-4 pb-4"
   139	          style={{
   140	            maxHeight: `${contentMaxHeightPx}px`,
   141	            overscrollBehavior: 'contain',
   142	            WebkitOverflowScrolling: 'touch',
   143	          }}
   144	        >
   145	          {children}
   146	        </div>
   147	      </div>
   148	    </div>
   149	  );
   150	}
```

## src/components/shared/ConfirmDialog.jsx (96 lines)
```
     1	import { useEffect } from 'react';
     2	
     3	// Blocking confirm modal. Used for destructive actions (delete, cancel,
     4	// revoke) where we want a deliberate second tap before we commit.
     5	// `destructive` swaps the confirm button to the danger color — the default
     6	// is the regular accent for benign confirms.
     7	export default function ConfirmDialog({
     8	  open,
     9	  title,
    10	  message,
    11	  confirmLabel = 'Confirm',
    12	  cancelLabel = 'Cancel',
    13	  destructive = false,
    14	  onConfirm,
    15	  onCancel,
    16	}) {
    17	  useEffect(() => {
    18	    if (!open) return;
    19	    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    20	    window.addEventListener('keydown', onKey);
    21	    return () => window.removeEventListener('keydown', onKey);
    22	  }, [open, onCancel]);
    23	
    24	  if (!open) return null;
    25	
    26	  const confirmBg = destructive ? 'var(--em-danger)' : 'var(--em-accent)';
    27	
    28	  return (
    29	    <div
    30	      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    31	      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
    32	      onClick={onCancel}
    33	      role="dialog"
    34	      aria-modal="true"
    35	      aria-labelledby="confirm-title"
    36	    >
    37	      <div
    38	        className="sf-fade-in"
    39	        style={{
    40	          backgroundColor: 'var(--em-bg-card)',
    41	          borderRadius: 14,
    42	          padding: 20,
    43	          width: '100%',
    44	          maxWidth: 360,
    45	          boxShadow: 'var(--em-shadow-lg)',
    46	        }}
    47	        onClick={(e) => e.stopPropagation()}
    48	      >
    49	        {title && (
    50	          <h2
    51	            id="confirm-title"
    52	            className="font-semibold"
    53	            style={{ color: 'var(--em-text-primary)', fontSize: 17, marginBottom: 8 }}
    54	          >
    55	            {title}
    56	          </h2>
    57	        )}
    58	        {message && (
    59	          <p style={{ color: 'var(--em-text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
    60	            {message}
    61	          </p>
    62	        )}
    63	        <div className="flex gap-2 mt-5">
    64	          <button
    65	            type="button"
    66	            onClick={onCancel}
    67	            className="flex-1 font-medium sf-press"
    68	            style={{
    69	              minHeight: 44,
    70	              borderRadius: 10,
    71	              backgroundColor: 'var(--em-bg-secondary)',
    72	              color: 'var(--em-text-primary)',
    73	              fontSize: 15,
    74	            }}
    75	          >
    76	            {cancelLabel}
    77	          </button>
    78	          <button
    79	            type="button"
    80	            onClick={onConfirm}
    81	            className="flex-1 font-semibold sf-press"
    82	            style={{
    83	              minHeight: 44,
    84	              borderRadius: 10,
    85	              backgroundColor: confirmBg,
    86	              color: 'var(--em-text-inverse)',
    87	              fontSize: 15,
    88	            }}
    89	          >
    90	            {confirmLabel}
    91	          </button>
    92	        </div>
    93	      </div>
    94	    </div>
    95	  );
    96	}
```

## src/components/shared/EmptyState.jsx (39 lines)
```
     1	// Friendly empty-state block — used when a list query returns zero rows.
     2	// Icon is a Lucide component reference (not an element), so callers can
     3	// pass e.g. `icon={Calendar}` and we size/stroke it consistently here.
     4	
     5	export default function EmptyState({ icon: Icon, title, description, action }) {
     6	  return (
     7	    <div
     8	      className="flex flex-col items-center justify-center text-center px-6 py-12"
     9	      style={{ color: 'var(--em-text-secondary)' }}
    10	    >
    11	      {Icon && (
    12	        <div
    13	          className="flex items-center justify-center mb-4"
    14	          style={{
    15	            width: 56,
    16	            height: 56,
    17	            borderRadius: '50%',
    18	            backgroundColor: 'var(--em-bg-secondary)',
    19	            color: 'var(--em-text-tertiary)',
    20	          }}
    21	        >
    22	          <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
    23	        </div>
    24	      )}
    25	      {title && (
    26	        <div
    27	          className="font-semibold"
    28	          style={{ color: 'var(--em-text-primary)', fontSize: 16, marginBottom: 4 }}
    29	        >
    30	          {title}
    31	        </div>
    32	      )}
    33	      {description && (
    34	        <p style={{ fontSize: 14, maxWidth: 280, lineHeight: 1.5 }}>{description}</p>
    35	      )}
    36	      {action && <div className="mt-4">{action}</div>}
    37	    </div>
    38	  );
    39	}
```

## src/components/shared/FullScreenForm.jsx (61 lines)
```
     1	import { useEffect } from 'react';
     2	import { createPortal } from 'react-dom';
     3	
     4	export default function FullScreenForm({ open, onClose, title, children }) {
     5	  useEffect(() => {
     6	    if (!open) return;
     7	    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
     8	    window.addEventListener('keydown', onKey);
     9	    return () => window.removeEventListener('keydown', onKey);
    10	  }, [open, onClose]);
    11	
    12	  if (!open) return null;
    13	
    14	  return createPortal(
    15	    <div
    16	      className="sf-fade-in"
    17	      style={{
    18	        position: 'fixed',
    19	        top: 0, left: 0, right: 0, bottom: 0,
    20	        zIndex: 9999,
    21	        backgroundColor: 'var(--em-bg-page)',
    22	        display: 'flex',
    23	        flexDirection: 'column',
    24	        overflowX: 'hidden',
    25	      }}
    26	      role="dialog"
    27	      aria-modal="true"
    28	      aria-label={title}
    29	    >
    30	      <div style={{
    31	        display: 'flex',
    32	        alignItems: 'center',
    33	        justifyContent: 'space-between',
    34	        paddingTop: 'env(safe-area-inset-top, 0px)',
    35	        minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
    36	        paddingLeft: 16, paddingRight: 16,
    37	        backgroundColor: 'var(--em-bg-card)',
    38	        borderBottom: '1px solid var(--em-border-default)',
    39	        flexShrink: 0,
    40	      }}>
    41	        <button type="button" onClick={onClose} className="sf-press" style={{
    42	          minHeight: 44, padding: '0 8px', background: 'none', border: 'none',
    43	          color: 'var(--em-accent)', fontSize: 15, fontWeight: 500,
    44	        }}>Cancel</button>
    45	        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>
    46	          {title}
    47	        </span>
    48	        <div style={{ width: 60 }} />
    49	      </div>
    50	      <div style={{
    51	        flex: 1, overflowY: 'auto', overflowX: 'hidden',
    52	        overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch',
    53	        padding: 16,
    54	        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    55	      }}>
    56	        {children}
    57	      </div>
    58	    </div>,
    59	    document.body
    60	  );
    61	}
```

## src/components/shared/InstallPrompt.jsx (4 lines)
```
     1	// Intentionally disabled. PWA install is handled natively by the browser.
     2	export default function InstallPrompt() {
     3	  return null;
     4	}
```

## src/components/shared/LoadingSkeleton.jsx (72 lines)
```
     1	// Animated placeholder blocks shown while data loads. Variants cover the
     2	// three shapes we actually use — card (full-width block with inner rows),
     3	// list (horizontal row with avatar + text lines), text (a stack of lines).
     4	
     5	function Bar({ width = '100%', height = 12, radius = 6, className = '' }) {
     6	  return (
     7	    <div
     8	      className={`sf-pulse ${className}`}
     9	      style={{
    10	        width,
    11	        height,
    12	        borderRadius: radius,
    13	        backgroundColor: 'var(--em-bg-tertiary)',
    14	      }}
    15	    />
    16	  );
    17	}
    18	
    19	function Card() {
    20	  return (
    21	    <div
    22	      className="p-4 mb-3"
    23	      style={{
    24	        backgroundColor: 'var(--em-bg-card)',
    25	        borderRadius: 12,
    26	        border: '1px solid var(--em-border-subtle)',
    27	      }}
    28	    >
    29	      <Bar width="40%" height={10} className="mb-3" />
    30	      <Bar width="80%" height={16} className="mb-2" />
    31	      <Bar width="60%" height={12} />
    32	    </div>
    33	  );
    34	}
    35	
    36	function ListRow() {
    37	  return (
    38	    <div className="flex items-center gap-3 py-3">
    39	      <div
    40	        className="sf-pulse"
    41	        style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--em-bg-tertiary)' }}
    42	      />
    43	      <div className="flex-1">
    44	        <Bar width="60%" height={12} className="mb-2" />
    45	        <Bar width="40%" height={10} />
    46	      </div>
    47	    </div>
    48	  );
    49	}
    50	
    51	function TextBlock() {
    52	  return (
    53	    <div className="py-1">
    54	      <Bar width="90%" height={12} className="mb-2" />
    55	      <Bar width="75%" height={12} className="mb-2" />
    56	      <Bar width="50%" height={12} />
    57	    </div>
    58	  );
    59	}
    60	
    61	const VARIANTS = { card: Card, list: ListRow, text: TextBlock };
    62	
    63	export default function LoadingSkeleton({ variant = 'card', count = 3 }) {
    64	  const Cmp = VARIANTS[variant] || Card;
    65	  return (
    66	    <div aria-busy="true" aria-live="polite">
    67	      {Array.from({ length: count }).map((_, i) => (
    68	        <Cmp key={i} />
    69	      ))}
    70	    </div>
    71	  );
    72	}
```

## src/components/shared/TextEmptyState.jsx (21 lines)
```
     1	// Text-only empty state. Heading + message, centered, no illustration.
     2	// Spec: heading 17px/600 primary, message 14px tertiary.
     3	export default function TextEmptyState({ heading, message }) {
     4	  return (
     5	    <div style={{
     6	      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
     7	      textAlign: 'center', padding: '40px 16px', minHeight: 120,
     8	    }}>
     9	      {heading && (
    10	        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 6 }}>
    11	          {heading}
    12	        </div>
    13	      )}
    14	      {message && (
    15	        <div style={{ fontSize: 14, color: 'var(--em-text-tertiary)', maxWidth: 320, lineHeight: 1.5 }}>
    16	          {message}
    17	        </div>
    18	      )}
    19	    </div>
    20	  );
    21	}
```

## src/components/shared/Toast.jsx (47 lines)
```
     1	import { useEffect } from 'react';
     2	import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
     3	
     4	// One-off toast notification. Renders nothing if `message` is falsy so
     5	// parents can keep the component mounted and toggle it via a single
     6	// `setToast(null)` call.
     7	const VARIANT_META = {
     8	  success: { icon: CheckCircle2, bg: 'var(--em-success)',  fg: 'var(--em-text-inverse)' },
     9	  error:   { icon: AlertCircle,  bg: 'var(--em-danger)',   fg: 'var(--em-text-inverse)' },
    10	  info:    { icon: Info,         bg: 'var(--em-info)',     fg: 'var(--em-text-inverse)' },
    11	};
    12	
    13	export default function Toast({ message, variant = 'info', onDismiss, duration = 3000 }) {
    14	  useEffect(() => {
    15	    if (!message) return;
    16	    const id = setTimeout(() => onDismiss?.(), duration);
    17	    return () => clearTimeout(id);
    18	  }, [message, duration, onDismiss]);
    19	
    20	  if (!message) return null;
    21	  const meta = VARIANT_META[variant] || VARIANT_META.info;
    22	  const Icon = meta.icon;
    23	
    24	  return (
    25	    <div
    26	      className="fixed z-50 sf-toast-enter flex items-center gap-2"
    27	      role="status"
    28	      aria-live="polite"
    29	      style={{
    30	        bottom: 96, // clears bottom nav
    31	        left: '50%',
    32	        transform: 'translateX(-50%)',
    33	        backgroundColor: meta.bg,
    34	        color: meta.fg,
    35	        padding: '12px 16px',
    36	        borderRadius: 10,
    37	        boxShadow: 'var(--em-shadow-lg)',
    38	        maxWidth: 'calc(100% - 32px)',
    39	        fontSize: 14,
    40	        fontWeight: 500,
    41	      }}
    42	    >
    43	      <Icon size={20} strokeWidth={2} aria-hidden="true" />
    44	      <span>{message}</span>
    45	    </div>
    46	  );
    47	}
```

## src/components/shared/WelcomeOverlay.jsx (4 lines)
```
     1	// Intentionally disabled. Removed to reduce noise on login.
     2	export default function WelcomeOverlay() {
     3	  return null;
     4	}
```

## src/components/wizard/CreateActivityWizard.jsx (150 lines)
```
     1	import { createPortal } from 'react-dom';
     2	import { useState, useEffect } from 'react';
     3	import { ArrowLeft, X } from 'lucide-react';
     4	import { supabase } from '../../lib/supabase';
     5	import StepType from './StepType';
     6	import StepTeam from './StepTeam';
     7	import StepWhen from './StepWhen';
     8	import StepDetails from './StepDetails';
     9	import { EMPTY_FORM, eventToForm } from './wizardForm';
    10	import { useCreateActivity } from '../../hooks/useCreateActivity';
    11	import { useUpdateActivity } from '../../hooks/useUpdateActivity';
    12	import { useConflictCheck } from '../../hooks/useConflictCheck';
    13	
    14	const STEPS = ['Type', 'Team', 'When', 'Details'];
    15	const EDIT_STEPS = ['When', 'Details'];
    16	
    17	export default function CreateActivityWizard({ orgId, editEvent, editMode = 'single', onClose, onCreated }) {
    18	  const isEdit = !!editEvent;
    19	  const [step, setStep] = useState(isEdit ? 2 : 0);
    20	  const [form, setForm] = useState(isEdit ? eventToForm(editEvent) : EMPTY_FORM);
    21	  const conflicts = useConflictCheck(step, form, isEdit ? editEvent.id : null);
    22	  const { create, loading: creating } = useCreateActivity();
    23	  const { update, updateSeries, loading: updating } = useUpdateActivity();
    24	  const loading = creating || updating;
    25	
    26	  const selectType = (type) => { setForm((f) => ({ ...f, eventType: type })); setStep(1); };
    27	  const selectTeam = (id) => { setForm((f) => ({ ...f, teamId: id })); setStep(2); };
    28	
    29	  // On edit, load recurrence (pattern + until) from sibling dates.
    30	  useEffect(() => {
    31	    if (!isEdit || !editEvent?.parent_event_id) return;
    32	    supabase.from('events').select('start_at')
    33	      .eq('parent_event_id', editEvent.parent_event_id)
    34	      .order('start_at', { ascending: true })
    35	      .then(({ data }) => {
    36	        if (!data || data.length < 2) return;
    37	        const days = Math.round((new Date(data[1].start_at) - new Date(data[0].start_at)) / 86400000);
    38	        const pattern = days === 14 ? 'biweekly' : 'weekly';
    39	        const until = data[data.length - 1].start_at.slice(0, 10);
    40	        setForm((f) => ({ ...f, recurrence: { pattern, until } }));
    41	      });
    42	  }, [isEdit, editEvent?.parent_event_id]);
    43	
    44	  // On edit, load existing volunteer slots into the DutyEditor.
    45	  useEffect(() => {
    46	    if (!isEdit || !editEvent?.id) return;
    47	    supabase.from('event_duties').select('*').eq('event_id', editEvent.id)
    48	      .then(({ data }) => {
    49	        if (!data || data.length === 0) return;
    50	        const grouped = {};
    51	        data.forEach((d) => {
    52	          if (!grouped[d.duty_name]) grouped[d.duty_name] = { duty_name: d.duty_name, slots_needed: 0, claimed: 0 };
    53	          grouped[d.duty_name].slots_needed += 1;
    54	          if (d.claimed_by_name || d.guardian_id) grouped[d.duty_name].claimed += 1;
    55	        });
    56	        setForm((f) => ({ ...f, duties: Object.values(grouped) }));
    57	      });
    58	  }, [isEdit, editEvent?.id]);
    59	  const handleSave = async () => {
    60	    let result;
    61	    if (isEdit) {
    62	      result = editMode === 'series'
    63	        ? await updateSeries(editEvent.id, editEvent.parent_event_id, editEvent.start_at, form)
    64	        : await update(editEvent.id, form);
    65	    } else {
    66	      result = await create(form);
    67	    }
    68	    if (result?.data) { onCreated?.(); onClose(); }
    69	    else if (result?.error) { window.alert(`Save failed: ${result.error}`); }
    70	  };
    71	
    72	  const canNext = step === 2 ? (form.date && form.startTime && form.endTime) : true;
    73	  const backStop = isEdit ? 2 : 0;
    74	  const dots = isEdit ? EDIT_STEPS : STEPS;
    75	  const dotIndex = isEdit ? step - 2 : step;
    76	
    77	  return createPortal(
    78	    <div style={{
    79	      position: 'fixed', inset: 0, zIndex: 9999,
    80	      backgroundColor: 'var(--em-bg-page)',
    81	      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    82	    }}>
    83	      <div style={{
    84	        minHeight: 56, padding: '0 8px 0 4px',
    85	        display: 'flex', alignItems: 'center', gap: 8,
    86	        borderBottom: '1px solid var(--em-border-default)',
    87	        backgroundColor: 'var(--em-bg-card)', flexShrink: 0,
    88	        paddingTop: 'env(safe-area-inset-top, 0px)',
    89	      }}>
    90	        <button type="button" onClick={step > backStop ? () => setStep(step - 1) : onClose}
    91	          className="sf-press" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    92	          {step > backStop
    93	            ? <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-primary)" />
    94	            : <X size={20} strokeWidth={1.75} color="var(--em-text-primary)" />}
    95	        </button>
    96	        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', flex: 1 }}>
    97	          {isEdit ? 'Edit Event' : 'New Event'}
    98	        </span>
    99	        <div style={{ display: 'flex', gap: 6, paddingRight: 8 }}>
   100	          {dots.map((_, i) => (
   101	            <div key={i} style={{
   102	              width: 8, height: 8, borderRadius: 4,
   103	              backgroundColor: i <= dotIndex ? 'var(--em-accent)' : 'var(--em-border-default)',
   104	            }} />
   105	          ))}
   106	        </div>
   107	      </div>
   108	
   109	      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
   110	        {step === 0 && <StepType value={form.eventType} onSelect={selectType} />}
   111	        {step === 1 && <StepTeam orgId={orgId} value={form.teamId} onSelect={selectTeam} />}
   112	        {step === 2 && <StepWhen data={form} onChange={setForm} isEdit={isEdit} orgId={orgId} />}
   113	        {step === 3 && <StepDetails eventType={form.eventType} data={form} onChange={setForm} />}
   114	      </div>
   115	
   116	      {step === 2 && conflicts.length > 0 && (
   117	        <div style={{
   118	          padding: '10px 16px', backgroundColor: 'var(--em-warning-soft)',
   119	          borderTop: '1px solid var(--em-warning)', flexShrink: 0,
   120	          fontSize: 13, color: 'var(--em-warning)', fontWeight: 500,
   121	        }}>
   122	          Conflicts with: {conflicts.map((c) => c.title).join(', ')}. You can save anyway.
   123	        </div>
   124	      )}
   125	
   126	      {step >= 2 && (
   127	        <div style={{
   128	          padding: '12px 16px',
   129	          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
   130	          borderTop: '1px solid var(--em-border-default)',
   131	          backgroundColor: 'var(--em-bg-card)', flexShrink: 0,
   132	        }}>
   133	          <button type="button"
   134	            onClick={step === 3 ? handleSave : () => setStep(step + 1)}
   135	            disabled={loading || !canNext}
   136	            className="sf-press sf-bounce-tap"
   137	            style={{
   138	              width: '100%', minHeight: 48, borderRadius: 12, border: 'none',
   139	              backgroundColor: canNext ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
   140	              color: canNext ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)',
   141	              fontSize: 16, fontWeight: 600, opacity: loading ? 0.6 : 1,
   142	            }}>
   143	            {loading ? 'Saving...' : step === 3 ? (isEdit ? 'Save Changes' : 'Save Event') : 'Next'}
   144	          </button>
   145	        </div>
   146	      )}
   147	    </div>,
   148	    document.body
   149	  );
   150	}
```

## src/components/wizard/DutyEditor.jsx (72 lines)
```
     1	import { Plus, X } from 'lucide-react';
     2	
     3	// Inline duty list editor for StepDetails. Returns an array of
     4	// { name, slots_needed } to the parent form. Each duty will expand
     5	// into N per-slot rows in event_duties on save (CLAUDE.md §5).
     6	export default function DutyEditor({ value, onChange }) {
     7	  const duties = value || [];
     8	
     9	  const add = () => onChange([...duties, { duty_name: '', slots_needed: 1 }]);
    10	  const update = (i, patch) => onChange(duties.map((d, idx) => idx === i ? { ...d, ...patch } : d));
    11	  const remove = (i) => onChange(duties.filter((_, idx) => idx !== i));
    12	
    13	  return (
    14	    <div>
    15	      <span style={labelStyle}>Volunteers</span>
    16	      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
    17	        {duties.map((d, i) => (
    18	          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    19	            <input type="text" value={d.duty_name || d.name || ''}
    20	              onChange={(e) => update(i, { duty_name: e.target.value })}
    21	              placeholder="e.g. Scorekeeper" style={{ ...inputStyle, flex: 1 }} />
    22	            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    23	              <button type="button" disabled={(d.slots_needed || 1) <= 1}
    24	                onClick={() => update(i, { slots_needed: Math.max(1, (d.slots_needed || 1) - 1) })}
    25	                style={stepBtn}>−</button>
    26	              <span style={{ minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
    27	                {d.slots_needed || 1}
    28	              </span>
    29	              <button type="button"
    30	                onClick={() => update(i, { slots_needed: Math.min(10, (d.slots_needed || 1) + 1) })}
    31	                style={stepBtn}>+</button>
    32	            </div>
    33	            <button type="button" onClick={() => remove(i)} className="sf-press"
    34	              aria-label="Remove volunteer"
    35	              style={{
    36	                width: 40, height: 40, borderRadius: 10,
    37	                border: '1px solid var(--em-border-default)',
    38	                backgroundColor: 'var(--em-bg-card)', display: 'flex',
    39	                alignItems: 'center', justifyContent: 'center',
    40	              }}>
    41	              <X size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
    42	            </button>
    43	          </div>
    44	        ))}
    45	      </div>
    46	      <button type="button" onClick={add} className="sf-press"
    47	        style={{
    48	          marginTop: 8, minHeight: 40, padding: '0 14px', borderRadius: 10,
    49	          border: '1px solid var(--em-border-default)',
    50	          backgroundColor: 'var(--em-bg-card)',
    51	          color: 'var(--em-accent)', fontSize: 13, fontWeight: 500,
    52	          display: 'inline-flex', alignItems: 'center', gap: 6,
    53	        }}>
    54	        <Plus size={16} strokeWidth={1.75} /> Add volunteer
    55	      </button>
    56	    </div>
    57	  );
    58	}
    59	
    60	const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', display: 'block' };
    61	const inputStyle = {
    62	  minHeight: 40, borderRadius: 10, border: '1px solid var(--em-border-default)',
    63	  backgroundColor: 'var(--em-bg-card)', padding: '0 10px', fontSize: 14,
    64	  color: 'var(--em-text-primary)',
    65	};
    66	
    67	const stepBtn = {
    68	  width: 32, height: 32, borderRadius: 8,
    69	  border: '1px solid var(--em-border-default)',
    70	  backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
    71	  fontSize: 16, fontWeight: 500, cursor: 'pointer',
    72	};
```

## src/components/wizard/RecurrenceSelector.jsx (53 lines)
```
     1	const PATTERNS = [
     2	  { key: 'once', label: 'One time' },
     3	  { key: 'weekly', label: 'Weekly' },
     4	  { key: 'biweekly', label: 'Every 2 weeks' },
     5	];
     6	
     7	export default function RecurrenceSelector({ value, onChange }) {
     8	  const pattern = value?.pattern || 'once';
     9	  const until = value?.until || '';
    10	
    11	  const setPattern = (newPattern) => {
    12	    onChange({ pattern: newPattern, until: newPattern === 'once' ? null : until });
    13	  };
    14	
    15	  const setUntil = (newUntil) => onChange({ pattern, until: newUntil });
    16	
    17	  return (
    18	    <div>
    19	      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 6, display: 'block' }}>
    20	        Repeat
    21	      </span>
    22	      <div style={{ display: 'flex', gap: 8, marginBottom: pattern !== 'once' ? 12 : 0 }}>
    23	        {PATTERNS.map((p) => (
    24	          <button key={p.key} type="button" onClick={() => setPattern(p.key)}
    25	            className="sf-press" style={chipStyle(pattern === p.key)}>
    26	            {p.label}
    27	          </button>
    28	        ))}
    29	      </div>
    30	      {pattern !== 'once' && (
    31	        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    32	          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)' }}>Until</span>
    33	          <input type="date" value={until || ''} onChange={(e) => setUntil(e.target.value)}
    34	            style={inputStyle} />
    35	        </label>
    36	      )}
    37	    </div>
    38	  );
    39	}
    40	
    41	const chipStyle = (sel) => ({
    42	  flex: 1, minHeight: 40, borderRadius: 10,
    43	  border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
    44	  backgroundColor: sel ? 'var(--em-accent)' : 'var(--em-bg-card)',
    45	  color: sel ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
    46	  fontSize: 13, fontWeight: 500, padding: '0 12px',
    47	});
    48	
    49	const inputStyle = {
    50	  minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)',
    51	  backgroundColor: 'var(--em-bg-card)', padding: '0 12px', fontSize: 15,
    52	  color: 'var(--em-text-primary)', width: '100%',
    53	};
```

## src/components/wizard/StepDetails.jsx (116 lines)
```
     1	import DutyEditor from './DutyEditor';
     2	import { HOME_AWAY } from '../../lib/constants';
     3	
     4	export default function StepDetails({ eventType, data, onChange }) {
     5	  const set = (key, val) => onChange({ ...data, [key]: val });
     6	  const setHomeAway = (val) => {
     7	    onChange({
     8	      ...data,
     9	      homeAway: val,
    10	      jersey: val === 'home' ? 'Black' : val === 'away' ? 'White' : data.jersey,
    11	    });
    12	  };
    13	  const isGame = eventType === 'game' || eventType === 'tournament';
    14	
    15	  return (
    16	    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
    17	      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>Details</h2>
    18	
    19	      <label style={fieldStyle}>
    20	        <span style={labelStyle}>Title (optional)</span>
    21	        <input type="text" value={data.title || ''} onChange={(e) => set('title', e.target.value)}
    22	          placeholder={isGame ? 'vs. Storm AAU' : 'Practice'} style={inputStyle} />
    23	      </label>
    24	
    25	      {isGame && (
    26	        <label style={fieldStyle}>
    27	          <span style={labelStyle}>Opponent</span>
    28	          <input type="text" value={data.opponent || ''} onChange={(e) => set('opponent', e.target.value)}
    29	            placeholder="Enter opponent name" style={inputStyle} />
    30	        </label>
    31	      )}
    32	
    33	      {isGame && (
    34	        <div>
    35	          <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>Home / Away</span>
    36	          <div style={{ display: 'flex', gap: 8 }}>
    37	            {HOME_AWAY.map((v) => (
    38	              <button key={v} type="button" onClick={() => setHomeAway(v)}
    39	                className="sf-press" style={chipStyle(data.homeAway === v)}>
    40	                {v === 'tbd' ? 'TBD' : v.charAt(0).toUpperCase() + v.slice(1)}
    41	              </button>
    42	            ))}
    43	          </div>
    44	        </div>
    45	      )}
    46	
    47	      {isGame && (
    48	        <label style={fieldStyle}>
    49	          <span style={labelStyle}>Jersey color</span>
    50	          <input type="text" value={data.jersey || ''} onChange={(e) => set('jersey', e.target.value)}
    51	            placeholder="e.g. White home, Black away" style={inputStyle} />
    52	        </label>
    53	      )}
    54	
    55	      <label style={fieldStyle}>
    56	        <span style={labelStyle}>Parent instructions</span>
    57	        <textarea value={data.notes || ''} onChange={(e) => set('notes', e.target.value)}
    58	          placeholder="Visible to parents" rows={3}
    59	          style={{ ...inputStyle, minHeight: 80, padding: '10px 12px', resize: 'vertical' }} />
    60	      </label>
    61	
    62	      <label style={fieldStyle}>
    63	        <span style={labelStyle}>Coach notes</span>
    64	        <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: -4 }}>Not visible to parents</span>
    65	        <textarea value={data.coachNotes || ''} onChange={(e) => set('coachNotes', e.target.value)}
    66	          placeholder="Internal notes" rows={2}
    67	          style={{ ...inputStyle, minHeight: 60, padding: '10px 12px', resize: 'vertical' }} />
    68	      </label>
    69	
    70	      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    71	        <Toggle label="Indoor" checked={data.indoor ?? true} onChange={(v) => set('indoor', v)} />
    72	        <Toggle label="Enable rides" checked={data.enableRides || false} onChange={(v) => set('enableRides', v)} />
    73	        {isGame && <Toggle label="Scrimmage" checked={data.isScrimmage || false} onChange={(v) => set('isScrimmage', v)} />}
    74	      </div>
    75	
    76	      <DutyEditor value={data.duties} onChange={(duties) => set('duties', duties)} />
    77	    </div>
    78	  );
    79	}
    80	
    81	function Toggle({ label, checked, onChange }) {
    82	  return (
    83	    <div onClick={() => onChange(!checked)} style={{
    84	      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    85	      minHeight: 44, padding: '0 4px', cursor: 'pointer',
    86	    }}>
    87	      <span style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>{label}</span>
    88	      <div style={{
    89	        width: 48, height: 28, borderRadius: 14, padding: 2,
    90	        backgroundColor: checked ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
    91	        transition: 'background-color 0.2s', display: 'flex', alignItems: 'center',
    92	      }}>
    93	        <div style={{
    94	          width: 24, height: 24, borderRadius: 12, backgroundColor: 'var(--em-text-inverse)',
    95	          transform: checked ? 'translateX(20px)' : 'translateX(0)',
    96	          transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    97	        }} />
    98	      </div>
    99	    </div>
   100	  );
   101	}
   102	
   103	const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
   104	const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)' };
   105	const inputStyle = {
   106	  minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)',
   107	  backgroundColor: 'var(--em-bg-card)', padding: '0 12px', fontSize: 15,
   108	  color: 'var(--em-text-primary)', width: '100%',
   109	};
   110	const chipStyle = (sel) => ({
   111	  flex: 1, minHeight: 40, borderRadius: 10,
   112	  border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
   113	  backgroundColor: sel ? 'var(--em-accent)' : 'var(--em-bg-card)',
   114	  color: sel ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
   115	  fontSize: 13, fontWeight: 500,
   116	});
```

## src/components/wizard/StepTeam.jsx (53 lines)
```
     1	import { useEffect, useState } from 'react';
     2	import { supabase } from '../../lib/supabase';
     3	
     4	export default function StepTeam({ orgId, value, onSelect }) {
     5	  const [teams, setTeams] = useState([]);
     6	
     7	  useEffect(() => {
     8	    if (!orgId) return;
     9	    supabase
    10	      .from('teams')
    11	      .select('id, name, team_color, sort_order')
    12	      .eq('org_id', orgId)
    13	      .order('sort_order', { ascending: true })
    14	      .then(({ data }) => setTeams(data || []));
    15	  }, [orgId]);
    16	
    17	  return (
    18	    <div style={{ padding: '24px 16px' }}>
    19	      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 16 }}>
    20	        Which team?
    21	      </h2>
    22	      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    23	        {teams.map((t) => {
    24	          const sel = value === t.id;
    25	          return (
    26	            <button
    27	              key={t.id}
    28	              type="button"
    29	              onClick={() => onSelect(t.id)}
    30	              className="sf-press"
    31	              style={{
    32	                minHeight: 56, borderRadius: 12,
    33	                border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
    34	                backgroundColor: sel ? 'var(--em-bg-card-hover)' : 'var(--em-bg-card)',
    35	                padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12,
    36	                textAlign: 'left',
    37	              }}
    38	            >
    39	              <div style={{
    40	                width: 8, height: 32, borderRadius: 4,
    41	                backgroundColor: t.team_color, flexShrink: 0,
    42	              }} />
    43	              <span style={{ fontSize: 15, fontWeight: sel ? 600 : 500, color: 'var(--em-text-primary)' }}>
    44	                {t.name}
    45	              </span>
    46	              {sel && <span style={{ marginLeft: 'auto', color: 'var(--em-accent)', fontSize: 18 }}>✓</span>}
    47	            </button>
    48	          );
    49	        })}
    50	      </div>
    51	    </div>
    52	  );
    53	}
```

## src/components/wizard/StepType.jsx (46 lines)
```
     1	import { Trophy, Dumbbell, Target, Users, Medal, Calendar } from 'lucide-react';
     2	
     3	const TYPES = [
     4	  { key: 'practice', label: 'Practice', icon: Dumbbell, large: true },
     5	  { key: 'game', label: 'Game', icon: Trophy, large: true },
     6	  { key: 'skills_lab', label: 'Skills Lab', icon: Target },
     7	  { key: 'tryout', label: 'Tryout', icon: Users },
     8	  { key: 'tournament', label: 'Tournament', icon: Medal },
     9	  { key: 'other', label: 'Other', icon: Calendar },
    10	];
    11	
    12	export default function StepType({ value, onSelect }) {
    13	  return (
    14	    <div style={{ padding: '24px 16px' }}>
    15	      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 16 }}>
    16	        What type of event?
    17	      </h2>
    18	      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
    19	        {TYPES.map((t) => {
    20	          const Icon = t.icon;
    21	          const sel = value === t.key;
    22	          return (
    23	            <button
    24	              key={t.key}
    25	              type="button"
    26	              onClick={() => onSelect(t.key)}
    27	              className="sf-press"
    28	              style={{
    29	                minHeight: t.large ? 88 : 64,
    30	                borderRadius: 12,
    31	                border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
    32	                backgroundColor: sel ? 'var(--em-accent)' : 'var(--em-bg-card)',
    33	                color: sel ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
    34	                display: 'flex', flexDirection: 'column', alignItems: 'center',
    35	                justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 500,
    36	              }}
    37	            >
    38	              <Icon size={t.large ? 24 : 20} strokeWidth={1.75} />
    39	              {t.label}
    40	            </button>
    41	          );
    42	        })}
    43	      </div>
    44	    </div>
    45	  );
    46	}
```

## src/components/wizard/StepWhen.jsx (149 lines)
```
     1	import { useEffect, useState } from 'react';
     2	import { supabase } from '../../lib/supabase';
     3	import RecurrenceSelector from './RecurrenceSelector';
     4	import { useActiveSeasonEnd } from '../../hooks/useActiveSeasonEnd';
     5	import { computeDefaultUntil } from '../../lib/recurrenceHelpers';
     6	
     7	const DURATIONS = [
     8	  { label: '1h', minutes: 60 },
     9	  { label: '1.5h', minutes: 90 },
    10	  { label: '2h', minutes: 120 },
    11	];
    12	
    13	const ARRIVAL = [0, 5, 10, 15, 20, 30, 45, 60];
    14	
    15	function addMinutes(time, mins) {
    16	  const [h, m] = time.split(':').map(Number);
    17	  const total = h * 60 + m + mins;
    18	  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    19	}
    20	
    21	export default function StepWhen({ data, onChange, isEdit, orgId }) {
    22	  const [locations, setLocations] = useState([]);
    23	  const [customMode, setCustomMode] = useState(false);
    24	  const seasonEnd = useActiveSeasonEnd(orgId);
    25	
    26	  useEffect(() => {
    27	    let query = supabase.from('locations').select('name').order('name');
    28	    if (orgId) query = query.eq('org_id', orgId);
    29	    query.then(({ data: rows }) => {
    30	      setLocations((rows || []).map((r) => r.name));
    31	    });
    32	  }, [orgId]);
    33	
    34	  const set = (key, val) => onChange({ ...data, [key]: val });
    35	
    36	  // Default Until to last matching weekday before season_end on pick.
    37	  const setRecurrence = (r) => {
    38	    if (r.pattern !== 'once' && !r.until && data.date) {
    39	      const until = computeDefaultUntil(data.date, r.pattern, seasonEnd);
    40	      onChange({ ...data, recurrence: { pattern: r.pattern, until } });
    41	    } else {
    42	      onChange({ ...data, recurrence: r });
    43	    }
    44	  };
    45	
    46	  const setStartTime = (time) => {
    47	    const updates = { ...data, startTime: time };
    48	    if (data.durationMinutes) updates.endTime = addMinutes(time, data.durationMinutes);
    49	    onChange(updates);
    50	  };
    51	
    52	  const setDuration = (mins) => {
    53	    setCustomMode(false);
    54	    const updates = { ...data, durationMinutes: mins };
    55	    if (data.startTime) updates.endTime = addMinutes(data.startTime, mins);
    56	    onChange(updates);
    57	  };
    58	
    59	  const enterCustomMode = () => {
    60	    setCustomMode(true);
    61	    onChange({ ...data, durationMinutes: null });
    62	  };
    63	
    64	  const setCustomEndTime = (time) => {
    65	    onChange({ ...data, durationMinutes: null, endTime: time });
    66	  };
    67	
    68	  return (
    69	    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
    70	      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>When and where?</h2>
    71	
    72	      <label style={fieldStyle}>
    73	        <span style={labelStyle}>Date</span>
    74	        <input type="date" value={data.date || ''} onChange={(e) => set('date', e.target.value)} style={inputStyle} />
    75	      </label>
    76	
    77	      <RecurrenceSelector value={data.recurrence} onChange={setRecurrence} />
    78	
    79	      <label style={fieldStyle}>
    80	        <span style={labelStyle}>Start time</span>
    81	        <input type="time" value={data.startTime || ''} onChange={(e) => setStartTime(e.target.value)} step="300" style={inputStyle} />
    82	      </label>
    83	
    84	      <div>
    85	        <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>Duration</span>
    86	        <div style={{ display: 'flex', gap: 8 }}>
    87	          {DURATIONS.map((d) => (
    88	            <button key={d.minutes} type="button" onClick={() => setDuration(d.minutes)}
    89	              className="sf-press" style={chipStyle(!customMode && data.durationMinutes === d.minutes)}>
    90	              {d.label}
    91	            </button>
    92	          ))}
    93	          <button type="button" onClick={enterCustomMode}
    94	            className="sf-press" style={chipStyle(customMode)}>
    95	            Custom
    96	          </button>
    97	        </div>
    98	        {customMode ? (
    99	          <input type="time" value={data.endTime || ''}
   100	            onChange={(e) => setCustomEndTime(e.target.value)} step="300"
   101	            style={{ ...inputStyle, marginTop: 8 }} />
   102	        ) : (
   103	          data.endTime && <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 4, display: 'block' }}>Ends at {data.endTime}</span>
   104	        )}
   105	      </div>
   106	
   107	      <label style={fieldStyle}>
   108	        <span style={labelStyle}>Location</span>
   109	        <select value={data.location || ''} onChange={(e) => set('location', e.target.value)} style={inputStyle}>
   110	          <option value="">Select location</option>
   111	          {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
   112	        </select>
   113	      </label>
   114	
   115	      <label style={fieldStyle}>
   116	        <span style={labelStyle}>Court / room (optional)</span>
   117	        <input type="text" value={data.subLocation || ''} onChange={(e) => set('subLocation', e.target.value)}
   118	          placeholder="e.g. Court 3, Main Gym" style={inputStyle} />
   119	      </label>
   120	
   121	      <div>
   122	        <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>Arrive early</span>
   123	        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
   124	          {ARRIVAL.map((m) => (
   125	            <button key={m} type="button" onClick={() => set('arrivalMinutes', m)}
   126	              className="sf-press" style={chipStyle(data.arrivalMinutes === m)}>
   127	              {m === 0 ? 'On time' : `${m}m`}
   128	            </button>
   129	          ))}
   130	        </div>
   131	      </div>
   132	    </div>
   133	  );
   134	}
   135	
   136	const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
   137	const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)' };
   138	const inputStyle = {
   139	  minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)',
   140	  backgroundColor: 'var(--em-bg-card)', padding: '0 12px', fontSize: 15,
   141	  color: 'var(--em-text-primary)', width: '100%',
   142	};
   143	const chipStyle = (sel) => ({
   144	  minHeight: 40, minWidth: 56, borderRadius: 10,
   145	  border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
   146	  backgroundColor: sel ? 'var(--em-accent)' : 'var(--em-bg-card)',
   147	  color: sel ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
   148	  fontSize: 14, fontWeight: 500, padding: '0 12px',
   149	});
```

## src/components/wizard/wizardForm.js (47 lines)
```
     1	// Form-state shape helpers for CreateActivityWizard. Kept separate so
     2	// the wizard component stays under the 150-line ceiling.
     3	
     4	export const PRESET_DURATIONS = [60, 90, 120];
     5	
     6	export const EMPTY_FORM = {
     7	  eventType: null, teamId: null,
     8	  date: '', startTime: '', endTime: '', durationMinutes: null,
     9	  location: '', locationAddress: '', subLocation: '', arrivalMinutes: 5,
    10	  title: '', opponent: '', homeAway: 'tbd', jersey: '',
    11	  notes: '', coachNotes: '',
    12	  indoor: true, enableRides: false, isScrimmage: false,
    13	  recurrence: { pattern: 'once', until: null },
    14	  duties: [],
    15	};
    16	
    17	// Builds wizard form state from an existing event row. Splits the
    18	// timestamps back into date + HH:MM strings and detects whether the
    19	// duration matches a preset chip.
    20	export function eventToForm(event) {
    21	  const startAt = new Date(event.start_at);
    22	  const endAt = event.end_at ? new Date(event.end_at) : startAt;
    23	  const date = event.start_at.slice(0, 10);
    24	  const startTime = startAt.toTimeString().slice(0, 5);
    25	  const endTime = endAt.toTimeString().slice(0, 5);
    26	  const durationMinutes = Math.round((endAt - startAt) / 60000);
    27	  return {
    28	    eventType: event.event_type,
    29	    teamId: event.team_id,
    30	    date, startTime, endTime,
    31	    durationMinutes: PRESET_DURATIONS.includes(durationMinutes) ? durationMinutes : null,
    32	    location: event.location || '', locationAddress: event.location_address || '',
    33	    subLocation: event.sub_location || '',
    34	    arrivalMinutes: event.arrival_minutes_before ?? 5,
    35	    title: event.title || '',
    36	    opponent: event.opponent || '',
    37	    homeAway: event.home_away || 'tbd',
    38	    jersey: event.jersey || '',
    39	    notes: event.notes || '',
    40	    coachNotes: event.coach_notes || '',
    41	    indoor: event.indoor ?? true,
    42	    enableRides: event.enable_rides || false,
    43	    isScrimmage: event.is_scrimmage || false,
    44	    recurrence: { pattern: 'once', until: null },
    45	    duties: [],
    46	  };
    47	}
```

## src/context/AuthContext.jsx (150 lines)
```
     1	import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { autoLinkGuardian } from '../lib/autoLinkGuardian';
     4	import { fetchParentContext } from '../lib/parentContext';
     5	
     6	const AuthContext = createContext(null);
     7	
     8	// Skyfire platform defaults. Any brand_colors key that is missing on an org
     9	// falls back to the value here so the UI never renders without a token.
    10	const SKYFIRE_DEFAULTS = {
    11	  header:       '#151525',
    12	  accent:       '#C9952E',
    13	  accent_hover: '#D4A843',
    14	  accent_soft:  'rgba(201, 149, 46, 0.1)',
    15	  text_on_dark: '#F5F0E8',
    16	};
    17	
    18	// Mirror brand_colors onto --em-* CSS custom properties on <html>. Called on
    19	// login and whenever the auth listener fires — cheap, idempotent, and cleared
    20	// back to defaults on sign out.
    21	function applyBrandColors(brandColors) {
    22	  const c = brandColors || {};
    23	  const root = document.documentElement;
    24	  root.style.setProperty('--em-header',        c.header        || SKYFIRE_DEFAULTS.header);
    25	  root.style.setProperty('--em-accent',        c.accent        || SKYFIRE_DEFAULTS.accent);
    26	  root.style.setProperty('--em-accent-hover',  c.accent_hover  || SKYFIRE_DEFAULTS.accent_hover);
    27	  root.style.setProperty('--em-accent-soft',   c.accent_soft   || SKYFIRE_DEFAULTS.accent_soft);
    28	  root.style.setProperty('--em-text-on-dark',  c.text_on_dark  || SKYFIRE_DEFAULTS.text_on_dark);
    29	}
    30	
    31	export function AuthProvider({ children }) {
    32	  const [user, setUser]     = useState(null);
    33	  const [role, setRole]     = useState(null);
    34	  const [org,  setOrg]      = useState(null);
    35	  const [myChildren, setMyChildren] = useState([]);
    36	  const [myTeamIds, setMyTeamIdsRaw] = useState([]);
    37	  const [guardianId, setGuardianId] = useState(null);
    38	  const [guardianFirstName, setGuardianFirstName] = useState(null);
    39	  const [loading, setLoading] = useState(true);
    40	  const fetchIdRef = useRef(0);
    41	  const teamIdsKeyRef = useRef('');
    42	  const setMyTeamIds = useCallback((ids) => {
    43	    const k = [...(ids || [])].sort().join(',');
    44	    if (k !== teamIdsKeyRef.current) { teamIdsKeyRef.current = k; setMyTeamIdsRaw(ids || []); }
    45	  }, []);
    46	
    47	  // Load role + org for a given auth user. Uses a ref-based token to drop
    48	  // stale responses if auth state flips while a previous fetch is in flight.
    49	  const loadMembership = useCallback(async (authUser) => {
    50	    const id = ++fetchIdRef.current;
    51	    setLoading(true);
    52	    const { data, error } = await supabase
    53	      .from('user_roles')
    54	      .select('role, organization_id, organizations(id, name, slug, logo_url, brand_colors)')
    55	      .eq('user_id', authUser.id)
    56	      .maybeSingle();
    57	    if (id !== fetchIdRef.current) return;
    58	
    59	    let resolvedRole = null;
    60	    let resolvedOrg = null;
    61	    if (error) {
    62	      console.error('Failed to load membership:', error.message);
    63	    } else if (data) {
    64	      resolvedRole = data.role ?? null;
    65	      resolvedOrg = data.organizations ?? null;
    66	    } else {
    67	      const linked = await autoLinkGuardian(authUser);
    68	      if (id !== fetchIdRef.current) return;
    69	      resolvedRole = linked?.role ?? null;
    70	      resolvedOrg = linked?.organization ?? null;
    71	    }
    72	    setRole(resolvedRole);
    73	    setOrg(resolvedOrg);
    74	    applyBrandColors(resolvedOrg?.brand_colors);
    75	
    76	    if (resolvedRole === 'parent') {
    77	      const ctx = await fetchParentContext(authUser.id);
    78	      if (id !== fetchIdRef.current) return;
    79	      setMyChildren(ctx.myChildren); setMyTeamIds(ctx.myTeamIds); setGuardianId(ctx.guardianId);
    80	      setGuardianFirstName(ctx.guardianFirstName ?? null);
    81	    } else {
    82	      setMyChildren([]); setMyTeamIds([]); setGuardianId(null); setGuardianFirstName(null);
    83	    }
    84	    setLoading(false);
    85	  }, []);
    86	
    87	  useEffect(() => {
    88	    supabase.auth.getSession().then(({ data: { session } }) => {
    89	      setUser(session?.user ?? null);
    90	      if (session?.user) loadMembership(session.user);
    91	      else setLoading(false);
    92	    });
    93	
    94	    const { data: { subscription } } = supabase.auth.onAuthStateChange(
    95	      (_event, session) => {
    96	        setUser(session?.user ?? null);
    97	        if (session?.user) loadMembership(session.user);
    98	        else {
    99	          setRole(null); setOrg(null);
   100	          setMyChildren([]); setMyTeamIds([]); setGuardianId(null); setGuardianFirstName(null);
   101	          applyBrandColors(null); setLoading(false);
   102	        }
   103	      }
   104	    );
   105	    return () => subscription.unsubscribe();
   106	  }, [loadMembership]);
   107	
   108	  const signIn = useCallback(async (email, password) => {
   109	    const { error } = await supabase.auth.signInWithPassword({
   110	      email: email.trim(),
   111	      password,
   112	    });
   113	    return { error };
   114	  }, []);
   115	
   116	  const signOut = useCallback(async () => {
   117	    try { await supabase.auth.signOut(); }
   118	    catch (err) { console.error('Sign out failed:', err); }
   119	    setUser(null); setRole(null); setOrg(null);
   120	    setMyChildren([]); setMyTeamIds([]); setGuardianId(null); setGuardianFirstName(null);
   121	    applyBrandColors(null);
   122	  }, []);
   123	
   124	  const value = useMemo(
   125	    () => ({
   126	      user,
   127	      role,
   128	      orgId: org?.id ?? null,
   129	      orgName: org?.name ?? null,
   130	      org,
   131	      myChildren,
   132	      myTeamIds,
   133	      guardianId,
   134	      guardianFirstName,
   135	      loading,
   136	      signIn,
   137	      signOut,
   138	    }),
   139	    [user, role, org, myChildren, myTeamIds, guardianId, guardianFirstName, loading, signIn, signOut],
   140	  );
   141	
   142	  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
   143	}
   144	
   145	// eslint-disable-next-line react-refresh/only-export-components
   146	export function useAuth() {
   147	  const ctx = useContext(AuthContext);
   148	  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
   149	  return ctx;
   150	}
```

## src/context/SeasonContext.jsx (79 lines)
```
     1	import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { useAuth } from './AuthContext';
     4	
     5	const SeasonContext = createContext(null);
     6	
     7	// Loads every season for the current org and picks the active one by default.
     8	// The season list is small (a handful of rows per org) so we cache it in
     9	// memory and never refetch until the org changes.
    10	export function SeasonProvider({ children }) {
    11	  const { orgId } = useAuth();
    12	  const [seasons, setSeasons] = useState([]);
    13	  const [activeSeasonId, setActiveSeasonId] = useState(null);
    14	  const [loading, setLoading] = useState(true);
    15	
    16	  useEffect(() => {
    17	    let cancelled = false;
    18	    // Wrapping in Promise.resolve() kicks all setState calls into the
    19	    // microtask queue, which keeps react-hooks/set-state-in-effect happy —
    20	    // the rule only flags setters run synchronously from the effect body.
    21	    Promise.resolve().then(async () => {
    22	      if (cancelled) return;
    23	      if (!orgId) {
    24	        // Deliberately do NOT call setLoading(false) here. If orgId
    25	        // hasn't resolved yet (initial mount before auth finishes),
    26	        // consumers should still observe loading=true so they know the
    27	        // season data isn't authoritative yet. Setting loading=false
    28	        // here used to cause useAdminStats to see seasonsLoading=false
    29	        // the instant auth resolved — but before the seasons fetch had
    30	        // even started — which flashed a premature "0" on the KPI
    31	        // cards. We still clear any stale rows so a sign-out doesn't
    32	        // leak the previous org's data.
    33	        setSeasons([]);
    34	        setActiveSeasonId(null);
    35	        return;
    36	      }
    37	      setLoading(true);
    38	      const { data, error } = await supabase
    39	        .from('seasons')
    40	        .select('id, name, start_date, end_date, status')
    41	        .eq('org_id', orgId)
    42	        .order('start_date', { ascending: false });
    43	      if (cancelled) return;
    44	      if (error) {
    45	        console.error('Failed to load seasons:', error.message);
    46	        setSeasons([]);
    47	        setActiveSeasonId(null);
    48	      } else {
    49	        const rows = data ?? [];
    50	        setSeasons(rows);
    51	        const active = rows.find((s) => s.status === 'active');
    52	        setActiveSeasonId(active?.id ?? rows[0]?.id ?? null);
    53	      }
    54	      setLoading(false);
    55	    });
    56	    return () => { cancelled = true; };
    57	  }, [orgId]);
    58	
    59	  const setSeason = useCallback((id) => setActiveSeasonId(id), []);
    60	
    61	  const activeSeason = useMemo(
    62	    () => seasons.find((s) => s.id === activeSeasonId) ?? null,
    63	    [seasons, activeSeasonId],
    64	  );
    65	
    66	  const value = useMemo(
    67	    () => ({ activeSeason, seasons, setSeason, loading }),
    68	    [activeSeason, seasons, setSeason, loading],
    69	  );
    70	
    71	  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
    72	}
    73	
    74	// eslint-disable-next-line react-refresh/only-export-components
    75	export function useSeason() {
    76	  const ctx = useContext(SeasonContext);
    77	  if (!ctx) throw new Error('useSeason must be used within SeasonProvider');
    78	  return ctx;
    79	}
```

## src/context/ToastContext.jsx (82 lines)
```
     1	import { createContext, useCallback, useContext, useState } from 'react';
     2	
     3	const ToastContext = createContext(null);
     4	
     5	export function ToastProvider({ children }) {
     6	  const [toast, setToast] = useState(null);
     7	
     8	  const showToast = useCallback((message, variant = 'success', onUndo) => {
     9	    setToast({ message, variant, onUndo });
    10	  }, []);
    11	
    12	  const dismiss = useCallback(() => setToast(null), []);
    13	
    14	  return (
    15	    <ToastContext.Provider value={{ showToast }}>
    16	      {children}
    17	      {toast && (
    18	        <div style={{
    19	          position: 'fixed',
    20	          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)',
    21	          left: 16, right: 16,
    22	          zIndex: 10000,
    23	          display: 'flex',
    24	          justifyContent: 'center',
    25	        }}>
    26	          <div
    27	            style={{
    28	              display: 'flex',
    29	              alignItems: 'center',
    30	              gap: 12,
    31	              padding: '12px 16px',
    32	              borderRadius: 10,
    33	              backgroundColor: toast.variant === 'error' ? 'var(--em-danger)' : toast.variant === 'success' ? 'var(--em-success)' : 'var(--em-info)',
    34	              color: 'var(--em-text-inverse)',
    35	              fontSize: 14,
    36	              fontWeight: 500,
    37	              boxShadow: 'var(--em-shadow-lg)',
    38	              maxWidth: 400,
    39	              width: '100%',
    40	            }}
    41	          >
    42	            <span style={{ flex: 1 }}>{toast.message}</span>
    43	            {toast.onUndo && (
    44	              <button
    45	                type="button"
    46	                onClick={() => { toast.onUndo(); dismiss(); }}
    47	                style={{
    48	                  background: 'none', border: 'none',
    49	                  color: 'var(--em-text-inverse)',
    50	                  fontSize: 14, fontWeight: 700,
    51	                  textDecoration: 'underline',
    52	                  padding: '4px 8px',
    53	                  minHeight: 36,
    54	                }}
    55	              >
    56	                Undo
    57	              </button>
    58	            )}
    59	            <button
    60	              type="button"
    61	              onClick={dismiss}
    62	              style={{
    63	                background: 'none', border: 'none',
    64	                color: 'rgba(255,255,255,0.7)',
    65	                fontSize: 18, padding: '4px 4px', minHeight: 36,
    66	              }}
    67	              aria-label="Dismiss"
    68	            >
    69	              ×
    70	            </button>
    71	          </div>
    72	        </div>
    73	      )}
    74	    </ToastContext.Provider>
    75	  );
    76	}
    77	
    78	export function useToast() {
    79	  const ctx = useContext(ToastContext);
    80	  if (!ctx) throw new Error('useToast must be inside ToastProvider');
    81	  return ctx;
    82	}
```

## src/hooks/seriesReconcile.js (80 lines)
```
     1	import { supabase } from '../lib/supabase';
     2	
     3	// Generate sibling date rows from (startDate + step) to until.
     4	function buildSiblingRows(startDate, until, step, row, parentId, formData) {
     5	  const cursor = new Date(`${startDate}T00:00:00`);
     6	  cursor.setDate(cursor.getDate() + step);
     7	  const bound = new Date(`${until}T00:00:00`);
     8	  const rows = [];
     9	  while (cursor <= bound && rows.length < 100) {
    10	    const d = cursor.toISOString().slice(0, 10);
    11	    const sAt = new Date(`${d}T${formData.startTime}`);
    12	    const eAt = new Date(`${d}T${formData.endTime}`);
    13	    if (eAt <= sAt) eAt.setDate(eAt.getDate() + 1);
    14	    rows.push({ ...row, start_at: sAt.toISOString(), end_at: eAt.toISOString(), parent_event_id: parentId });
    15	    cursor.setDate(cursor.getDate() + step);
    16	  }
    17	  return rows;
    18	}
    19	
    20	// Convert a standalone event to a recurring series.
    21	// Called from update() when the user changes Once → Weekly/Biweekly.
    22	export async function convertToSeries({ eventId, formData, row }) {
    23	  const pattern = formData.recurrence?.pattern;
    24	  const until = formData.recurrence?.until;
    25	  if (!pattern || pattern === 'once' || !until || !formData.date) return;
    26	
    27	  // Self-reference so the repeat icon shows on the original event too.
    28	  await supabase.from('events').update({ parent_event_id: eventId }).eq('id', eventId);
    29	
    30	  const step = pattern === 'biweekly' ? 14 : 7;
    31	  const baseRow = { ...row };
    32	  delete baseRow.start_at; delete baseRow.end_at;
    33	  const newRows = buildSiblingRows(formData.date, until, step, baseRow, eventId, formData);
    34	  if (newRows.length === 0) return;
    35	
    36	  const { data: sibData, error: sibErr } = await supabase.from('events').insert(newRows).select('id');
    37	  if (sibErr) throw sibErr;
    38	
    39	  // Copy duties to each sibling (same pattern as useCreateActivity).
    40	  const duties = (formData.duties || []).filter((d) => d.duty_name?.trim() || d.name?.trim());
    41	  if (duties.length > 0) {
    42	    const dutyRows = [];
    43	    (sibData || []).forEach((s) => {
    44	      duties.forEach((d) => {
    45	        const label = (d.duty_name || d.name).trim();
    46	        for (let i = 0; i < (d.slots_needed || 1); i++) dutyRows.push({ event_id: s.id, duty_name: label });
    47	      });
    48	    });
    49	    if (dutyRows.length > 0) await supabase.from('event_duties').insert(dutyRows);
    50	  }
    51	}
    52	
    53	// Delete future siblings and rebuild with the current pattern + until.
    54	// Handles pattern changes (weekly ↔ biweekly), until extensions, until
    55	// trims, and all three at once. Past siblings (before the edited event)
    56	// are preserved. The edited event itself is always kept.
    57	export async function reconcileSeries({ seriesId, eventId, formData, row }) {
    58	  const newUntil = formData.recurrence?.until;
    59	  const pattern = formData.recurrence?.pattern;
    60	  if (!newUntil || pattern === 'once') return;
    61	
    62	  const startDate = formData.date;
    63	  const step = pattern === 'biweekly' ? 14 : 7;
    64	
    65	  // Delete future siblings (on or after edited event), keeping the edited event.
    66	  const { data: futureSibs } = await supabase.from('events')
    67	    .select('id')
    68	    .eq('parent_event_id', seriesId)
    69	    .gte('start_at', `${startDate}T00:00:00`)
    70	    .neq('id', eventId);
    71	  if (futureSibs?.length > 0) {
    72	    await supabase.from('events').delete().in('id', futureSibs.map((s) => s.id));
    73	  }
    74	
    75	  // Rebuild from (startDate + step) to newUntil with the current pattern.
    76	  const newRows = buildSiblingRows(startDate, newUntil, step, row, seriesId, formData);
    77	  if (newRows.length > 0) {
    78	    await supabase.from('events').insert(newRows);
    79	  }
    80	}
```

## src/hooks/useActiveSeasonEnd.js (17 lines)
```
     1	import { useState, useEffect } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	// Returns the end_date (YYYY-MM-DD) of the org's active season, or
     5	// null while loading / if none exists. Used by StepWhen to default
     6	// the Until date on recurring events.
     7	export function useActiveSeasonEnd(orgId) {
     8	  const [seasonEnd, setSeasonEnd] = useState(null);
     9	  useEffect(() => {
    10	    if (!orgId) return;
    11	    supabase.from('seasons').select('end_date').eq('org_id', orgId).eq('status', 'active').limit(1)
    12	      .then(({ data }) => {
    13	        if (data?.[0]?.end_date) setSeasonEnd(data[0].end_date);
    14	      });
    15	  }, [orgId]);
    16	  return seasonEnd;
    17	}
```

## src/hooks/useActivities.js (65 lines)
```
     1	import { useCallback, useEffect, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { useAuth } from '../context/AuthContext';
     4	import { useSeason } from '../context/SeasonContext';
     5	
     6	// Module-level cache. Keyed by (orgId, seasonId, role, myTeamIds) so that
     7	// navigating between Home / Schedule / Event Detail doesn't refetch on
     8	// every mount. Second mount reads the cache instantly and refetches
     9	// silently in the background.
    10	const cache = { key: null, data: null };
    11	
    12	const buildKey = (orgId, seasonId, role, myTeamIds) =>
    13	  `${orgId || ''}:${seasonId || ''}:${role || ''}:${(myTeamIds || []).join(',')}`;
    14	
    15	// Queries the events table and normalizes columns for downstream
    16	// components. The DB stores a single `start_at` timestamptz; we split
    17	// it into `date` (YYYY-MM-DD) and `start_time` (HH:MM) so DayStrip,
    18	// EventCard, CompactCard, and CountdownBanner can use simple strings.
    19	// `location` is aliased to `location_name` for the same reason.
    20	export function useActivities() {
    21	  const { orgId, role, myTeamIds } = useAuth();
    22	  const { activeSeason } = useSeason();
    23	  const seasonId = activeSeason?.id ?? null;
    24	  const key = buildKey(orgId, seasonId, role, myTeamIds);
    25	  const hasCached = cache.key === key && cache.data;
    26	  const [activities, setActivities] = useState(() => hasCached ? cache.data : []);
    27	  const [loading, setLoading] = useState(() => !hasCached);
    28	
    29	  const refetch = useCallback(async () => {
    30	    if (!orgId) { setLoading(false); return; }
    31	    if (role === 'parent' && (!myTeamIds || myTeamIds.length === 0)) {
    32	      cache.key = key; cache.data = [];
    33	      setActivities([]); setLoading(false); return;
    34	    }
    35	    try {
    36	      let query = supabase
    37	        .from('events')
    38	        .select('*, teams!inner(id, name, team_color, age_group, circuit, org_id, season_id, sort_order)')
    39	        .eq('teams.org_id', orgId)
    40	        .order('start_at', { ascending: true });
    41	      if (seasonId) query = query.eq('teams.season_id', seasonId);
    42	      if (role === 'parent' && myTeamIds?.length) query = query.in('team_id', myTeamIds);
    43	      const { data, error } = await query;
    44	      if (error) throw error;
    45	      const processed = (data || []).map((e) => ({
    46	        ...e,
    47	        date: e.start_at ? e.start_at.slice(0, 10) : null,
    48	        start_time: e.start_at ? new Date(e.start_at).toTimeString().slice(0, 5) : null,
    49	        location_name: e.location || null,
    50	      }));
    51	      cache.key = key; cache.data = processed;
    52	      setActivities(processed);
    53	    } catch (err) {
    54	      console.error('useActivities:', err.message);
    55	      setActivities([]);
    56	    }
    57	    setLoading(false);
    58	  }, [orgId, seasonId, role, myTeamIds, key]);
    59	
    60	  useEffect(() => {
    61	    Promise.resolve().then(refetch);
    62	  }, [refetch]);
    63	
    64	  return { activities, loading, refetch };
    65	}
```

## src/hooks/useAdminStats.js (90 lines)
```
     1	import { useEffect, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { useAuth } from '../context/AuthContext';
     4	import { useSeason } from '../context/SeasonContext';
     5	
     6	// Counts for the admin dashboard KPI grid. Each count is wrapped in its
     7	// own try/catch so one missing table doesn't take the whole grid down —
     8	// if `roster_members` or `events` isn't provisioned yet the card just shows 0.
     9	// Payment totals are hard-coded to 0 until the billing schema lands.
    10	//
    11	// Loading discipline: `loading: false` is ONLY ever written from the
    12	// single setStats at the end of a completed fetch. No early-return
    13	// paths write state. If orgId or seasonsLoading aren't settled yet, the
    14	// effect bails without touching state and the hook stays on its initial
    15	// `loading: true`. This is what prevents the KPI Events card from
    16	// flashing "0" on hard refresh while the season data is still in
    17	// flight.
    18	const SAFE = async (fn) => {
    19	  try { return await fn(); }
    20	  catch { return 0; }
    21	};
    22	
    23	const INITIAL = {
    24	  players: 0,
    25	  events: 0,
    26	  collected: 0,
    27	  outstanding: 0,
    28	  loading: true,
    29	};
    30	
    31	export function useAdminStats() {
    32	  const { orgId } = useAuth();
    33	  const { activeSeason, loading: seasonsLoading } = useSeason();
    34	  const seasonId = activeSeason?.id ?? null;
    35	
    36	  const [stats, setStats] = useState(INITIAL);
    37	
    38	  useEffect(() => {
    39	    // Wait for auth AND season context to settle before doing anything.
    40	    // The effect re-fires when either dep changes, so we'll come back
    41	    // here once they're ready. Critically: no state mutation in these
    42	    // bail paths — the hook stays on loading=true.
    43	    if (!orgId || seasonsLoading) return undefined;
    44	
    45	    let cancelled = false;
    46	    Promise.resolve().then(async () => {
    47	      if (cancelled) return;
    48	
    49	      // Team IDs for the active season scope every subsequent count.
    50	      // When there's no active season (seasonId null but seasonsLoading
    51	      // is already false), we skip this fetch and teamIds stays empty,
    52	      // which naturally drives both counts to 0 in SAFE() below.
    53	      let teamIds = [];
    54	      if (seasonId) {
    55	        const { data } = await supabase
    56	          .from('teams')
    57	          .select('id')
    58	          .eq('org_id', orgId)
    59	          .eq('season_id', seasonId);
    60	        teamIds = (data ?? []).map((t) => t.id);
    61	      }
    62	
    63	      const players = await SAFE(async () => {
    64	        if (teamIds.length === 0) return 0;
    65	        const { count } = await supabase
    66	          .from('roster_members')
    67	          .select('id', { count: 'exact', head: true })
    68	          .in('team_id', teamIds);
    69	        return count ?? 0;
    70	      });
    71	
    72	      const events = await SAFE(async () => {
    73	        if (teamIds.length === 0) return 0;
    74	        const { count } = await supabase
    75	          .from('events')
    76	          .select('id', { count: 'exact', head: true })
    77	          .in('team_id', teamIds);
    78	        return count ?? 0;
    79	      });
    80	
    81	      if (cancelled) return;
    82	      // Single authoritative write. loading: false only gets set HERE.
    83	      setStats({ players, events, collected: 0, outstanding: 0, loading: false });
    84	    });
    85	
    86	    return () => { cancelled = true; };
    87	  }, [orgId, seasonId, seasonsLoading]);
    88	
    89	  return stats;
    90	}
```

## src/hooks/useCheckIns.js (37 lines)
```
     1	import { useCallback, useEffect, useRef, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	// Fetches check-in rows for an event and exposes a toggle(playerId)
     5	// that upserts true/false on the (event_id, player_id) unique pair.
     6	// Requires a unique constraint on (event_id, player_id) for upsert
     7	// to work — see Supabase schema.
     8	export function useCheckIns(eventId) {
     9	  const [checkIns, setCheckIns] = useState([]);
    10	  const [loading, setLoading] = useState(true);
    11	  const didInitialLoad = useRef(false);
    12	
    13	  const fetch = useCallback(async () => {
    14	    if (!eventId) { setLoading(false); return; }
    15	    if (!didInitialLoad.current) setLoading(true);
    16	    const { data, error } = await supabase
    17	      .from('check_ins').select('*').eq('event_id', eventId);
    18	    if (error) console.error('useCheckIns:', error.message);
    19	    setCheckIns(data || []);
    20	    didInitialLoad.current = true;
    21	    setLoading(false);
    22	  }, [eventId]);
    23	
    24	  useEffect(() => { fetch(); }, [fetch]);
    25	
    26	  const toggle = async (playerId, current) => {
    27	    const next = !current;
    28	    const { error } = await supabase.from('check_ins').upsert(
    29	      { event_id: eventId, player_id: playerId, checked_in: next, checked_in_at: new Date().toISOString() },
    30	      { onConflict: 'event_id,player_id' }
    31	    );
    32	    if (error) { console.error('check_in toggle:', error.message); return; }
    33	    await fetch();
    34	  };
    35	
    36	  return { checkIns, loading, toggle, refetch: fetch };
    37	}
```

## src/hooks/useComments.js (44 lines)
```
     1	import { useCallback, useEffect, useRef, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { useAuth } from '../context/AuthContext';
     4	
     5	// Fetches event_comments for an event and exposes post(body). Sorted
     6	// by pinned first, then created_at ascending (oldest first) so the
     7	// thread reads top-down like a chat.
     8	export function useComments(eventId) {
     9	  const { user } = useAuth();
    10	  const [comments, setComments] = useState([]);
    11	  const [loading, setLoading] = useState(true);
    12	  const didInitialLoad = useRef(false);
    13	
    14	  const fetch = useCallback(async () => {
    15	    if (!eventId) { setLoading(false); return; }
    16	    if (!didInitialLoad.current) setLoading(true);
    17	    const { data, error } = await supabase
    18	      .from('event_comments').select('*').eq('event_id', eventId)
    19	      .order('pinned', { ascending: false, nullsFirst: false })
    20	      .order('created_at', { ascending: true });
    21	    if (error) console.error('useComments:', error.message);
    22	    setComments(data || []);
    23	    didInitialLoad.current = true;
    24	    setLoading(false);
    25	  }, [eventId]);
    26	
    27	  useEffect(() => { fetch(); }, [fetch]);
    28	
    29	  const post = async (body) => {
    30	    const trimmed = body.trim();
    31	    if (!trimmed) return;
    32	    const authorName = user?.user_metadata?.full_name || user?.email || 'User';
    33	    const { error } = await supabase.from('event_comments').insert({
    34	      event_id: eventId,
    35	      body: trimmed,
    36	      author_user_id: user.id,
    37	      author_name: authorName,
    38	    });
    39	    if (error) { console.error('post comment:', error.message); return; }
    40	    await fetch();
    41	  };
    42	
    43	  return { comments, loading, post, refetch: fetch };
    44	}
```

## src/hooks/useConflictCheck.js (33 lines)
```
     1	import { useEffect, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	// Finds events that would overlap a proposed new event. Only runs
     5	// when on the When step and the team/date/times are all filled.
     6	// `excludeEventId` skips self-collision when editing an existing event.
     7	export function useConflictCheck(step, form, excludeEventId) {
     8	  const [conflicts, setConflicts] = useState([]);
     9	
    10	  useEffect(() => {
    11	    if (step !== 2 || !form.teamId || !form.date || !form.startTime || !form.endTime) {
    12	      setConflicts([]); return;
    13	    }
    14	    const newStart = new Date(`${form.date}T${form.startTime}`);
    15	    const newEnd = new Date(`${form.date}T${form.endTime}`);
    16	    supabase
    17	      .from('events')
    18	      .select('id, title, start_at, end_at')
    19	      .eq('team_id', form.teamId)
    20	      .gte('start_at', `${form.date}T00:00:00`)
    21	      .lte('start_at', `${form.date}T23:59:59`)
    22	      .then(({ data }) => {
    23	        setConflicts((data || []).filter((e) => {
    24	          if (excludeEventId && e.id === excludeEventId) return false;
    25	          const es = new Date(e.start_at);
    26	          const ee = e.end_at ? new Date(e.end_at) : es;
    27	          return !(newEnd <= es || newStart >= ee);
    28	        }));
    29	      });
    30	  }, [step, form.teamId, form.date, form.startTime, form.endTime, excludeEventId]);
    31	
    32	  return conflicts;
    33	}
```

## src/hooks/useCreateActivity.js (140 lines)
```
     1	import { useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { computeDefaultUntil } from '../lib/recurrenceHelpers';
     4	import { buildTitle } from '../lib/constants';
     5	
     6	export function useCreateActivity() {
     7	  const [loading, setLoading] = useState(false);
     8	  const [error, setError] = useState(null);
     9	
    10	  const create = async (formData) => {
    11	    setLoading(true);
    12	    setError(null);
    13	    try {
    14	      const baseRow = {
    15	        team_id: formData.teamId,
    16	        event_type: formData.eventType,
    17	        title: formData.title || buildTitle(formData.eventType, formData.opponent),
    18	        location: formData.location || null,
    19	        location_address: formData.locationAddress || null,
    20	        sub_location: formData.subLocation || null,
    21	        opponent: formData.opponent || null,
    22	        home_away: formData.homeAway || 'tbd',
    23	        is_scrimmage: formData.isScrimmage || false,
    24	        notes: formData.notes || null,
    25	        coach_notes: formData.coachNotes || null,
    26	        jersey: formData.jersey || null,
    27	        indoor: formData.indoor ?? true,
    28	        enable_rides: formData.enableRides || false,
    29	        arrival_minutes_before: formData.arrivalMinutes ?? 5,
    30	        status: 'scheduled',
    31	      };
    32	
    33	      const pattern = formData.recurrence?.pattern || 'once';
    34	      // Safety net: if UI didn't set a recurrence.until, fetch season
    35	      // end via team → season and default to last-weekday-before-end.
    36	      let safeForm = formData;
    37	      if (pattern !== 'once' && !formData.recurrence?.until && formData.teamId && formData.date) {
    38	        const { data: team } = await supabase.from('teams').select('season_id').eq('id', formData.teamId).single();
    39	        const { data: season } = team?.season_id
    40	          ? await supabase.from('seasons').select('end_date').eq('id', team.season_id).single()
    41	          : { data: null };
    42	        const until = computeDefaultUntil(formData.date, pattern, season?.end_date);
    43	        safeForm = { ...formData, recurrence: { pattern, until } };
    44	      }
    45	      const dates = expandDates(safeForm, pattern);
    46	
    47	      // Insert the first event alone so we can reference its ID as
    48	      // parent_event_id on any recurring siblings.
    49	      const firstRow = withTime(baseRow, dates[0], formData);
    50	      const { data: first, error: firstErr } = await supabase
    51	        .from('events').insert(firstRow).select().single();
    52	      if (firstErr) throw firstErr;
    53	
    54	      const createdIds = [first.id];
    55	      if (dates.length > 1) {
    56	        const siblings = dates.slice(1).map((d) => ({
    57	          ...withTime(baseRow, d, formData),
    58	          parent_event_id: first.id,
    59	        }));
    60	        const { data: sibData, error: sibErr } = await supabase
    61	          .from('events').insert(siblings).select('id');
    62	        if (sibErr) throw sibErr;
    63	        (sibData || []).forEach((r) => createdIds.push(r.id));
    64	        // Self-reference the parent so the repeat icon fires on every
    65	        // event in the series (including the first). Siblings already
    66	        // carry parent_event_id = first.id; this closes the loop.
    67	        await supabase.from('events').update({ parent_event_id: first.id }).eq('id', first.id);
    68	      }
    69	
    70	      // Fan out duty slots across every created event. One row per slot
    71	      // (a "Scorekeeper x 2" duty becomes 2 event_duties rows with the
    72	      // same duty_name). Schema uses `duty_name` not `name`.
    73	      const duties = (formData.duties || []).filter((d) => d.duty_name?.trim() || d.name?.trim());
    74	      if (duties.length > 0) {
    75	        const dutyRows = [];
    76	        createdIds.forEach((eid) => {
    77	          duties.forEach((d) => {
    78	            const label = (d.duty_name || d.name).trim();
    79	            for (let i = 0; i < (d.slots_needed || 1); i++) {
    80	              dutyRows.push({ event_id: eid, duty_name: label });
    81	            }
    82	          });
    83	        });
    84	        if (dutyRows.length > 0) {
    85	          const { error: dErr } = await supabase.from('event_duties').insert(dutyRows);
    86	          if (dErr) throw new Error(`Volunteers failed to save: ${dErr.message}`);
    87	        }
    88	      }
    89	
    90	      return { data: first };
    91	    } catch (err) {
    92	      console.error('Create event failed:', err.message, err);
    93	      setError(err.message);
    94	      return { error: err.message };
    95	    } finally {
    96	      setLoading(false);
    97	    }
    98	  };
    99	
   100	  return { create, loading, error };
   101	}
   102	
   103	// Builds the ISO-string start_at / end_at for a specific date, holding
   104	// the HH:MM constant. Called once per recurring instance.
   105	function withTime(row, date, formData) {
   106	  // new Date('YYYY-MM-DDTHH:MM') is interpreted as LOCAL time per the
   107	  // ECMA-262 Date Time String Format; .toISOString() then converts to
   108	  // UTC for storage. Do not append 'Z' or an offset — that would force
   109	  // UTC parsing and shift events by the user's timezone.
   110	  const startDate = new Date(`${date}T${formData.startTime}`);
   111	  const endDate = new Date(`${date}T${formData.endTime}`);
   112	  // Late-night events (e.g. start 22:00 → end 01:03) cross midnight;
   113	  // bump the end date forward a day so end_at > start_at.
   114	  if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
   115	  return {
   116	    ...row,
   117	    start_at: startDate.toISOString(),
   118	    end_at: endDate.toISOString(),
   119	  };
   120	}
   121	
   122	// Returns an array of YYYY-MM-DD strings. For 'once' it's [startDate];
   123	// for weekly/biweekly it steps by 7 or 14 days up to (and including)
   124	// the `until` date, capped at 100 to avoid runaway loops.
   125	function expandDates(formData, pattern) {
   126	  const startDate = formData.date;
   127	  if (pattern === 'once') return [startDate];
   128	  const step = pattern === 'weekly' ? 7 : 14;
   129	  const until = formData.recurrence?.until
   130	    ? new Date(`${formData.recurrence.until}T00:00:00`)
   131	    : null;
   132	  const out = [];
   133	  const cursor = new Date(`${startDate}T00:00:00`);
   134	  while ((!until || cursor <= until) && out.length < 26) {
   135	    out.push(cursor.toISOString().slice(0, 10));
   136	    cursor.setDate(cursor.getDate() + step);
   137	  }
   138	  return out;
   139	}
   140	
```

## src/hooks/useDuties.js (48 lines)
```
     1	import { useCallback, useEffect, useRef, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { useAuth } from '../context/AuthContext';
     4	
     5	// Fetches event_duties for an event and exposes claim/unclaim.
     6	// Schema: one row per claimable slot (duty_name + guardian_id nullable).
     7	// A "Scorekeeper x 2" duty is inserted as 2 rows with the same duty_name,
     8	// each independently claimable (see useCreateActivity).
     9	export function useDuties(eventId) {
    10	  const { user, guardianId } = useAuth();
    11	  const [duties, setDuties] = useState([]);
    12	  const [loading, setLoading] = useState(true);
    13	  const didInitialLoad = useRef(false);
    14	
    15	  const fetch = useCallback(async () => {
    16	    if (!eventId) { setLoading(false); return; }
    17	    if (!didInitialLoad.current) setLoading(true);
    18	    const { data, error } = await supabase
    19	      .from('event_duties').select('*').eq('event_id', eventId)
    20	      .order('duty_name', { ascending: true });
    21	    if (error) console.error('useDuties:', error.message);
    22	    setDuties(data || []);
    23	    didInitialLoad.current = true;
    24	    setLoading(false);
    25	  }, [eventId]);
    26	
    27	  useEffect(() => { fetch(); }, [fetch]);
    28	
    29	  const claim = async (dutyId) => {
    30	    const authorName = user?.user_metadata?.full_name || user?.email || 'User';
    31	    const { error } = await supabase.from('event_duties')
    32	      .update({ guardian_id: guardianId ?? null, claimed_by_name: authorName, claimed_at: new Date().toISOString() })
    33	      .eq('id', dutyId).is('guardian_id', null);
    34	    if (error) { console.error('claim duty:', error.message); return; }
    35	    await fetch();
    36	  };
    37	
    38	  const unclaim = async (dutyId) => {
    39	    const q = supabase.from('event_duties')
    40	      .update({ guardian_id: null, claimed_by_name: null, claimed_at: null })
    41	      .eq('id', dutyId);
    42	    const { error } = await (guardianId ? q.eq('guardian_id', guardianId) : q);
    43	    if (error) { console.error('unclaim duty:', error.message); return; }
    44	    await fetch();
    45	  };
    46	
    47	  return { duties, loading, claim, unclaim, refetch: fetch };
    48	}
```

## src/hooks/useEventDetail.js (35 lines)
```
     1	import { useCallback, useEffect, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	export function useEventDetail(eventId, seed = null) {
     5	  const [event, setEvent] = useState(seed);
     6	  const [loading, setLoading] = useState(!seed);
     7	
     8	  const refetch = useCallback(() => {
     9	    if (!eventId) { setLoading(false); return; }
    10	    // Don't setLoading(true) on refetch — only the initial mount
    11	    // should show the loading placeholder. Subsequent refetches
    12	    // (cancel, reinstate, edit) update the event in-place so the
    13	    // page stays visible and scroll position is preserved.
    14	    supabase
    15	      .from('events')
    16	      .select('*, teams(id, name, team_color, org_id, sort_order)')
    17	      .eq('id', eventId)
    18	      .single()
    19	      .then(({ data, error }) => {
    20	        if (error) console.error('useEventDetail:', error.message);
    21	        setEvent(data || null);
    22	        setLoading(false);
    23	      });
    24	  }, [eventId]);
    25	
    26	  useEffect(() => { refetch(); }, [refetch]);
    27	
    28	  // Optimistically patch a field without waiting for a full refetch.
    29	  // Used by cancel/reinstate to update status instantly in the UI.
    30	  const patchEvent = useCallback((patch) => {
    31	    setEvent((prev) => prev ? { ...prev, ...patch } : prev);
    32	  }, []);
    33	
    34	  return { event, loading, refetch, patchEvent };
    35	}
```

## src/hooks/useEventDutyCounts.js (29 lines)
```
     1	import { useState, useEffect, useRef } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	// Per-event duty counts: { [event_id]: { total, claimed } }.
     5	// A duty is "claimed" when either claimed_by_name (anonymous signup)
     6	// or guardian_id (signed-in guardian pickup) is set.
     7	export function useEventDutyCounts(activities) {
     8	  const [counts, setCounts] = useState({});
     9	  const lastKeyRef = useRef(null);
    10	  useEffect(() => {
    11	    const ids = (activities || []).map((a) => a.id);
    12	    if (ids.length === 0) { setCounts({}); lastKeyRef.current = ''; return; }
    13	    const key = [...ids].sort().join(',');
    14	    if (lastKeyRef.current === key) return;
    15	    lastKeyRef.current = key;
    16	    supabase.from('event_duties').select('event_id, claimed_by_name, guardian_id').in('event_id', ids)
    17	      .then(({ data }) => {
    18	        if (!data) return;
    19	        const map = {};
    20	        data.forEach((r) => {
    21	          if (!map[r.event_id]) map[r.event_id] = { total: 0, claimed: 0 };
    22	          map[r.event_id].total += 1;
    23	          if (r.claimed_by_name || r.guardian_id) map[r.event_id].claimed += 1;
    24	        });
    25	        setCounts(map);
    26	      });
    27	  }, [activities]);
    28	  return counts;
    29	}
```

## src/hooks/useEventRideCounts.js (26 lines)
```
     1	import { useState, useEffect, useRef } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	export function useEventRideCounts(activities) {
     5	  const [counts, setCounts] = useState({});
     6	  const lastKeyRef = useRef(null);
     7	  useEffect(() => {
     8	    const ids = (activities || []).map((a) => a.id);
     9	    if (ids.length === 0) { setCounts({}); lastKeyRef.current = ''; return; }
    10	    const key = [...ids].sort().join(',');
    11	    if (lastKeyRef.current === key) return;
    12	    lastKeyRef.current = key;
    13	    supabase.from('event_rides').select('event_id, ride_type, seats').in('event_id', ids)
    14	      .then(({ data, error }) => {
    15	        if (error) { console.error('useEventRideCounts:', error.message); return; }
    16	        const map = {};
    17	        (data || []).forEach((r) => {
    18	          if (!map[r.event_id]) map[r.event_id] = { offers: 0, requests: 0, urgent: false };
    19	          if (r.ride_type === 'offering') map[r.event_id].offers += (r.seats || 1);
    20	          else if (r.ride_type === 'requesting') map[r.event_id].requests += 1;
    21	        });
    22	        setCounts(map);
    23	      });
    24	  }, [activities]);
    25	  return counts;
    26	}
```

## src/hooks/useEventRsvpCounts.js (47 lines)
```
     1	import { useEffect, useRef, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	// Given a list of activities, fetches RSVP counts per event and team
     5	// sizes per team in two queries, then computes a summary object per
     6	// event: { going, not_going, maybe, noResponse, total }.
     7	// noResponse is inferred from (teamSize − sum of responses).
     8	export function useEventRsvpCounts(activities) {
     9	  const [summary, setSummary] = useState({});
    10	  const lastKeyRef = useRef(null);
    11	
    12	  useEffect(() => {
    13	    if (!activities || activities.length === 0) { setSummary({}); lastKeyRef.current = ''; return; }
    14	    const eventIds = activities.map((a) => a.id);
    15	    const teamIds = [...new Set(activities.map((a) => a.team_id).filter(Boolean))];
    16	    const key = [...eventIds].sort().join(',') + '|' + [...teamIds].sort().join(',');
    17	    if (lastKeyRef.current === key) return;
    18	    lastKeyRef.current = key;
    19	
    20	    Promise.all([
    21	      supabase.from('event_rsvps').select('event_id, response').in('event_id', eventIds),
    22	      supabase.from('roster_members').select('team_id').in('team_id', teamIds),
    23	    ]).then(([rsvpRes, rosterRes]) => {
    24	      const counts = {};
    25	      (rsvpRes.data || []).forEach((r) => {
    26	        if (!counts[r.event_id]) counts[r.event_id] = { going: 0, not_going: 0, maybe: 0 };
    27	        if (counts[r.event_id][r.response] !== undefined) counts[r.event_id][r.response] += 1;
    28	      });
    29	
    30	      const sizes = {};
    31	      (rosterRes.data || []).forEach((rm) => {
    32	        sizes[rm.team_id] = (sizes[rm.team_id] || 0) + 1;
    33	      });
    34	
    35	      const next = {};
    36	      activities.forEach((a) => {
    37	        const c = counts[a.id] || { going: 0, not_going: 0, maybe: 0 };
    38	        const size = sizes[a.team_id] || 0;
    39	        const noResponse = Math.max(0, size - c.going - c.not_going - c.maybe);
    40	        next[a.id] = { ...c, noResponse, total: c.going + c.not_going + c.maybe + noResponse };
    41	      });
    42	      setSummary(next);
    43	    });
    44	  }, [activities]);
    45	
    46	  return summary;
    47	}
```

## src/hooks/useFilteredRoster.js (32 lines)
```
     1	import { useMemo } from 'react';
     2	
     3	// Filters a player list by a search query (first/last name + jersey)
     4	// and sorts by the selected key. Memoized so the result is stable
     5	// across re-renders unless inputs change.
     6	//
     7	// sortBy values: 'jersey' (default) | 'name' | 'grade'
     8	// Null jerseys always sink to the bottom of the jersey sort.
     9	export function useFilteredRoster(players, search, sortBy) {
    10	  return useMemo(() => {
    11	    const filtered = players.filter((p) => {
    12	      if (!search.trim()) return true;
    13	      const q = search.toLowerCase();
    14	      return (
    15	        (p.first_name || '').toLowerCase().includes(q) ||
    16	        (p.last_name || '').toLowerCase().includes(q) ||
    17	        String(p.jersey_number ?? '').includes(q)
    18	      );
    19	    });
    20	
    21	    return [...filtered].sort((a, b) => {
    22	      if (sortBy === 'name') {
    23	        const c = (a.last_name || '').localeCompare(b.last_name || '');
    24	        return c !== 0 ? c : (a.first_name || '').localeCompare(b.first_name || '');
    25	      }
    26	      if (sortBy === 'grade') return (a.grade || 0) - (b.grade || 0);
    27	      const aJ = a.jersey_number ?? 999;
    28	      const bJ = b.jersey_number ?? 999;
    29	      return aJ - bJ;
    30	    });
    31	  }, [players, search, sortBy]);
    32	}
```

## src/hooks/useMapsUrl.js (29 lines)
```
     1	import { useEffect, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	// Module-level cache keyed by the cleaned location name. undefined = miss,
     5	// null = looked up and not found, object = coordinates on file.
     6	const cache = new Map();
     7	
     8	// Resolves a free-text location string to a Google Maps directions URL by
     9	// looking up the stored lat/lon in the `locations` table. Results are
    10	// cached across the session so every NextUpCard on a dashboard doesn't
    11	// re-query for the same venue.
    12	export function useMapsUrl(location) {
    13	  const [url, setUrl] = useState(null);
    14	  useEffect(() => {
    15	    if (!location) return;
    16	    const name = location.replace(/[\u2018\u2019\u2032]/g, "'").split(' - ')[0].split('(')[0].trim();
    17	    if (!name) return;
    18	    const toUrl = (r) => (r?.lat && r?.lon ? `https://maps.google.com/maps?daddr=${r.lat},${r.lon}` : null);
    19	    const hit = cache.get(name);
    20	    if (hit !== undefined) { setUrl(toUrl(hit)); return; }
    21	    supabase.from('locations').select('lat, lon').ilike('name', `%${name}%`).limit(1)
    22	      .then(({ data }) => {
    23	        const r = data?.[0] || null;
    24	        cache.set(name, r);
    25	        setUrl(toUrl(r));
    26	      });
    27	  }, [location]);
    28	  return url;
    29	}
```

## src/hooks/useOnlineStatus.js (18 lines)
```
     1	import { useState, useEffect } from 'react';
     2	
     3	export function useOnlineStatus() {
     4	  const [online, setOnline] = useState(navigator.onLine);
     5	
     6	  useEffect(() => {
     7	    const goOnline = () => setOnline(true);
     8	    const goOffline = () => setOnline(false);
     9	    window.addEventListener('online', goOnline);
    10	    window.addEventListener('offline', goOffline);
    11	    return () => {
    12	      window.removeEventListener('online', goOnline);
    13	      window.removeEventListener('offline', goOffline);
    14	    };
    15	  }, []);
    16	
    17	  return online;
    18	}
```

## src/hooks/usePrograms.js (69 lines)
```
     1	import { useCallback, useEffect, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { useAuth } from '../context/AuthContext';
     4	import { useSeason } from '../context/SeasonContext';
     5	
     6	// Fetches programs (teams) for the active season, sorted by sort_order so
     7	// the UI always renders oldest-to-youngest (11U → 8U). "Program" is the
     8	// v2 UI term; the underlying table is `teams` — the two are 1:1 for now.
     9	// Used by AdminTeamsPage, schedule filters, and the roster module.
    10	export function usePrograms() {
    11	  const { orgId } = useAuth();
    12	  const { activeSeason } = useSeason();
    13	  const seasonId = activeSeason?.id ?? null;
    14	
    15	  const [programs, setPrograms] = useState([]);
    16	  const [loading, setLoading] = useState(true);
    17	  const [error, setError] = useState(null);
    18	
    19	  const refetch = useCallback(async () => {
    20	    if (!orgId || !seasonId) {
    21	      setPrograms([]);
    22	      setLoading(false);
    23	      return;
    24	    }
    25	    setLoading(true);
    26	    const { data, error: e } = await supabase
    27	      .from('teams')
    28	      .select('*')
    29	      .eq('org_id', orgId)
    30	      .eq('season_id', seasonId)
    31	      .order('sort_order', { ascending: true });
    32	    if (e) {
    33	      console.error('usePrograms fetch:', e.message);
    34	      setError(e.message);
    35	      setPrograms([]);
    36	    } else {
    37	      setError(null);
    38	      setPrograms(data ?? []);
    39	    }
    40	    setLoading(false);
    41	  }, [orgId, seasonId]);
    42	
    43	  // Microtask wrap pushes the synchronous setLoading(true) at the top of
    44	  // refetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
    45	  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);
    46	
    47	  const createProgram = useCallback(async (input) => {
    48	    if (!orgId || !seasonId) return { error: 'No active season' };
    49	    const { error: e } = await supabase
    50	      .from('teams')
    51	      .insert({ ...input, org_id: orgId, season_id: seasonId });
    52	    if (!e) await refetch();
    53	    return { error: e?.message };
    54	  }, [orgId, seasonId, refetch]);
    55	
    56	  const updateProgram = useCallback(async (id, input) => {
    57	    const { error: e } = await supabase.from('teams').update(input).eq('id', id);
    58	    if (!e) await refetch();
    59	    return { error: e?.message };
    60	  }, [refetch]);
    61	
    62	  const deleteProgram = useCallback(async (id) => {
    63	    const { error: e } = await supabase.from('teams').delete().eq('id', id);
    64	    if (!e) await refetch();
    65	    return { error: e?.message };
    66	  }, [refetch]);
    67	
    68	  return { programs, loading, error, refetch, createProgram, updateProgram, deleteProgram };
    69	}
```

## src/hooks/usePullToRefresh.js (28 lines)
```
     1	import { useState, useRef, useCallback } from 'react';
     2	
     3	export function usePullToRefresh(onRefresh) {
     4	  const [refreshing, setRefreshing] = useState(false);
     5	  const startY = useRef(0);
     6	  const pulling = useRef(false);
     7	
     8	  const onTouchStart = useCallback((e) => {
     9	    if (window.scrollY === 0 || e.currentTarget.scrollTop === 0) {
    10	      startY.current = e.touches[0].clientY;
    11	      pulling.current = true;
    12	    }
    13	  }, []);
    14	
    15	  const onTouchEnd = useCallback(async (e) => {
    16	    if (!pulling.current) return;
    17	    pulling.current = false;
    18	    const diff = e.changedTouches[0].clientY - startY.current;
    19	    if (diff > 80) {
    20	      setRefreshing(true);
    21	      navigator.vibrate?.(20);
    22	      await onRefresh?.();
    23	      setRefreshing(false);
    24	    }
    25	  }, [onRefresh]);
    26	
    27	  return { refreshing, onTouchStart, onTouchEnd };
    28	}
```

## src/hooks/useRefetchOnVisible.js (11 lines)
```
     1	import { useEffect } from 'react';
     2	
     3	// Refetches whenever the tab regains visibility — cheap stand-in for
     4	// pull-to-refresh on pages where stale data is most visible.
     5	export function useRefetchOnVisible(refetch) {
     6	  useEffect(() => {
     7	    const handler = () => { if (document.visibilityState === 'visible') refetch?.(); };
     8	    document.addEventListener('visibilitychange', handler);
     9	    return () => document.removeEventListener('visibilitychange', handler);
    10	  }, [refetch]);
    11	}
```

## src/hooks/useRides.js (94 lines)
```
     1	import { useCallback, useEffect, useRef, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { useAuth } from '../context/AuthContext';
     4	
     5	// Schema: event_rides uses (ride_type, pickup_location, departure_time,
     6	// guardian_id, name, seats). ride_type is 'offering' (driver) or
     7	// 'requesting' (rider needing a seat).
     8	export function useRides(eventId) {
     9	  const { user, guardianId } = useAuth();
    10	  const [rides, setRides] = useState([]);
    11	  const [loading, setLoading] = useState(true);
    12	  const didInitialLoad = useRef(false);
    13	
    14	  const fetch = useCallback(async () => {
    15	    if (!eventId) { setLoading(false); return; }
    16	    if (!didInitialLoad.current) setLoading(true);
    17	    const { data, error } = await supabase
    18	      .from('event_rides').select('*').eq('event_id', eventId)
    19	      .order('created_at', { ascending: true });
    20	    if (error) console.error('useRides:', error.message);
    21	    setRides(data || []);
    22	    didInitialLoad.current = true;
    23	    setLoading(false);
    24	  }, [eventId]);
    25	
    26	  useEffect(() => { fetch(); }, [fetch]);
    27	
    28	  const create = async (payload) => {
    29	    const authorName = payload.authorName || user?.user_metadata?.full_name || user?.email || 'User';
    30	    let depTime = null;
    31	    if (payload.departure_time) {
    32	      const eventDate = payload.event_date || new Date().toISOString().slice(0, 10);
    33	      depTime = `${eventDate}T${payload.departure_time}:00`;
    34	    }
    35	    const row = {
    36	      event_id: eventId,
    37	      ride_type: payload.ride_type,
    38	      pickup_location: payload.pickup_location || null,
    39	      departure_time: depTime,
    40	      seats: payload.seats || 1,
    41	      notes: payload.notes || null,
    42	      guardian_id: guardianId ?? null,
    43	      name: authorName,
    44	      phone: payload.phone || null,
    45	    };
    46	    // Dedup by guardian_id when available, else by name.
    47	    const base = supabase.from('event_rides').select('id')
    48	      .eq('event_id', eventId).eq('ride_type', payload.ride_type);
    49	    const { data: existing } = await (guardianId
    50	      ? base.eq('guardian_id', guardianId)
    51	      : base.eq('name', authorName)).maybeSingle();
    52	    const { error } = existing
    53	      ? await supabase.from('event_rides').update(row).eq('id', existing.id)
    54	      : await supabase.from('event_rides').insert(row);
    55	    if (error) { window.alert(`Failed to save ride: ${error.message}`); return false; }
    56	    await fetch();
    57	    return true;
    58	  };
    59	
    60	  const claim = async (offer, authorName, phone) => {
    61	    const claimantName = authorName || user?.user_metadata?.full_name || user?.email || 'User';
    62	    // Dedup: if this user already has a request on this event, no-op.
    63	    const dedupQuery = supabase.from('event_rides').select('id')
    64	      .eq('event_id', eventId).eq('ride_type', 'requesting');
    65	    const { data: existing } = await (guardianId
    66	      ? dedupQuery.eq('guardian_id', guardianId)
    67	      : dedupQuery.eq('name', claimantName)).maybeSingle();
    68	    if (existing) { await fetch(); return true; }
    69	    const row = {
    70	      event_id: eventId,
    71	      ride_type: 'requesting',
    72	      pickup_location: null,
    73	      departure_time: null,
    74	      seats: 1,
    75	      notes: `Riding with ${offer.name}`,
    76	      guardian_id: guardianId ?? null,
    77	      name: claimantName,
    78	      phone: phone || null,
    79	    };
    80	    const { error } = await supabase.from('event_rides').insert(row);
    81	    if (error) { window.alert(`Failed to claim seat: ${error.message}`); return false; }
    82	    await fetch();
    83	    return true;
    84	  };
    85	
    86	  const remove = async (rideId) => {
    87	    const { error } = await supabase.from('event_rides')
    88	      .delete().eq('id', rideId);
    89	    if (error) { window.alert(`Failed to remove ride: ${error.message}`); return; }
    90	    await fetch();
    91	  };
    92	
    93	  return { rides, loading, create, claim, remove, refetch: fetch };
    94	}
```

## src/hooks/useRoster.js (45 lines)
```
     1	import { useCallback, useEffect, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	export function useRoster(teamId) {
     5	  const [players, setPlayers] = useState([]);
     6	  const [loading, setLoading] = useState(true);
     7	
     8	  const refetch = useCallback(async () => {
     9	    if (!teamId) { setLoading(false); return; }
    10	    setLoading(true);
    11	    try {
    12	      const { data, error } = await supabase
    13	        .from('roster_members')
    14	        .select('jersey_number, jersey_size, shorts_size, payment_status, players(id, first_name, last_name, grade, member_type, player_guardians(guardian_id, guardians(id, first_name, last_name, email, phone, user_id)))')
    15	        .eq('team_id', teamId);
    16	      if (error) throw error;
    17	      const mapped = (data || []).map((rm) => ({
    18	        id: rm.players.id,
    19	        first_name: rm.players.first_name,
    20	        last_name: rm.players.last_name,
    21	        grade: rm.players.grade,
    22	        member_type: rm.players.member_type,
    23	        jersey_number: rm.jersey_number,
    24	        jersey_size: rm.jersey_size,
    25	        shorts_size: rm.shorts_size,
    26	        payment_status: rm.payment_status || 'paid',
    27	        guardians: (rm.players.player_guardians || [])
    28	          .map((pg) => pg.guardians)
    29	          .filter(Boolean)
    30	          .map((g) => ({ id: g.id, firstName: g.first_name, lastName: g.last_name, email: g.email, phone: g.phone, userId: g.user_id })),
    31	      }));
    32	      setPlayers(mapped);
    33	    } catch (err) {
    34	      console.error('useRoster:', err.message);
    35	      setPlayers([]);
    36	    }
    37	    setLoading(false);
    38	  }, [teamId]);
    39	
    40	  useEffect(() => {
    41	    refetch();
    42	  }, [refetch]);
    43	
    44	  return { players, loading, refetch };
    45	}
```

## src/hooks/useRsvps.js (70 lines)
```
     1	import { useCallback, useEffect, useRef, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	
     4	export function useRsvps(eventId, teamId) {
     5	  const [rsvps, setRsvps] = useState([]);
     6	  const [roster, setRoster] = useState([]);
     7	  const [loading, setLoading] = useState(true);
     8	  const didInitialLoad = useRef(false);
     9	
    10	  const fetch = useCallback(async () => {
    11	    if (!eventId || !teamId) { setLoading(false); return; }
    12	    if (!didInitialLoad.current) setLoading(true);
    13	    const [rsvpRes, rosterRes] = await Promise.all([
    14	      supabase.from('event_rsvps').select('*').eq('event_id', eventId),
    15	      supabase
    16	        .from('roster_members')
    17	        .select('jersey_number, players(id, first_name, last_name, member_type)')
    18	        .eq('team_id', teamId)
    19	        .order('jersey_number', { ascending: true, nullsFirst: false }),
    20	    ]);
    21	    setRsvps(rsvpRes.data || []);
    22	    const mapped = (rosterRes.data || []).map((rm) => ({
    23	      id: rm.players.id,
    24	      first_name: rm.players.first_name,
    25	      last_name: rm.players.last_name,
    26	      member_type: rm.players.member_type,
    27	      jersey_number: rm.jersey_number,
    28	    }));
    29	    setRoster(mapped);
    30	    didInitialLoad.current = true;
    31	    setLoading(false);
    32	  }, [eventId, teamId]);
    33	
    34	  useEffect(() => { fetch(); }, [fetch]);
    35	
    36	  const setRsvp = async (playerId, response) => {
    37	    const { error } = await supabase.from('event_rsvps').upsert(
    38	      { event_id: eventId, player_id: playerId, response, responded_at: new Date().toISOString() },
    39	      { onConflict: 'event_id,player_id' }
    40	    );
    41	    if (error) {
    42	      console.error('setRsvp:', error.message);
    43	      return;
    44	    }
    45	    await fetch();
    46	  };
    47	
    48	  const saveNote = async (playerId, comment) => {
    49	    // Only update comment on existing RSVP rows — event_rsvps.response is NOT NULL
    50	    const { data: existing } = await supabase
    51	      .from('event_rsvps')
    52	      .select('id')
    53	      .eq('event_id', eventId)
    54	      .eq('player_id', playerId)
    55	      .maybeSingle();
    56	    if (!existing) {
    57	      console.warn('No RSVP exists for this player, cannot save note without RSVP');
    58	      return;
    59	    }
    60	    const { error } = await supabase
    61	      .from('event_rsvps')
    62	      .update({ comment })
    63	      .eq('event_id', eventId)
    64	      .eq('player_id', playerId);
    65	    if (error) console.error('saveNote:', error.message);
    66	    else await fetch();
    67	  };
    68	
    69	  return { rsvps, roster, loading, setRsvp, saveNote, refetch: fetch };
    70	}
```

## src/hooks/useSeasons.js (72 lines)
```
     1	import { useCallback, useEffect, useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { useAuth } from '../context/AuthContext';
     4	
     5	// CRUD-lite hook around the `seasons` table. Fetches all seasons for the
     6	// current org, and exposes create/update/setActive mutations plus a manual
     7	// refetch. `setActive` is a two-step transaction in application code —
     8	// Postgres doesn't enforce "only one active per org", so we archive all
     9	// others and then promote the target row.
    10	export function useSeasons() {
    11	  const { orgId } = useAuth();
    12	  const [seasons, setSeasons] = useState([]);
    13	  const [loading, setLoading] = useState(true);
    14	  const [error, setError] = useState(null);
    15	
    16	  const refetch = useCallback(async () => {
    17	    if (!orgId) { setSeasons([]); setLoading(false); return; }
    18	    setLoading(true);
    19	    const { data, error: e } = await supabase
    20	      .from('seasons')
    21	      .select('*')
    22	      .eq('org_id', orgId)
    23	      .order('start_date', { ascending: false });
    24	    if (e) {
    25	      console.error('useSeasons fetch:', e.message);
    26	      setError(e.message);
    27	      setSeasons([]);
    28	    } else {
    29	      setError(null);
    30	      setSeasons(data ?? []);
    31	    }
    32	    setLoading(false);
    33	  }, [orgId]);
    34	
    35	  // Microtask wrap pushes the synchronous setLoading(true) at the top of
    36	  // refetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
    37	  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);
    38	
    39	  const createSeason = useCallback(async (input) => {
    40	    if (!orgId) return { error: 'No organization' };
    41	    const { error: e } = await supabase
    42	      .from('seasons')
    43	      .insert({ ...input, org_id: orgId });
    44	    if (!e) await refetch();
    45	    return { error: e?.message };
    46	  }, [orgId, refetch]);
    47	
    48	  const updateSeason = useCallback(async (id, input) => {
    49	    const { error: e } = await supabase
    50	      .from('seasons').update(input).eq('id', id);
    51	    if (!e) await refetch();
    52	    return { error: e?.message };
    53	  }, [refetch]);
    54	
    55	  // Archive every other season in the org, then activate the chosen one.
    56	  // Two statements because Postgres can't express "set exactly one row" in
    57	  // a single update, and the check constraint already guarantees valid
    58	  // status values.
    59	  const setActive = useCallback(async (id) => {
    60	    if (!orgId) return { error: 'No organization' };
    61	    const { error: e1 } = await supabase
    62	      .from('seasons').update({ status: 'archived' })
    63	      .eq('org_id', orgId).neq('id', id);
    64	    if (e1) return { error: e1.message };
    65	    const { error: e2 } = await supabase
    66	      .from('seasons').update({ status: 'active' }).eq('id', id);
    67	    if (!e2) await refetch();
    68	    return { error: e2?.message };
    69	  }, [orgId, refetch]);
    70	
    71	  return { seasons, loading, error, refetch, createSeason, updateSeason, setActive };
    72	}
```

## src/hooks/useUpdateActivity.js (102 lines)
```
     1	import { useState } from 'react';
     2	import { supabase } from '../lib/supabase';
     3	import { reconcileSeries, convertToSeries } from './seriesReconcile';
     4	import { buildTitle } from '../lib/constants';
     5	
     6	export function useUpdateActivity() {
     7	  const [loading, setLoading] = useState(false);
     8	  const [error, setError] = useState(null);
     9	
    10	  // Full row builder shared between single and series updates.
    11	  const buildRow = (formData) => {
    12	    // See useCreateActivity.withTime for the local-time contract.
    13	    const startAt = new Date(`${formData.date}T${formData.startTime}`);
    14	    const endAt = new Date(`${formData.date}T${formData.endTime}`);
    15	    // Midnight-crossover: if end is earlier than start, bump end one day.
    16	    if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1);
    17	    return {
    18	      team_id: formData.teamId,
    19	      event_type: formData.eventType,
    20	      title: formData.title || buildTitle(formData.eventType, formData.opponent),
    21	      start_at: startAt.toISOString(),
    22	      end_at: endAt.toISOString(),
    23	      location: formData.location || null,
    24	      location_address: formData.locationAddress || null,
    25	      sub_location: formData.subLocation || null,
    26	      opponent: formData.opponent || null,
    27	      home_away: formData.homeAway || 'tbd',
    28	      is_scrimmage: formData.isScrimmage || false,
    29	      notes: formData.notes || null,
    30	      coach_notes: formData.coachNotes || null,
    31	      jersey: formData.jersey || null,
    32	      indoor: formData.indoor ?? true,
    33	      enable_rides: formData.enableRides || false,
    34	      arrival_minutes_before: formData.arrivalMinutes ?? 5,
    35	    };
    36	  };
    37	
    38	  const update = async (eventId, formData) => {
    39	    setLoading(true); setError(null);
    40	    try {
    41	      const { data, error: err } = await supabase
    42	        .from('events').update(buildRow(formData)).eq('id', eventId).select().single();
    43	      if (err) throw err;
    44	      // Additively insert any new duties from the form. Does NOT delete or
    45	      // modify existing event_duties — those are safe from overwrites.
    46	      // eventToForm initializes duties: [] so an untouched edit is a no-op.
    47	      const newDuties = (formData.duties || []).filter((d) => d.duty_name?.trim() || d.name?.trim());
    48	      if (newDuties.length > 0) {
    49	        const dutyRows = [];
    50	        newDuties.forEach((d) => {
    51	          const label = (d.duty_name || d.name).trim();
    52	          for (let i = 0; i < (d.slots_needed || 1); i++) {
    53	            dutyRows.push({ event_id: eventId, duty_name: label });
    54	          }
    55	        });
    56	        const { error: dErr } = await supabase.from('event_duties').insert(dutyRows);
    57	        if (dErr) throw new Error(`Volunteers failed to save: ${dErr.message}`);
    58	      }
    59	      // Convert standalone → recurring if user changed Once → Weekly/Biweekly.
    60	      const pattern = formData.recurrence?.pattern;
    61	      if (pattern && pattern !== 'once' && !data.parent_event_id) {
    62	        await convertToSeries({ eventId, formData, row: buildRow(formData) });
    63	      }
    64	      return { data };
    65	    } catch (err) {
    66	      console.error('Update event failed:', err.message, err);
    67	      setError(err.message);
    68	      return { error: err.message };
    69	    }
    70	    finally { setLoading(false); }
    71	  };
    72	
    73	  // Updates this event and all siblings in the same recurring series
    74	  // (sharing the same parent_event_id) whose start_at is >= the current
    75	  // event's start_at. Excludes date/time so each instance keeps its
    76	  // own schedule; only location, notes, duties, toggles etc. propagate.
    77	  const updateSeries = async (eventId, parentEventId, startAt, formData) => {
    78	    setLoading(true); setError(null);
    79	    try {
    80	      const row = buildRow(formData);
    81	      delete row.start_at; delete row.end_at;
    82	      const seriesId = parentEventId || eventId;
    83	      const parentUp = await supabase.from('events').update(row)
    84	        .eq('id', seriesId).gte('start_at', startAt);
    85	      if (parentUp.error) throw parentUp.error;
    86	      const sibUp = await supabase.from('events').update(row)
    87	        .eq('parent_event_id', seriesId).gte('start_at', startAt);
    88	      if (sibUp.error) throw sibUp.error;
    89	      // Grow/shrink series to match formData.recurrence.until.
    90	      await reconcileSeries({ seriesId, eventId, formData, row });
    91	      return { data: true };
    92	    } catch (err) {
    93	      console.error('Update series failed:', err.message, err);
    94	      setError(err.message);
    95	      return { error: err.message };
    96	    }
    97	    finally { setLoading(false); }
    98	  };
    99	
   100	  return { update, updateSeries, loading, error };
   101	}
   102	
```

## src/lib/autoLinkGuardian.js (37 lines)
```
     1	import { supabase } from './supabase';
     2	
     3	// First-login hook for parent accounts. If a guardians row has a matching
     4	// email and no linked user_id, claim it for the authed user and insert the
     5	// matching user_roles row so subsequent logins use the normal membership
     6	// path. Returns { role, organization } when linked, otherwise null.
     7	export async function autoLinkGuardian(user) {
     8	  const email = user?.email?.trim().toLowerCase();
     9	  if (!email || !user?.id) return null;
    10	
    11	  const { data: guardian, error: gErr } = await supabase
    12	    .from('guardians')
    13	    .select('id, org_id')
    14	    .ilike('email', email)
    15	    .is('user_id', null)
    16	    .maybeSingle();
    17	  if (gErr || !guardian) return null;
    18	
    19	  const { error: updErr } = await supabase
    20	    .from('guardians')
    21	    .update({ user_id: user.id })
    22	    .eq('id', guardian.id);
    23	  if (updErr) { console.error('autoLinkGuardian update:', updErr.message); return null; }
    24	
    25	  const { error: insErr } = await supabase
    26	    .from('user_roles')
    27	    .insert({ user_id: user.id, organization_id: guardian.org_id, role: 'parent' });
    28	  if (insErr) { console.error('autoLinkGuardian insert:', insErr.message); return null; }
    29	
    30	  const { data: organization } = await supabase
    31	    .from('organizations')
    32	    .select('id, name, slug, logo_url, brand_colors')
    33	    .eq('id', guardian.org_id)
    34	    .single();
    35	
    36	  return { role: 'parent', organization: organization ?? null };
    37	}
```

## src/lib/constants.js (40 lines)
```
     1	// Shared enum-style constants. Keep these in sync with supabase migrations —
     2	// any value not listed here should be treated as an unknown / legacy row.
     3	
     4	export const ACTIVITY_TYPES = [
     5	  'game',
     6	  'practice',
     7	  'skills_lab',
     8	  'tryout',
     9	  'tournament',
    10	  'other',
    11	];
    12	
    13	export const TYPE_LABELS = {
    14	  game: 'Game',
    15	  practice: 'Practice',
    16	  skills_lab: 'Skills Lab',
    17	  tryout: 'Tryout',
    18	  tournament: 'Tournament',
    19	  other: 'Event',
    20	};
    21	
    22	export const RSVP_STATUSES = ['going', 'not_going', 'maybe'];
    23	
    24	export const EVENT_STATUSES = ['scheduled', 'cancelled', 'postponed'];
    25	
    26	export const TYPE_OPTIONS = [
    27	  { key: null, label: 'All' },
    28	  ...ACTIVITY_TYPES.map((key) => ({ key, label: TYPE_LABELS[key] || key })),
    29	];
    30	
    31	export const HOME_AWAY = ['home', 'away', 'neutral', 'tbd'];
    32	
    33	export const USER_ROLES = ['admin', 'coach', 'parent'];
    34	
    35	export const MEMBER_TYPES = ['roster', 'futures_academy'];
    36	
    37	export function buildTitle(type, opponent) {
    38	  if ((type === 'game' || type === 'tournament') && opponent) return `vs. ${opponent}`;
    39	  return TYPE_LABELS[type] || 'Event';
    40	}
```

## src/lib/formatters.js (46 lines)
```
     1	// Shared date / time / money formatters. Everything in the app that renders
     2	// a time, date, or currency should go through these so the output stays
     3	// consistent and switching locales later is a single-file edit.
     4	
     5	// "6:30 PM" — lowercase meridiem stripped by toLocaleTimeString by default.
     6	export function formatTime(time) {
     7	  const d = typeof time === 'string' && time.length <= 8 && time.includes(':')
     8	    ? new Date(`1970-01-01T${time}`)
     9	    : new Date(time);
    10	  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    11	}
    12	
    13	// "Monday, April 13, 2026" — full date headers, confirmation dialogs.
    14	export function formatDateFull(date) {
    15	  return new Date(date).toLocaleDateString('en-US', {
    16	    weekday: 'long',
    17	    month: 'long',
    18	    day: 'numeric',
    19	    year: 'numeric',
    20	  });
    21	}
    22	
    23	// "$450.00" — takes integer cents to avoid float drift on pricing math.
    24	export function formatCurrency(cents) {
    25	  const n = (cents ?? 0) / 100;
    26	  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    27	}
    28	
    29	// "in 35m", "in 2h 15m", "Tomorrow 6:30 PM", "Wed 5:00 PM"
    30	export function formatCountdown(startAt) {
    31	  const diff = new Date(startAt) - new Date();
    32	  if (diff < 0) return 'Now';
    33	  const mins = Math.floor(diff / 60000);
    34	  if (mins < 60) return `in ${mins}m`;
    35	  const hrs = Math.floor(mins / 60);
    36	  const rm = mins % 60;
    37	  if (hrs < 24) return `in ${hrs}h ${rm}m`;
    38	  const dt = new Date(startAt);
    39	  const tomorrow = new Date();
    40	  tomorrow.setDate(tomorrow.getDate() + 1);
    41	  if (dt.toDateString() === tomorrow.toDateString()) {
    42	    return `Tomorrow ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    43	  }
    44	  return dt.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
    45	    dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    46	}
```

## src/lib/icalHelpers.js (55 lines)
```
     1	// ICS calendar export helpers.
     2	
     3	const pad = (n) => String(n).padStart(2, '0');
     4	
     5	const toIcsUtc = (iso) => {
     6	  const d = new Date(iso);
     7	  return (
     8	    d.getUTCFullYear() +
     9	    pad(d.getUTCMonth() + 1) +
    10	    pad(d.getUTCDate()) + 'T' +
    11	    pad(d.getUTCHours()) +
    12	    pad(d.getUTCMinutes()) +
    13	    pad(d.getUTCSeconds()) + 'Z'
    14	  );
    15	};
    16	
    17	const escapeText = (s) => String(s)
    18	  .replace(/\\/g, '\\\\')
    19	  .replace(/\n/g, '\\n')
    20	  .replace(/,/g, '\\,')
    21	  .replace(/;/g, '\\;');
    22	
    23	export function generateEventIcs(event) {
    24	  const descParts = [];
    25	  if (event.arrival_minutes_before > 0) descParts.push(`Arrive ${event.arrival_minutes_before} min early`);
    26	  if (event.jersey) descParts.push(`${event.jersey} jersey`);
    27	  if (event.notes) descParts.push(event.notes);
    28	
    29	  const lines = [
    30	    'BEGIN:VCALENDAR',
    31	    'VERSION:2.0',
    32	    'PRODID:-//Skyfire//EN',
    33	    'BEGIN:VEVENT',
    34	    `DTSTART:${toIcsUtc(event.start_at)}`,
    35	    `DTEND:${toIcsUtc(event.end_at)}`,
    36	    `SUMMARY:${escapeText(event.title || '')}`,
    37	  ];
    38	  if (event.location_name) lines.push(`LOCATION:${escapeText(event.location_name)}`);
    39	  if (descParts.length) lines.push(`DESCRIPTION:${escapeText(descParts.join('\n'))}`);
    40	  lines.push('END:VEVENT', 'END:VCALENDAR');
    41	  return lines.join('\r\n');
    42	}
    43	
    44	export function downloadIcs(event) {
    45	  const ics = generateEventIcs(event);
    46	  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    47	  const url = URL.createObjectURL(blob);
    48	  const a = document.createElement('a');
    49	  a.href = url;
    50	  a.download = `${event.title || 'event'}.ics`;
    51	  document.body.appendChild(a);
    52	  a.click();
    53	  document.body.removeChild(a);
    54	  URL.revokeObjectURL(url);
    55	}
```

## src/lib/parentContext.js (42 lines)
```
     1	import { supabase } from './supabase';
     2	
     3	// Fetches a parent's linked children and the teams they're rostered to
     4	// in a single round-trip. Nested select: guardian -> player_guardians ->
     5	// players -> roster_members. Replaces a two-query chain used to cold-open
     6	// the parent dashboard.
     7	// Returns empty arrays when no guardian row exists or the user has no
     8	// linked players yet — callers can treat the empty result as "no scope".
     9	export async function fetchParentContext(userId) {
    10	  const empty = { myChildren: [], myTeamIds: [], guardianId: null, guardianFirstName: null };
    11	  if (!userId) return empty;
    12	
    13	  const { data: guardian, error } = await supabase
    14	    .from('guardians')
    15	    .select('id, first_name, player_guardians(player_id, players(id, first_name, last_name, roster_members(team_id)))')
    16	    .eq('user_id', userId)
    17	    .maybeSingle();
    18	  if (error || !guardian) return empty;
    19	
    20	  const myChildren = [];
    21	  const teamIdSet = new Set();
    22	  for (const link of guardian.player_guardians || []) {
    23	    const p = link.players;
    24	    if (!p) continue;
    25	    const rosters = p.roster_members || [];
    26	    for (const rm of rosters) {
    27	      if (rm.team_id) teamIdSet.add(rm.team_id);
    28	    }
    29	    myChildren.push({
    30	      playerId: p.id,
    31	      firstName: p.first_name,
    32	      lastName: p.last_name,
    33	      teamId: rosters[0]?.team_id ?? null,
    34	    });
    35	  }
    36	  return {
    37	    myChildren,
    38	    myTeamIds: [...teamIdSet],
    39	    guardianId: guardian.id,
    40	    guardianFirstName: guardian.first_name ?? null,
    41	  };
    42	}
```

## src/lib/permissions.js (13 lines)
```
     1	// Role predicates — the single source of truth for "can this user do X?".
     2	// Pages and nav components import these instead of string-comparing roles
     3	// inline, so changing the role set later is a one-file edit.
     4	
     5	export const isAdmin  = (role) => role === 'admin';
     6	
     7	// Staff = admin or coach — both have write access to their team's data.
     8	export const isStaff  = (role) => role === 'admin' || role === 'coach';
     9	
    10	// canEdit is currently equivalent to isStaff, but kept as a separate name so
    11	// call sites read more naturally and we can tighten the rule later without
    12	// touching every page.
    13	export const canEdit  = (role) => role === 'admin' || role === 'coach';
```

## src/lib/recurrenceHelpers.js (26 lines)
```
     1	// Given a start date, recurrence pattern, and optional season end,
     2	// return the last occurrence date of that weekday at or before the
     3	// season end. Fallback: 12 weeks (84 days) out when seasonEndDate is
     4	// missing or already past the start date.
     5	//
     6	// All inputs and outputs are YYYY-MM-DD strings. Dates are
     7	// constructed as local-midnight (no Z) to avoid timezone drift.
     8	export function computeDefaultUntil(startDate, pattern, seasonEndDate) {
     9	  const start = new Date(`${startDate}T00:00:00`);
    10	  const step = pattern === 'biweekly' ? 14 : 7;
    11	  if (seasonEndDate) {
    12	    const end = new Date(`${seasonEndDate}T00:00:00`);
    13	    if (end >= start) {
    14	      let cursor = new Date(start);
    15	      let last = new Date(start);
    16	      while (cursor <= end) {
    17	        last = new Date(cursor);
    18	        cursor.setDate(cursor.getDate() + step);
    19	      }
    20	      return last.toISOString().slice(0, 10);
    21	    }
    22	  }
    23	  const fallback = new Date(start);
    24	  fallback.setDate(fallback.getDate() + 84);
    25	  return fallback.toISOString().slice(0, 10);
    26	}
```

## src/lib/scheduleHelpers.js (16 lines)
```
     1	export function groupByDate(list) {
     2	  const groups = {};
     3	  list.forEach((a) => {
     4	    const d = a.start_at ? a.start_at.slice(0, 10) : 'unknown';
     5	    if (!groups[d]) groups[d] = [];
     6	    groups[d].push(a);
     7	  });
     8	  return Object.entries(groups);
     9	}
    10	
    11	export function formatDateHeader(dateStr) {
    12	  const d = new Date(dateStr + 'T12:00:00');
    13	  const today = new Date().toISOString().slice(0, 10);
    14	  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    15	  return dateStr === today ? `${label} · TODAY` : label;
    16	}
```

## src/lib/supabase.js (10 lines)
```
     1	import { createClient } from '@supabase/supabase-js';
     2	
     3	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
     4	const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
     5	
     6	if (!supabaseUrl || !supabaseAnonKey) {
     7	  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
     8	}
     9	
    10	export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## src/lib/tournamentBriefing.js (134 lines)
```
     1	const NY_TZ = 'America/New_York';
     2	
     3	const dateKeyFmt = new Intl.DateTimeFormat('en-US', {
     4	  timeZone: NY_TZ, year: 'numeric', month: 'numeric', day: 'numeric',
     5	});
     6	const dayLabelFmt = new Intl.DateTimeFormat('en-US', {
     7	  timeZone: NY_TZ, weekday: 'long', month: 'long', day: 'numeric',
     8	});
     9	const timeFmt = new Intl.DateTimeFormat('en-US', {
    10	  timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true,
    11	});
    12	
    13	function escapeHtml(str) {
    14	  return String(str ?? '')
    15	    .replace(/&/g, '&amp;')
    16	    .replace(/</g, '&lt;')
    17	    .replace(/>/g, '&gt;')
    18	    .replace(/"/g, '&quot;')
    19	    .replace(/'/g, '&#39;');
    20	}
    21	
    22	function matchup(teamName, opponent, homeAway) {
    23	  if (!opponent) return 'TBD';
    24	  return homeAway === 'away'
    25	    ? `${teamName} @ ${opponent}`
    26	    : `${teamName} vs ${opponent}`;
    27	}
    28	
    29	function splitTime(startAt) {
    30	  const [digits, meridiem] = timeFmt.format(new Date(startAt)).split(' ');
    31	  return { digits, meridiem };
    32	}
    33	
    34	function groupByLocalDate(events) {
    35	  const groups = new Map();
    36	  for (const ev of events) {
    37	    const key = dateKeyFmt.format(new Date(ev.start_at));
    38	    if (!groups.has(key)) groups.set(key, []);
    39	    groups.get(key).push(ev);
    40	  }
    41	  return groups;
    42	}
    43	
    44	function renderRow(ev, leftCell, teamName) {
    45	  const { digits, meridiem } = splitTime(ev.start_at);
    46	  const mText = escapeHtml(matchup(teamName, ev.opponent, ev.home_away).toUpperCase());
    47	  const loc = escapeHtml(ev.location_name || 'TBD');
    48	  const courtPart = ev.court ? `, Court ${escapeHtml(ev.court)}` : '';
    49	  const mapLink = ev.maps_url
    50	    ? ` <a href="${escapeHtml(ev.maps_url)}" style="color:#4a8fd4;font-weight:bold;text-decoration:none;">Map</a>`
    51	    : '';
    52	  return '<tr>'
    53	    + `<td style="width:46px;background:#1a1a2e;text-align:center;vertical-align:middle;padding:12px 0;">${leftCell}</td>`
    54	    + '<td style="padding:12px 14px;vertical-align:middle;">'
    55	    + `<div style="font-size:18px;font-weight:bold;text-transform:uppercase;color:#1a1a2e;">${mText}</div>`
    56	    + `<div style="font-size:12px;color:#666;margin-top:4px;">\u25cf ${loc}${courtPart}${mapLink}</div>`
    57	    + '</td>'
    58	    + '<td style="width:80px;background:#1a1a2e;text-align:center;vertical-align:middle;padding:8px 0;">'
    59	    + `<div style="color:#ffffff;font-size:24px;font-weight:bold;">${escapeHtml(digits)}</div>`
    60	    + `<div style="color:#4a8fd4;font-size:11px;">${escapeHtml(meridiem)}</div>`
    61	    + '</td></tr>';
    62	}
    63	
    64	function renderDay(dayEvents, teamName) {
    65	  const dayLabel = escapeHtml(
    66	    dayLabelFmt.format(new Date(dayEvents[0].start_at)).toUpperCase()
    67	  );
    68	  const regulars = dayEvents.filter((e) => !e.is_bracket);
    69	  const brackets = dayEvents.filter((e) => e.is_bracket);
    70	  let rows = '';
    71	  regulars.forEach((ev, i) => {
    72	    const cell = `<span style="color:#4a8fd4;font-size:20px;font-weight:bold;">${i + 1}</span>`;
    73	    rows += renderRow(ev, cell, teamName);
    74	  });
    75	  if (brackets.length) {
    76	    rows += '<tr><td colspan="3" style="background:#f0d050;color:#1a1a2e;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;text-align:center;padding:6px 0;">Bracket Game</td></tr>';
    77	    brackets.forEach((ev) => {
    78	      const star = '<span style="color:#f0d050;font-size:20px;">\u2605</span>';
    79	      rows += renderRow(ev, star, teamName);
    80	    });
    81	  }
    82	  return `<tr><td colspan="3" style="background:#4a8fd4;color:#ffffff;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:3px;text-align:center;padding:8px 0;">${dayLabel}</td></tr>${rows}`;
    83	}
    84	
    85	function renderPlain(groups, teamName) {
    86	  const lines = [];
    87	  for (const [, evs] of groups) {
    88	    lines.push(dayLabelFmt.format(new Date(evs[0].start_at)).toUpperCase());
    89	    for (const ev of evs) {
    90	      const t = timeFmt.format(new Date(ev.start_at));
    91	      const m = matchup(teamName, ev.opponent, ev.home_away);
    92	      const loc = ev.location_name || 'TBD';
    93	      const court = ev.court ? `, Court ${ev.court}` : '';
    94	      lines.push(`\u2022 ${t} \u2014 ${m} \u2014 ${loc}${court}`);
    95	    }
    96	    lines.push('');
    97	  }
    98	  lines.push('Arrive 15 minutes before tip-off.');
    99	  return lines.join('\n');
   100	}
   101	
   102	export function generateTournamentBriefing({
   103	  teamName,
   104	  tournamentName,
   105	  dateLabel,
   106	  events,
   107	  orgName = 'Legacy Hoopers',
   108	}) {
   109	  const groups = groupByLocalDate(events);
   110	  const tName = escapeHtml(teamName);
   111	  const tourn = escapeHtml(tournamentName);
   112	  const dLabel = escapeHtml(dateLabel);
   113	  const org = escapeHtml(orgName);
   114	  const title = `${tName} \u2014 ${tourn}`.toUpperCase();
   115	
   116	  let body = '';
   117	  for (const [, evs] of groups) body += renderDay(evs, teamName);
   118	
   119	  const html = '<div style="max-width:520px;margin:0 auto;border:3px solid #1a1a2e;border-radius:6px;font-family:Arial,sans-serif;background:#ffffff;overflow:hidden;">'
   120	    + '<div style="background:#1a1a2e;border-bottom:5px solid #4a8fd4;text-align:center;padding:20px 16px;">'
   121	    + `<div style="color:#4a8fd4;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">${org} Presents</div>`
   122	    + `<div style="color:#ffffff;font-size:26px;text-transform:uppercase;font-weight:bold;margin:10px 0;line-height:1.2;">${title}</div>`
   123	    + `<div style="display:inline-block;background:#f0d050;color:#1a1a2e;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:4px;border:1px solid rgba(74,143,212,0.4);">${dLabel}</div>`
   124	    + '</div>'
   125	    + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${body}</table>`
   126	    + '<div style="background:#f5f7fa;text-align:center;padding:12px;font-size:13px;color:#1a1a2e;font-weight:bold;">Arrive 15 minutes before tip-off</div>'
   127	    + `<div style="background:#1a1a2e;text-align:center;padding:10px;font-size:11px;color:#666;">${org} \u2014 Westchester, NY</div>`
   128	    + '</div>';
   129	
   130	  const plainText = renderPlain(groups, teamName);
   131	  const subject = `${teamName} \u2014 ${tournamentName} Weekend`;
   132	
   133	  return { html, plainText, subject };
   134	}
```

## src/main.jsx (25 lines)
```
     1	import { StrictMode } from 'react';
     2	import { createRoot } from 'react-dom/client';
     3	import { BrowserRouter } from 'react-router-dom';
     4	import { AuthProvider } from './context/AuthContext';
     5	import { SeasonProvider } from './context/SeasonContext';
     6	import ErrorBoundary from './components/ErrorBoundary';
     7	import { ToastProvider } from './context/ToastContext';
     8	import App from './App.jsx';
     9	import './index.css';
    10	
    11	createRoot(document.getElementById('root')).render(
    12	  <StrictMode>
    13	    <ErrorBoundary>
    14	      <BrowserRouter>
    15	        <AuthProvider>
    16	          <SeasonProvider>
    17	            <ToastProvider>
    18	              <App />
    19	            </ToastProvider>
    20	          </SeasonProvider>
    21	        </AuthProvider>
    22	      </BrowserRouter>
    23	    </ErrorBoundary>
    24	  </StrictMode>,
    25	);
```

## src/pages/AccountPage.jsx (77 lines)
```
     1	import { useEffect, useState } from 'react';
     2	import { useNavigate } from 'react-router-dom';
     3	import { ChevronLeft } from 'lucide-react';
     4	import { supabase } from '../lib/supabase';
     5	import { useAuth } from '../context/AuthContext';
     6	import { usePrograms } from '../hooks/usePrograms';
     7	
     8	const ROLE_LABELS = { admin: 'Admin', coach: 'Coach', parent: 'Parent' };
     9	const VERSION = 'Skyfire v2.0';
    10	
    11	const SectionHeader = ({ children }) => (
    12	  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 8 }}>{children}</div>
    13	);
    14	
    15	export default function AccountPage() {
    16	  const navigate = useNavigate();
    17	  const { user, role, orgName, myChildren, guardianFirstName, signOut } = useAuth();
    18	  const { programs } = usePrograms();
    19	  const [lastName, setLastName] = useState(null);
    20	
    21	  useEffect(() => {
    22	    if (role !== 'parent' || !user?.id) return;
    23	    supabase.from('guardians').select('last_name').eq('user_id', user.id).maybeSingle()
    24	      .then(({ data }) => setLastName(data?.last_name ?? null));
    25	  }, [role, user?.id]);
    26	
    27	  const parentName = [guardianFirstName, lastName].filter(Boolean).join(' ').trim();
    28	  const displayName = (role === 'parent' && parentName) || user?.user_metadata?.full_name || user?.email || 'User';
    29	  const teamName = (teamId) => programs.find((p) => p.id === teamId)?.name || '—';
    30	
    31	  return (
    32	    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--em-bg-page)', padding: '16px 16px 32px' }}>
    33	      <button type="button" onClick={() => navigate(-1)} className="sf-press"
    34	        style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12 }}>
    35	        <ChevronLeft size={20} strokeWidth={1.75} /> Back
    36	      </button>
    37	
    38	      <section style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)', padding: 16, marginBottom: 16 }}>
    39	        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--em-text-primary)' }}>{displayName}</div>
    40	        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
    41	          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)' }}>
    42	            {ROLE_LABELS[role] || 'User'}
    43	          </span>
    44	          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{orgName || 'Skyfire'}</span>
    45	        </div>
    46	      </section>
    47	
    48	      {role === 'parent' && (myChildren?.length > 0) && (
    49	        <section style={{ marginBottom: 16 }}>
    50	          <SectionHeader>MY CHILDREN</SectionHeader>
    51	          <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
    52	            {myChildren.map((c, i) => (
    53	              <div key={c.playerId} style={{ padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
    54	                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)' }}>{c.firstName} {c.lastName}</span>
    55	                <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{teamName(c.teamId)}</span>
    56	              </div>
    57	            ))}
    58	          </div>
    59	        </section>
    60	      )}
    61	
    62	      <section style={{ marginBottom: 16 }}>
    63	        <SectionHeader>PREFERENCES</SectionHeader>
    64	        <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', padding: 16, fontSize: 13, color: 'var(--em-text-tertiary)' }}>
    65	          Notification preferences coming soon.
    66	        </div>
    67	      </section>
    68	
    69	      <button type="button" onClick={signOut} className="sf-press"
    70	        style={{ width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-danger)', fontSize: 14, fontWeight: 500, marginBottom: 24 }}>
    71	        Sign out
    72	      </button>
    73	
    74	      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--em-text-tertiary)' }}>{VERSION}</div>
    75	    </div>
    76	  );
    77	}
```

## src/pages/AdminHomePage.jsx (148 lines)
```
     1	import { useNavigate } from 'react-router-dom';
     2	import { useAuth } from '../context/AuthContext';
     3	import { useSeason } from '../context/SeasonContext';
     4	import { useAdminStats } from '../hooks/useAdminStats';
     5	import { useSeasons } from '../hooks/useSeasons';
     6	import { usePrograms } from '../hooks/usePrograms';
     7	import KpiGrid from '../components/admin/KpiGrid';
     8	import QuickActions from '../components/admin/QuickActions';
     9	import ActiveSeasonCard from '../components/admin/ActiveSeasonCard';
    10	import NextEventCard from '../components/admin/NextEventCard';
    11	import TeamPerformanceStrip from '../components/admin/TeamPerformanceStrip';
    12	import GettingStarted from '../components/admin/GettingStarted';
    13	
    14	// Derives a user-visible first name from either the Supabase user metadata
    15	// (full_name / name) or the email local-part. Falls back to "Coach" so the
    16	// greeting never reads "Welcome back, ".
    17	function firstNameFrom(user) {
    18	  if (!user) return 'Coach';
    19	  const md = user.user_metadata || {};
    20	  const raw = md.full_name || md.name || user.email || '';
    21	  const first = String(raw).split(/[\s.@]/)[0];
    22	  if (!first) return 'Coach';
    23	  return first.charAt(0).toUpperCase() + first.slice(1);
    24	}
    25	
    26	// Time-of-day-aware greeting. Boundaries: <12:00 morning, 12:00-16:59
    27	// afternoon, ≥17:00 evening. Uses the browser's local clock so the
    28	// greeting tracks where the user actually is.
    29	function greetingFor(date = new Date()) {
    30	  const h = date.getHours();
    31	  if (h < 12) return 'Good morning';
    32	  if (h < 17) return 'Good afternoon';
    33	  return 'Good evening';
    34	}
    35	
    36	export default function AdminHomePage() {
    37	  const { user, signOut } = useAuth();
    38	  const { activeSeason } = useSeason();
    39	  const stats = useAdminStats();
    40	  const { seasons } = useSeasons();
    41	  const { programs } = usePrograms();
    42	  const navigate = useNavigate();
    43	
    44	  const name = firstNameFrom(user);
    45	
    46	  // Temporary sign-out affordance until the Account page is built. Lives
    47	  // at the bottom of the admin dashboard so it's reachable without
    48	  // needing a top-nav menu yet.
    49	  const handleSignOut = async () => {
    50	    await signOut();
    51	    navigate('/login', { replace: true });
    52	  };
    53	
    54	  // overflow-x-hidden + max-w-full on the page wrapper is defense in
    55	  // depth — even if a child component escapes its box, nothing drags
    56	  // the page horizontally. `min-w-0` on each section lets flex children
    57	  // actually shrink below their content width (the default is auto,
    58	  // which refuses to shrink and widens the parent).
    59	  return (
    60	    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
    61	      <section className="min-w-0">
    62	        <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>
    63	          {greetingFor()},
    64	        </div>
    65	        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
    66	          {name}
    67	        </h1>
    68	        <div style={{
    69	          width: 40,
    70	          height: 3,
    71	          borderRadius: 999,
    72	          backgroundColor: 'var(--em-accent)',
    73	          marginTop: 8,
    74	        }} />
    75	      </section>
    76	
    77	      <section className="min-w-0" aria-label="Key metrics">
    78	        <KpiGrid stats={stats} />
    79	      </section>
    80	
    81	      <section className="min-w-0" aria-label="Quick actions">
    82	        <div style={{
    83	          fontSize: 11,
    84	          fontWeight: 600,
    85	          letterSpacing: '0.05em',
    86	          textTransform: 'uppercase',
    87	          color: 'var(--em-text-tertiary)',
    88	          marginBottom: 8,
    89	        }}>QUICK ACTIONS</div>
    90	        <QuickActions />
    91	      </section>
    92	
    93	      <section className="min-w-0">
    94	        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 8 }}>TEAMS</div>
    95	        <TeamPerformanceStrip programs={programs} navigate={navigate} />
    96	      </section>
    97	
    98	      <section className="min-w-0" aria-label="Active season">
    99	        <div style={{
   100	          fontSize: 11,
   101	          fontWeight: 600,
   102	          letterSpacing: '0.05em',
   103	          textTransform: 'uppercase',
   104	          color: 'var(--em-text-tertiary)',
   105	          marginBottom: 8,
   106	        }}>SEASON</div>
   107	        <ActiveSeasonCard season={activeSeason} />
   108	        <NextEventCard />
   109	      </section>
   110	
   111	      <section className="min-w-0">
   112	        <div style={{
   113	          fontSize: 11,
   114	          fontWeight: 600,
   115	          letterSpacing: '0.05em',
   116	          textTransform: 'uppercase',
   117	          color: 'var(--em-text-tertiary)',
   118	          marginBottom: 8,
   119	        }}>GETTING STARTED</div>
   120	        <GettingStarted
   121	          hasSeasons={seasons.length > 0}
   122	          hasPrograms={programs.length > 0}
   123	        />
   124	      </section>
   125	
   126	      {/* TEMP: sign-out affordance until the Account page is built. */}
   127	      <div style={{ borderTop: '1px solid var(--em-border-subtle)', paddingTop: 12 }}>
   128	        <button
   129	          type="button"
   130	          onClick={handleSignOut}
   131	          className="w-full sf-press flex items-center justify-between"
   132	          style={{
   133	            minHeight: 44,
   134	            padding: '0 4px',
   135	            background: 'none',
   136	            border: 'none',
   137	            color: 'var(--em-danger)',
   138	            fontSize: 14,
   139	            fontWeight: 500,
   140	          }}
   141	        >
   142	          <span>Sign out</span>
   143	          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
   144	        </button>
   145	      </div>
   146	    </div>
   147	  );
   148	}
```

## src/pages/AdminSeasonsPage.jsx (147 lines)
```
     1	import { useState } from 'react';
     2	import { Plus, Star } from 'lucide-react';
     3	import { useSeasons } from '../hooks/useSeasons';
     4	import SeasonFormSheet from '../components/admin/SeasonFormSheet';
     5	import Badge from '../components/shared/Badge';
     6	import EmptyState from '../components/shared/EmptyState';
     7	import LoadingSkeleton from '../components/shared/LoadingSkeleton';
     8	import Toast from '../components/shared/Toast';
     9	import ConfirmDialog from '../components/shared/ConfirmDialog';
    10	import { formatDateFull } from '../lib/formatters';
    11	import { Calendar } from 'lucide-react';
    12	
    13	export default function AdminSeasonsPage() {
    14	  const { seasons, loading, createSeason, updateSeason, setActive } = useSeasons();
    15	  const [sheetOpen, setSheetOpen] = useState(false);
    16	  const [editing, setEditing] = useState(null);
    17	  const [toast, setToast] = useState(null);
    18	  const [confirmSwitch, setConfirmSwitch] = useState(null);
    19	
    20	  const openNew = () => { setEditing(null); setSheetOpen(true); };
    21	  const openEdit = (s) => { setEditing(s); setSheetOpen(true); };
    22	
    23	  const handleSave = async (input) => {
    24	    const { error } = editing
    25	      ? await updateSeason(editing.id, input)
    26	      : await createSeason({ ...input, status: seasons.length === 0 ? 'active' : 'archived' });
    27	    if (error) setToast({ message: error, variant: 'error' });
    28	    else {
    29	      setToast({ message: editing ? 'Season updated' : 'Season created', variant: 'success' });
    30	      setSheetOpen(false);
    31	    }
    32	  };
    33	
    34	  const handleSetActive = async (id) => {
    35	    const { error } = await setActive(id);
    36	    setConfirmSwitch(null);
    37	    if (error) setToast({ message: error, variant: 'error' });
    38	    else setToast({ message: 'Active season updated', variant: 'success' });
    39	  };
    40	
    41	  return (
    42	    <div className="px-4 py-4 sf-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
    43	      <div className="flex items-center justify-between mb-4">
    44	        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 22 }}>
    45	          Seasons
    46	        </h1>
    47	        <button
    48	          type="button"
    49	          onClick={openNew}
    50	          className="flex items-center gap-1 font-semibold sf-press"
    51	          style={{
    52	            minHeight: 44, padding: '0 14px', borderRadius: 10,
    53	            backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 14,
    54	          }}
    55	        >
    56	          <Plus size={18} strokeWidth={1.75} /> New
    57	        </button>
    58	      </div>
    59	
    60	      {loading ? (
    61	        <LoadingSkeleton variant="card" count={3} />
    62	      ) : seasons.length === 0 ? (
    63	        <EmptyState
    64	          icon={Calendar}
    65	          title="No seasons yet"
    66	          description="Create your first season to start scheduling events."
    67	        />
    68	      ) : (
    69	        <ul className="flex flex-col gap-2">
    70	          {seasons.map((s) => {
    71	            const active = s.status === 'active';
    72	            // Card shell is the <li> itself — background, shadow, and
    73	            // borders live here so the edit + set-active controls inside
    74	            // can be real <button>s (invalid to nest button-in-button).
    75	            // Border stacking is intentionally minimal: `border` paints
    76	            // all four sides, then `borderLeft` overrides just the left
    77	            // edge with a thicker accent.
    78	            const cardStyle = {
    79	              backgroundColor: 'var(--em-bg-card)',
    80	              borderRadius: 10,
    81	              border: '1px solid var(--em-border-subtle)',
    82	              borderLeft: `4px solid ${active ? 'var(--em-success)' : 'var(--em-border-default)'}`,
    83	              boxShadow: 'var(--em-shadow-sm)',
    84	              overflow: 'hidden',
    85	            };
    86	            return (
    87	              <li key={s.id} style={cardStyle}>
    88	                <button
    89	                  type="button"
    90	                  onClick={() => openEdit(s)}
    91	                  className="w-full text-left p-4 sf-press flex flex-col"
    92	                >
    93	                  <div className="flex items-center justify-between mb-1">
    94	                    <span className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 16 }}>
    95	                      {s.name}
    96	                    </span>
    97	                    {active ? <Badge variant="success">Active</Badge> : <Badge>Archived</Badge>}
    98	                  </div>
    99	                  <span style={{ color: 'var(--em-text-secondary)', fontSize: 13 }}>
   100	                    {formatDateFull(s.start_date)} – {formatDateFull(s.end_date)}
   101	                  </span>
   102	                </button>
   103	                {!active && (
   104	                  <button
   105	                    type="button"
   106	                    onClick={() => setConfirmSwitch(s)}
   107	                    className="flex items-center gap-1 sf-press w-full"
   108	                    style={{
   109	                      minHeight: 44,
   110	                      padding: '0 16px',
   111	                      borderTop: '1px solid var(--em-border-subtle)',
   112	                      color: 'var(--em-accent)',
   113	                      fontSize: 13,
   114	                      fontWeight: 500,
   115	                    }}
   116	                  >
   117	                    <Star size={16} strokeWidth={1.75} /> Set as active
   118	                  </button>
   119	                )}
   120	              </li>
   121	            );
   122	          })}
   123	        </ul>
   124	      )}
   125	
   126	      <SeasonFormSheet
   127	        open={sheetOpen}
   128	        season={editing}
   129	        onClose={() => setSheetOpen(false)}
   130	        onSave={handleSave}
   131	      />
   132	      <ConfirmDialog
   133	        open={!!confirmSwitch}
   134	        title="Switch active season?"
   135	        message={`Only one season can be active at a time. ${confirmSwitch?.name} will become active and the current one will move to archived.`}
   136	        confirmLabel="Switch"
   137	        onCancel={() => setConfirmSwitch(null)}
   138	        onConfirm={() => handleSetActive(confirmSwitch.id)}
   139	      />
   140	      <Toast
   141	        message={toast?.message}
   142	        variant={toast?.variant}
   143	        onDismiss={() => setToast(null)}
   144	      />
   145	    </div>
   146	  );
   147	}
```

## src/pages/AdminTeamsPage.jsx (138 lines)
```
     1	import { useState } from 'react';
     2	import { Plus, Users } from 'lucide-react';
     3	import { usePrograms } from '../hooks/usePrograms';
     4	import { useSeason } from '../context/SeasonContext';
     5	import TeamFormSheet from '../components/admin/TeamFormSheet';
     6	import Badge from '../components/shared/Badge';
     7	import EmptyState from '../components/shared/EmptyState';
     8	import LoadingSkeleton from '../components/shared/LoadingSkeleton';
     9	import Toast from '../components/shared/Toast';
    10	
    11	const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };
    12	const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
    13	
    14	export default function AdminTeamsPage() {
    15	  const { activeSeason } = useSeason();
    16	  const { programs, loading, createProgram, updateProgram, deleteProgram } = usePrograms();
    17	  const [sheetOpen, setSheetOpen] = useState(false);
    18	  const [editing, setEditing] = useState(null);
    19	  const [toast, setToast] = useState(null);
    20	
    21	  const openNew = () => { setEditing(null); setSheetOpen(true); };
    22	  const openEdit = (p) => { setEditing(p); setSheetOpen(true); };
    23	
    24	  const save = async (payload) => {
    25	    const { error } = editing
    26	      ? await updateProgram(editing.id, payload)
    27	      : await createProgram(payload);
    28	    if (error) setToast({ message: error, variant: 'error' });
    29	    else {
    30	      setToast({ message: editing ? 'Team updated' : 'Team created', variant: 'success' });
    31	      setSheetOpen(false);
    32	    }
    33	  };
    34	
    35	  const remove = async (id) => {
    36	    const { error } = await deleteProgram(id);
    37	    if (error) setToast({ message: error, variant: 'error' });
    38	    else {
    39	      setToast({ message: 'Team deleted', variant: 'success' });
    40	      setSheetOpen(false);
    41	    }
    42	  };
    43	
    44	  if (!activeSeason && !loading) {
    45	    return (
    46	      <div className="px-4 py-4">
    47	        <EmptyState
    48	          icon={Users}
    49	          title="No active season"
    50	          description="Create and activate a season before adding teams."
    51	        />
    52	      </div>
    53	    );
    54	  }
    55	
    56	  return (
    57	    <div className="px-4 py-4 sf-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
    58	      <div className="flex items-center justify-between mb-4">
    59	        <div>
    60	          <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 22 }}>
    61	            Teams
    62	          </h1>
    63	          {activeSeason && (
    64	            <div style={{ color: 'var(--em-text-secondary)', fontSize: 13 }}>{activeSeason.name}</div>
    65	          )}
    66	        </div>
    67	        <button
    68	          type="button"
    69	          onClick={openNew}
    70	          className="flex items-center gap-1 font-semibold sf-press"
    71	          style={{
    72	            minHeight: 44, padding: '0 14px', borderRadius: 10,
    73	            backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 14,
    74	          }}
    75	        >
    76	          <Plus size={18} strokeWidth={1.75} /> New
    77	        </button>
    78	      </div>
    79	
    80	      {loading ? (
    81	        <LoadingSkeleton variant="card" count={4} />
    82	      ) : programs.length === 0 ? (
    83	        <EmptyState
    84	          icon={Users}
    85	          title="No teams yet"
    86	          description="Add your first team to start building rosters."
    87	        />
    88	      ) : (
    89	        <ul className="flex flex-col gap-2">
    90	          {programs.map((p) => (
    91	            <li key={p.id}>
    92	              <button
    93	                type="button"
    94	                onClick={() => openEdit(p)}
    95	                className="w-full text-left p-4 sf-press"
    96	                style={{
    97	                  backgroundColor: 'var(--em-bg-card)',
    98	                  borderRadius: 10,
    99	                  border: '1px solid var(--em-border-subtle)',
   100	                  borderLeft: `4px solid ${p.team_color || 'var(--em-border-default)'}`,
   101	                  boxShadow: 'var(--em-shadow-sm)',
   102	                }}
   103	              >
   104	                <div className="flex items-center justify-between mb-1">
   105	                  <span className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 16 }}>
   106	                    {p.name}
   107	                  </span>
   108	                  <div className="flex gap-1">
   109	                    <Badge>{p.age_group}</Badge>
   110	                    <Badge variant="info">{CIRCUIT_LABELS[p.circuit] || p.circuit}</Badge>
   111	                  </div>
   112	                </div>
   113	                <div style={{ color: 'var(--em-text-secondary)', fontSize: 13 }}>
   114	                  {p.practice_day ? `${DAY_LABELS[p.practice_day]}` : 'No practice day set'}
   115	                  {p.practice_location ? ` · ${p.practice_location}` : ''}
   116	                  {p.circuit === 'aau' && p.circuit_name ? ` · ${p.circuit_name}` : ''}
   117	                </div>
   118	              </button>
   119	            </li>
   120	          ))}
   121	        </ul>
   122	      )}
   123	
   124	      <TeamFormSheet
   125	        open={sheetOpen}
   126	        program={editing}
   127	        onClose={() => setSheetOpen(false)}
   128	        onSave={save}
   129	        onDelete={remove}
   130	      />
   131	      <Toast
   132	        message={toast?.message}
   133	        variant={toast?.variant}
   134	        onDismiss={() => setToast(null)}
   135	      />
   136	    </div>
   137	  );
   138	}
```

## src/pages/EventDetailPage.jsx (147 lines)
```
     1	import { lazy, Suspense, useEffect, useState } from 'react';
     2	import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
     3	import { Repeat } from 'lucide-react';
     4	import { supabase } from '../lib/supabase';
     5	import AddToCalendarButton from '../components/event/AddToCalendarButton';
     6	import { useAuth } from '../context/AuthContext';
     7	import { useToast } from '../context/ToastContext';
     8	import { useEventDetail } from '../hooks/useEventDetail';
     9	import { useRsvps } from '../hooks/useRsvps';
    10	import EventDetailHeader from '../components/event/EventDetailHeader';
    11	import EventDetailTab from '../components/event/EventDetailTab';
    12	import EventLocationTab from '../components/event/EventLocationTab';
    13	import EventRsvpTab from '../components/event/EventRsvpTab';
    14	import EventDutiesTab from '../components/event/EventDutiesTab';
    15	import EventCommentsTab from '../components/event/EventCommentsTab';
    16	import EventRidesTab from '../components/event/EventRidesTab';
    17	import EventNotes from '../components/event/EventNotes';
    18	import EventCancelActions from '../components/event/EventCancelActions';
    19	const EventCheckinOverlay = lazy(() => import('../components/event/EventCheckinOverlay'));
    20	const CreateActivityWizard = lazy(() => import('../components/wizard/CreateActivityWizard'));
    21	
    22	const SectionHeader = ({ children, sectionKey }) => (
    23	  <h2 data-section={sectionKey} style={{ fontSize: 16, fontWeight: 700, color: 'var(--em-text-primary)', padding: '0 16px', marginTop: 16, marginBottom: 8 }}>{children}</h2>
    24	);
    25	
    26	export default function EventDetailPage() {
    27	  const { id } = useParams();
    28	  const navigate = useNavigate();
    29	  const [searchParams] = useSearchParams();
    30	  const location = useLocation();
    31	  const { orgId, role } = useAuth();
    32	  const { showToast } = useToast();
    33	  const { event, loading: eventLoading, refetch, patchEvent } = useEventDetail(id, location.state?.event);
    34	  const teamId = event?.team_id || null;
    35	  const { rsvps, roster, loading: rsvpLoading, setRsvp, saveNote } = useRsvps(id, teamId);
    36	  const [editing, setEditing] = useState(false);
    37	  const [editMode, setEditMode] = useState('single');
    38	  const [showCheckin, setShowCheckin] = useState(false);
    39	  const [dutyCount, setDutyCount] = useState(0);
    40	
    41	  useEffect(() => {
    42	    if (!id) return;
    43	    supabase.from('event_duties').select('id', { count: 'exact', head: true }).eq('event_id', id)
    44	      .then(({ count }) => setDutyCount(count || 0));
    45	  }, [id]);
    46	
    47	  useEffect(() => {
    48	    if (searchParams.get('tab') === 'rsvps' && !rsvpLoading && roster.length > 0) {
    49	      const el = document.querySelector('[data-section="rsvps"]');
    50	      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    51	    }
    52	  }, [searchParams, rsvpLoading, roster.length]);
    53	
    54	  if (eventLoading) return <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100dvh' }} />;
    55	  if (!event) return <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100dvh', padding: 24, color: 'var(--em-text-tertiary)' }}>Event not found</div>;
    56	
    57	  const team = event.teams;
    58	  const teamColor = team?.team_color || 'var(--em-text-tertiary)';
    59	  const isStaff = role === 'admin' || role === 'coach';
    60	
    61	  const rsvpMap = {};
    62	  rsvps.forEach((r) => { rsvpMap[r.player_id] = r.response; });
    63	
    64	  const openEdit = () => {
    65	    if (event.parent_event_id) {
    66	      const all = window.confirm('Edit all future events in this series?\n\nOK = all future\nCancel = this event only');
    67	      setEditMode(all ? 'series' : 'single');
    68	    } else {
    69	      setEditMode('single');
    70	    }
    71	    setEditing(true);
    72	  };
    73	
    74	  const doDelete = async () => {
    75	    try {
    76	      if (event.parent_event_id) {
    77	        // Recurring: first ask about the whole series.
    78	        if (window.confirm('Delete ALL future events in this series?\n\nOK = delete all future\nCancel = delete only this one')) {
    79	          const { error: serErr } = await supabase.from('events').delete()
    80	            .eq('parent_event_id', event.parent_event_id)
    81	            .gte('start_at', event.start_at);
    82	          if (serErr) throw serErr;
    83	          await supabase.from('events').delete().eq('id', event.id);
    84	        } else {
    85	          if (!window.confirm('Delete just this one event?')) return;
    86	          const { error } = await supabase.from('events').delete().eq('id', event.id);
    87	          if (error) throw error;
    88	        }
    89	      } else {
    90	        if (!window.confirm('Delete this event?')) return;
    91	        const { error } = await supabase.from('events').delete().eq('id', event.id);
    92	        if (error) throw error;
    93	      }
    94	      navigate('/schedule');
    95	    } catch (err) {
    96	      showToast(`Delete failed: ${err.message}`, 'error');
    97	    }
    98	  };
    99	
   100	  return (
   101	    <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' }}>
   102	      <EventDetailHeader event={event} team={team} isStaff={isStaff} onEdit={openEdit} onDelete={doDelete} onCheckin={() => setShowCheckin(true)} />
   103	
   104	      {event.parent_event_id && (
   105	        <div style={{ padding: '6px 16px', fontSize: 12, color: 'var(--em-text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
   106	          <Repeat size={12} strokeWidth={1.75} />
   107	          Part of a recurring series
   108	          <button type="button" onClick={async () => {
   109	            if (!window.confirm('Remove this event from the series? It will become standalone.')) return;
   110	            await supabase.from('events').update({ parent_event_id: null }).eq('id', event.id);
   111	            patchEvent({ parent_event_id: null });
   112	            refetch();
   113	          }} style={{ fontSize: 12, color: 'var(--em-accent)', background: 'none', border: 'none', padding: 0, marginLeft: 'auto' }}>
   114	            Remove from series
   115	          </button>
   116	        </div>
   117	      )}
   118	
   119	      <EventDetailTab event={event} />
   120	
   121	      <SectionHeader>Location</SectionHeader>
   122	      <EventLocationTab event={event} />
   123	
   124	      <SectionHeader sectionKey="rsvps">RSVPs</SectionHeader>
   125	      <EventRsvpTab roster={roster} rsvps={rsvps} rsvpMap={rsvpMap} teamColor={teamColor} onSetRsvp={setRsvp} onSaveNote={saveNote} loading={rsvpLoading} />
   126	
   127	      {dutyCount > 0 && (<><SectionHeader>Volunteers</SectionHeader><EventDutiesTab eventId={event.id} /></>)}
   128	
   129	      <SectionHeader>Rides</SectionHeader>
   130	      <EventRidesTab eventId={event.id} eventStartAt={event.start_at} eventLocation={event.location} eventEndAt={event.end_at} />
   131	
   132	      {(event.notes || event.coach_notes) && (
   133	        <><SectionHeader>Notes</SectionHeader><EventNotes notes={event.notes} coachNotes={event.coach_notes} /></>
   134	      )}
   135	
   136	      <AddToCalendarButton event={event} />
   137	
   138	      <SectionHeader>Comments</SectionHeader>
   139	      <EventCommentsTab eventId={event.id} />
   140	
   141	      {isStaff && <EventCancelActions event={event} onStatusChange={(status) => { patchEvent({ status }); refetch(); }} />}
   142	
   143	      {editing && <Suspense fallback={null}><CreateActivityWizard orgId={orgId} editEvent={event} editMode={editMode} onClose={() => setEditing(false)} onCreated={refetch} /></Suspense>}
   144	      {showCheckin && <Suspense fallback={null}><EventCheckinOverlay eventId={event.id} roster={roster} teamColor={teamColor} onClose={() => setShowCheckin(false)} /></Suspense>}
   145	    </div>
   146	  );
   147	}
```

## src/pages/ForgotPasswordPage.jsx (62 lines)
```
     1	import { Link } from 'react-router-dom';
     2	import { KeyRound } from 'lucide-react';
     3	
     4	// Stub — full flow (email input + resetPasswordForEmail + success state)
     5	// arrives with the auth-polish prompt. For now we ship a branded page so
     6	// the /forgot-password link from LoginPage has somewhere to land.
     7	export default function ForgotPasswordPage() {
     8	  return (
     9	    <div
    10	      className="sf-fullscreen flex items-center justify-center p-6"
    11	      style={{ backgroundColor: 'var(--em-header)' }}
    12	    >
    13	      <div
    14	        className="w-full text-center"
    15	        style={{
    16	          maxWidth: 400,
    17	          backgroundColor: 'var(--em-bg-card)',
    18	          borderRadius: 16,
    19	          padding: 28,
    20	          boxShadow: 'var(--em-shadow-lg)',
    21	        }}
    22	      >
    23	        <div
    24	          className="inline-flex items-center justify-center mb-4"
    25	          style={{
    26	            width: 72,
    27	            height: 72,
    28	            borderRadius: '50%',
    29	            backgroundColor: 'var(--em-accent-soft)',
    30	            color: 'var(--em-accent)',
    31	          }}
    32	          aria-hidden="true"
    33	        >
    34	          <KeyRound size={32} strokeWidth={1.75} />
    35	        </div>
    36	        <h1
    37	          className="font-semibold"
    38	          style={{ color: 'var(--em-text-primary)', fontSize: 20, marginBottom: 8 }}
    39	        >
    40	          Reset password
    41	        </h1>
    42	        <p style={{ color: 'var(--em-text-secondary)', fontSize: 14, marginBottom: 20 }}>
    43	          Password reset is coming soon. Ask an admin to send you a new invite.
    44	        </p>
    45	        <Link
    46	          to="/login"
    47	          className="inline-flex items-center justify-center font-semibold sf-press"
    48	          style={{
    49	            minHeight: 44,
    50	            padding: '0 20px',
    51	            borderRadius: 10,
    52	            backgroundColor: 'var(--em-accent)',
    53	            color: 'var(--em-text-inverse)',
    54	            fontSize: 15,
    55	          }}
    56	        >
    57	          Back to sign in
    58	        </Link>
    59	      </div>
    60	    </div>
    61	  );
    62	}
```

## src/pages/HomePage.jsx (43 lines)
```
     1	import { lazy, Suspense } from 'react';
     2	import { House } from 'lucide-react';
     3	import { useAuth } from '../context/AuthContext';
     4	import { isAdmin } from '../lib/permissions';
     5	import ParentHomePage from './ParentHomePage';
     6	import PlaceholderPage from './PlaceholderPage';
     7	import WelcomeOverlay from '../components/shared/WelcomeOverlay';
     8	import InstallPrompt from '../components/shared/InstallPrompt';
     9	
    10	const AdminHomePage = lazy(() => import('./AdminHomePage'));
    11	const LAZY_FALLBACK = <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading...</div>;
    12	
    13	// Home dispatches on role: admins land on the KPI dashboard, parents get
    14	// the personalized schedule view, and coaches see a placeholder until
    15	// their role-specific dashboard is built.
    16	export default function HomePage() {
    17	  const { role } = useAuth();
    18	  if (role === 'parent') return (
    19	    <>
    20	      <WelcomeOverlay />
    21	      <InstallPrompt />
    22	      <ParentHomePage />
    23	    </>
    24	  );
    25	  if (isAdmin(role)) return (
    26	    <>
    27	      <WelcomeOverlay />
    28	      <InstallPrompt />
    29	      <Suspense fallback={LAZY_FALLBACK}><AdminHomePage /></Suspense>
    30	    </>
    31	  );
    32	  return (
    33	    <>
    34	      <WelcomeOverlay />
    35	      <InstallPrompt />
    36	      <PlaceholderPage
    37	        icon={House}
    38	        title="Home"
    39	        description="Your personalized dashboard will live here."
    40	      />
    41	    </>
    42	  );
    43	}
```

## src/pages/LoginPage.jsx (146 lines)
```
     1	import { useState, useEffect } from 'react';
     2	import { Link, useNavigate, useLocation } from 'react-router-dom';
     3	import { Eye, EyeOff } from 'lucide-react';
     4	import { useAuth } from '../context/AuthContext';
     5	
     6	// Skyfire brand landing + sign-in. Email auto-trims on submit. Inline field
     7	// errors (not toasts) so the user sees exactly which field failed.
     8	export default function LoginPage() {
     9	  const { signIn } = useAuth();
    10	  const navigate = useNavigate();
    11	  const location = useLocation();
    12	  const from = location.state?.from?.pathname || '/';
    13	
    14	  const [email, setEmail] = useState('');
    15	  const [password, setPassword] = useState('');
    16	  const [showPw, setShowPw] = useState(false);
    17	  const [errors, setErrors] = useState({});
    18	  const [submitting, setSubmitting] = useState(false);
    19	
    20	  // Reset brand tokens to Skyfire defaults on mount so the login page
    21	  // always shows dark navy regardless of cached org colors.
    22	  useEffect(() => {
    23	    const r = document.documentElement.style;
    24	    r.setProperty('--em-header', '#151525');
    25	    r.setProperty('--em-accent', '#C9952E');
    26	    r.setProperty('--em-accent-hover', '#D4A843');
    27	    r.setProperty('--em-accent-soft', 'rgba(201,149,46,0.1)');
    28	    r.setProperty('--em-text-on-dark', '#F5F0E8');
    29	  }, []);
    30	
    31	  const onSubmit = async (e) => {
    32	    e.preventDefault();
    33	    const trimmed = email.trim();
    34	    const next = {};
    35	    if (!trimmed) next.email = 'Email is required';
    36	    else if (!/^\S+@\S+\.\S+$/.test(trimmed)) next.email = 'Enter a valid email';
    37	    if (!password) next.password = 'Password is required';
    38	    setErrors(next);
    39	    if (Object.keys(next).length > 0) return;
    40	
    41	    setSubmitting(true);
    42	    const { error } = await signIn(trimmed, password);
    43	    setSubmitting(false);
    44	    if (error) return setErrors({ form: error.message || 'Unable to sign in' });
    45	    navigate(from, { replace: true });
    46	  };
    47	
    48	  const input = (err) => ({
    49	    width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10,
    50	    border: `1px solid ${err ? 'var(--em-danger)' : 'var(--em-border-default)'}`,
    51	    backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
    52	    fontSize: 15, outline: 'none',
    53	  });
    54	  const lbl = { color: 'var(--em-text-secondary)', fontSize: 13 };
    55	  const err = { color: 'var(--em-danger)', fontSize: 12, marginTop: 4 };
    56	
    57	  return (
    58	    <div
    59	      className="sf-fullscreen flex items-center justify-center p-6"
    60	      style={{ backgroundColor: 'var(--em-header)' }}
    61	    >
    62	      <div
    63	        className="w-full sf-fade-in"
    64	        style={{
    65	          maxWidth: 400, backgroundColor: 'var(--em-bg-card)',
    66	          borderRadius: 16, padding: 28, boxShadow: 'var(--em-shadow-lg)',
    67	        }}
    68	      >
    69	        <div className="flex flex-col items-center mb-6">
    70	          <img src="/phoenix-logo.jpg" alt="Skyfire"
    71	            style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 16 }} />
    72	        </div>
    73	
    74	        <form onSubmit={onSubmit} noValidate>
    75	          <label className="block mb-3">
    76	            <span className="block mb-1 font-medium" style={lbl}>Email</span>
    77	            <input
    78	              type="email" autoComplete="email" value={email}
    79	              onChange={(e) => setEmail(e.target.value)}
    80	              style={input(!!errors.email)} aria-invalid={!!errors.email}
    81	            />
    82	            {errors.email && <div style={err}>{errors.email}</div>}
    83	          </label>
    84	
    85	          <label className="block mb-3">
    86	            <span className="block mb-1 font-medium" style={lbl}>Password</span>
    87	            <div className="relative">
    88	              <input
    89	                type={showPw ? 'text' : 'password'} autoComplete="current-password"
    90	                value={password} onChange={(e) => setPassword(e.target.value)}
    91	                style={{ ...input(!!errors.password), paddingRight: 48 }}
    92	                aria-invalid={!!errors.password}
    93	              />
    94	              <button
    95	                type="button" onClick={() => setShowPw((v) => !v)}
    96	                className="absolute flex items-center justify-center sf-press"
    97	                style={{ top: 0, right: 0, width: 44, height: 44, color: 'var(--em-text-tertiary)' }}
    98	                aria-label={showPw ? 'Hide password' : 'Show password'}
    99	              >
   100	                {showPw
   101	                  ? <EyeOff size={20} strokeWidth={1.75} />
   102	                  : <Eye size={20} strokeWidth={1.75} />}
   103	              </button>
   104	            </div>
   105	            {errors.password && <div style={err}>{errors.password}</div>}
   106	          </label>
   107	
   108	          {errors.form && (
   109	            <div
   110	              className="mb-3"
   111	              style={{
   112	                color: 'var(--em-danger)', backgroundColor: 'var(--em-danger-soft)',
   113	                padding: '8px 12px', borderRadius: 8, fontSize: 13,
   114	              }}
   115	            >
   116	              {errors.form}
   117	            </div>
   118	          )}
   119	
   120	          <button
   121	            type="submit" disabled={submitting}
   122	            className="w-full font-semibold sf-press sf-bounce-tap"
   123	            style={{
   124	              minHeight: 44, borderRadius: 10, fontSize: 15,
   125	              backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
   126	              opacity: submitting ? 0.7 : 1,
   127	            }}
   128	          >{submitting ? 'Signing in…' : 'Sign in'}</button>
   129	
   130	          <div className="flex justify-center mt-2">
   131	            <Link
   132	              to="/forgot-password"
   133	              className="sf-press inline-flex items-center justify-center"
   134	              style={{
   135	                minHeight: 44, padding: '0 12px',
   136	                color: 'var(--em-accent)', fontSize: 13, fontWeight: 500,
   137	              }}
   138	            >
   139	              Forgot password?
   140	            </Link>
   141	          </div>
   142	        </form>
   143	      </div>
   144	    </div>
   145	  );
   146	}
```

## src/pages/MessagesPage.jsx (10 lines)
```
     1	import TextEmptyState from '../components/shared/TextEmptyState';
     2	
     3	export default function MessagesPage() {
     4	  return (
     5	    <TextEmptyState
     6	      heading="No messages yet"
     7	      message="Team announcements and messages will appear here."
     8	    />
     9	  );
    10	}
```

## src/pages/ParentHomePage.jsx (150 lines)
```
     1	import { useMemo } from 'react';
     2	import { useNavigate } from 'react-router-dom';
     3	import { useAuth } from '../context/AuthContext';
     4	import { useActivities } from '../hooks/useActivities';
     5	import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
     6	import { useEventRideCounts } from '../hooks/useEventRideCounts';
     7	import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
     8	import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
     9	import NextUpCard from '../components/schedule/NextUpCard';
    10	import CompactCard from '../components/schedule/CompactCard';
    11	import TextEmptyState from '../components/shared/TextEmptyState';
    12	import { groupByDate, formatDateHeader } from '../lib/scheduleHelpers';
    13	
    14	function firstNameFrom(user) {
    15	  const f = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '').split(/[\s.@]/)[0];
    16	  return f ? f.charAt(0).toUpperCase() + f.slice(1) : 'there';
    17	}
    18	
    19	function greetingFor(date = new Date()) {
    20	  const h = date.getHours();
    21	  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    22	}
    23	
    24	export default function ParentHomePage() {
    25	  const { user, guardianFirstName } = useAuth();
    26	  const { activities, loading, refetch } = useActivities();
    27	  const rsvpCounts = useEventRsvpCounts(activities);
    28	  const rideCounts = useEventRideCounts(activities);
    29	  const dutyCounts = useEventDutyCounts(activities);
    30	  const navigate = useNavigate();
    31	  const name = guardianFirstName ? guardianFirstName.charAt(0).toUpperCase() + guardianFirstName.slice(1) : firstNameFrom(user);
    32	  const now = Date.now(), weekEnd = now + 7 * 24 * 60 * 60 * 1000;
    33	  useRefetchOnVisible(refetch);
    34	
    35	  const myTeams = useMemo(() => {
    36	    const map = new Map();
    37	    for (const a of activities) {
    38	      if (!a.team_id || map.has(a.team_id)) continue;
    39	      map.set(a.team_id, {
    40	        id: a.team_id,
    41	        name: a.teams?.name || '—',
    42	        team_color: a.teams?.team_color || 'var(--em-neutral)',
    43	        sort_order: a.teams?.sort_order ?? 999,
    44	      });
    45	    }
    46	    return [...map.values()].sort((x, y) => x.sort_order - y.sort_order);
    47	  }, [activities]);
    48	
    49	  const nextByTeam = useMemo(() => {
    50	    const out = {};
    51	    const sorted = [...activities].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    52	    for (const a of sorted) {
    53	      if (!a.team_id || a.status === 'cancelled') continue;
    54	      if (new Date(a.start_at).getTime() < now) continue;
    55	      if (!out[a.team_id]) out[a.team_id] = a;
    56	    }
    57	    return out;
    58	  }, [activities, now]);
    59	
    60	  const nextEventOverall = activities.find((a) => a.start_at && a.status !== 'cancelled' && new Date(a.start_at).getTime() >= now) || null;
    61	  const thisWeek = useMemo(() => activities
    62	    .filter((a) => {
    63	      if (!a.start_at || a.status === 'cancelled') return false;
    64	      const t = new Date(a.start_at).getTime();
    65	      return t >= now && t <= weekEnd;
    66	    })
    67	    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    68	    [activities, now, weekEnd]);
    69	
    70	  if (loading) return <div style={{ padding: 24, color: 'var(--em-text-tertiary)' }}>Loading...</div>;
    71	
    72	  return (
    73	    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
    74	      <section>
    75	        <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>{greetingFor()},</div>
    76	        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{name}</h1>
    77	        <div style={{ width: 40, height: 3, borderRadius: 999, backgroundColor: 'var(--em-accent)', marginTop: 8 }} />
    78	      </section>
    79	
    80	      <section>
    81	        <SectionHeader>NEXT UP</SectionHeader>
    82	        {myTeams.length === 0 ? <EmptyLine>No teams yet</EmptyLine> : !Object.keys(nextByTeam).length ? <TextEmptyState heading="All caught up" message="No upcoming events for your teams. Check back when the schedule updates." />
    83	          : myTeams.map((t) => (
    84	            nextByTeam[t.id]
    85	              ? <NextUpCard key={t.id} event={nextByTeam[t.id]} rsvpCount={rsvpCounts[nextByTeam[t.id].id]} rideCount={rideCounts[nextByTeam[t.id].id]} dutyCount={dutyCounts[nextByTeam[t.id].id]} />
    86	              : <EmptyLine key={t.id}>No upcoming events for {t.name}</EmptyLine>
    87	          ))}
    88	      </section>
    89	
    90	      {myTeams.length > 0 && (
    91	        <section>
    92	          <SectionHeader>MY TEAMS</SectionHeader>
    93	          <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 6 }}>
    94	            {myTeams.map((t) => <TeamCard key={t.id} team={t} onClick={() => navigate(`/schedule?team=${t.id}`)} />)}
    95	          </div>
    96	        </section>
    97	      )}
    98	
    99	      <section>
   100	        <SectionHeader>THIS WEEK</SectionHeader>
   101	        {thisWeek.length > 0 ? groupByDate(thisWeek).map(([date, evts]) => (
   102	          <div key={date}>
   103	            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--em-text-tertiary)', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' }}>
   104	              {formatDateHeader(date)}
   105	            </div>
   106	            <div className="flex flex-col gap-2">
   107	              {evts.map((e) => <CompactCard key={e.id} event={e} />)}
   108	            </div>
   109	          </div>
   110	        )) : (
   111	          <TextEmptyState heading="Nothing this week" message={nextEventOverall ? `Your next event is ${new Date(nextEventOverall.start_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'No upcoming events scheduled'} />
   112	        )}
   113	      </section>
   114	    </div>
   115	  );
   116	}
   117	
   118	function SectionHeader({ children }) {
   119	  return (
   120	    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 8 }}>
   121	      {children}
   122	    </div>
   123	  );
   124	}
   125	
   126	function EmptyLine({ children }) {
   127	  return (
   128	    <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', padding: '8px 12px', marginBottom: 8 }}>
   129	      {children}
   130	    </div>
   131	  );
   132	}
   133	
   134	function TeamCard({ team, onClick }) {
   135	  return (
   136	    <button type="button" onClick={onClick} className="sf-press"
   137	      style={{
   138	        flexShrink: 0, minWidth: 140, minHeight: 80, borderRadius: 10, overflow: 'hidden',
   139	        border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
   140	        boxShadow: 'var(--em-shadow-sm)', display: 'flex', alignItems: 'stretch', textAlign: 'left',
   141	      }}
   142	    >
   143	      <div style={{ width: 3, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
   144	      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
   145	        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' }}>{team.name}</span>
   146	        <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>0-0</span>
   147	      </div>
   148	    </button>
   149	  );
   150	}
```

## src/pages/PlaceholderPage.jsx (16 lines)
```
     1	import EmptyState from '../components/shared/EmptyState';
     2	
     3	// One-shot placeholder for stub routes. Any page that only exists so the
     4	// router has somewhere to land should render this until a real
     5	// implementation lands.
     6	export default function PlaceholderPage({ icon, title, description }) {
     7	  return (
     8	    <div className="pt-8">
     9	      <EmptyState
    10	        icon={icon}
    11	        title={title}
    12	        description={description || 'Coming soon.'}
    13	      />
    14	    </div>
    15	  );
    16	}
```

## src/pages/SchedulePage.jsx (150 lines)
```
     1	import { lazy, Suspense, useState, useMemo, useEffect } from 'react';
     2	import { useAuth } from '../context/AuthContext';
     3	import { useActivities } from '../hooks/useActivities';
     4	import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
     5	import { useEventRideCounts } from '../hooks/useEventRideCounts';
     6	import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
     7	import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
     8	import { Plus, ChevronDown } from 'lucide-react';
     9	import FilterBar from '../components/schedule/FilterBar';
    10	import NextUpCard from '../components/schedule/NextUpCard';
    11	import DateGroupedList from '../components/schedule/DateGroupedList';
    12	import TextEmptyState from '../components/shared/TextEmptyState';
    13	const CreateActivityWizard = lazy(() => import('../components/wizard/CreateActivityWizard'));
    14	
    15	export default function SchedulePage() {
    16	  const { orgId } = useAuth();
    17	  const { activities, loading, refetch } = useActivities(orgId);
    18	  const rsvpCounts = useEventRsvpCounts(activities);
    19	  const rideCounts = useEventRideCounts(activities);
    20	  const dutyCounts = useEventDutyCounts(activities);
    21	  const [selectedTeam, setSelectedTeam] = useState(() => new URLSearchParams(window.location.search).get('team'));
    22	  const [selectedType, setSelectedType] = useState(null);
    23	  const [showAll, setShowAll] = useState(false);
    24	  const [showWizard, setShowWizard] = useState(false);
    25	  const [showCancelled, setShowCancelled] = useState(false);
    26	
    27	  // tick increments every 60s so the upcoming / thisWeek / remaining
    28	  // memos re-evaluate against a fresh `now`. Without this, a user who
    29	  // leaves the schedule open would see nextEvent stuck on an event
    30	  // that has already ended.
    31	  const [tick, setTick] = useState(0);
    32	  useEffect(() => {
    33	    const id = setInterval(() => setTick((t) => t + 1), 60000);
    34	    return () => clearInterval(id);
    35	  }, []);
    36	
    37	  useRefetchOnVisible(refetch);
    38	
    39	  const now = useMemo(() => new Date(), [tick]);
    40	  const weekEnd = useMemo(() => new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), [now]);
    41	
    42	  const filtered = useMemo(() => {
    43	    let list = activities;
    44	    if (selectedTeam) list = list.filter((a) => a.team_id === selectedTeam);
    45	    if (selectedType) list = list.filter((a) => a.event_type === selectedType);
    46	    if (!showCancelled) list = list.filter((a) => a.status !== 'cancelled');
    47	    return list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    48	  }, [activities, selectedTeam, selectedType, showCancelled]);
    49	
    50	  const upcoming = useMemo(() => filtered.filter((a) => new Date(a.start_at) >= now), [filtered, tick, now]);
    51	  const nextEvent = upcoming[0] || null;
    52	  const thisWeek = useMemo(() => upcoming.filter((a) => new Date(a.start_at) <= weekEnd), [upcoming, tick, weekEnd]);
    53	  const remaining = useMemo(() => upcoming.filter((a) => new Date(a.start_at) > weekEnd), [upcoming, tick, weekEnd]);
    54	
    55	  if (loading) return <div style={{ padding: 24, color: 'var(--em-text-tertiary)' }}>Loading...</div>;
    56	
    57	  return (
    58	    <>
    59	      <div className="px-4 py-4">
    60	        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20, marginBottom: 4 }}>
    61	          Schedule
    62	        </h1>
    63	        <div style={{ width: 32, height: 3, backgroundColor: 'var(--em-accent)', borderRadius: 2, marginBottom: 16 }} />
    64	
    65	        {nextEvent && <NextUpCard event={nextEvent} rsvpCount={rsvpCounts[nextEvent.id]} rideCount={rideCounts[nextEvent.id]} dutyCount={dutyCounts[nextEvent.id]} onRefresh={refetch} />}
    66	
    67	        <FilterBar
    68	          teams={activities}
    69	          selectedTeam={selectedTeam}
    70	          onSelectTeam={setSelectedTeam}
    71	          selectedType={selectedType}
    72	          onSelectType={setSelectedType}
    73	          showCancelled={showCancelled}
    74	          onToggleCancelled={() => setShowCancelled((v) => !v)}
    75	        />
    76	
    77	        {filtered.length === 0 ? (
    78	          <TextEmptyState heading="No events found" message="Try changing your filters or check back later." />
    79	        ) : thisWeek.length > 0 ? (
    80	          <div style={{ marginTop: 16 }}>
    81	            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
    82	              This week
    83	            </div>
    84	            <DateGroupedList events={thisWeek} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} />
    85	          </div>
    86	        ) : (
    87	          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--em-text-tertiary)' }}>
    88	            <div style={{ fontSize: 15, fontWeight: 500 }}>No events this week</div>
    89	            <div style={{ fontSize: 13, marginTop: 4 }}>Tap + to create one</div>
    90	          </div>
    91	        )}
    92	
    93	        {remaining.length > 0 && !showAll && (
    94	          <button
    95	            type="button"
    96	            onClick={() => setShowAll(true)}
    97	            className="sf-press"
    98	            style={{
    99	              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
   100	              width: '100%', minHeight: 44, marginTop: 16, borderRadius: 10,
   101	              border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
   102	              color: 'var(--em-text-secondary)', fontSize: 14, fontWeight: 500,
   103	            }}
   104	          >
   105	            See full schedule ({remaining.length} more)
   106	            <ChevronDown size={16} strokeWidth={1.75} />
   107	          </button>
   108	        )}
   109	
   110	        {showAll && remaining.length > 0 && (
   111	          <div style={{ marginTop: 16 }}>
   112	            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
   113	              Upcoming
   114	            </div>
   115	            <DateGroupedList events={remaining} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} />
   116	          </div>
   117	        )}
   118	      </div>
   119	
   120	      {/* FAB — outside content div, no transform ancestor */}
   121	      <button
   122	        type="button"
   123	        onClick={() => setShowWizard(true)}
   124	        className="sf-press sf-bounce-tap"
   125	        aria-label="Create event"
   126	        style={{
   127	          position: 'fixed',
   128	          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)',
   129	          right: 16, width: 56, height: 56, borderRadius: 28,
   130	          backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
   131	          border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
   132	          display: 'flex', alignItems: 'center', justifyContent: 'center',
   133	          zIndex: 100,
   134	        }}
   135	      >
   136	        <Plus size={24} strokeWidth={2} />
   137	      </button>
   138	
   139	      {showWizard && (
   140	        <Suspense fallback={null}>
   141	          <CreateActivityWizard
   142	            orgId={orgId}
   143	            onClose={() => setShowWizard(false)}
   144	            onCreated={refetch}
   145	          />
   146	        </Suspense>
   147	      )}
   148	    </>
   149	  );
   150	}
```

## src/pages/ScorePage.jsx (12 lines)
```
     1	import { Trophy } from 'lucide-react';
     2	import PlaceholderPage from './PlaceholderPage';
     3	
     4	export default function ScorePage() {
     5	  return (
     6	    <PlaceholderPage
     7	      icon={Trophy}
     8	      title="Score"
     9	      description="Game scoring and stats tracking — coming soon."
    10	    />
    11	  );
    12	}
```

## src/pages/TeamDetailPage.jsx (140 lines)
```
     1	import { useState } from 'react';
     2	import { useParams, useNavigate } from 'react-router-dom';
     3	import { ChevronLeft, Plus, Users } from 'lucide-react';
     4	import { useAuth } from '../context/AuthContext';
     5	import { usePrograms } from '../hooks/usePrograms';
     6	import { useRoster } from '../hooks/useRoster';
     7	import { useFilteredRoster } from '../hooks/useFilteredRoster';
     8	import EmptyState from '../components/shared/EmptyState';
     9	import LoadingSkeleton from '../components/shared/LoadingSkeleton';
    10	import PlayerRow from '../components/roster/PlayerRow';
    11	import TeamHeaderCard from '../components/roster/TeamHeaderCard';
    12	import RosterControls from '../components/roster/RosterControls';
    13	import CopyRosterButton from '../components/roster/CopyRosterButton';
    14	import UpcomingEvents from '../components/roster/UpcomingEvents';
    15	import MessageTeamFAB from '../components/roster/MessageTeamFAB';
    16	import TeamSwitcher from '../components/roster/TeamSwitcher';
    17	
    18	// Read-only roster view for a single team. The team lookup piggybacks on
    19	// usePrograms() — it already queries every team in the active season, so
    20	// we don't pay a second round-trip for a single row. Roster data comes
    21	// from the seed hook until the real tables are populated.
    22	export default function TeamDetailPage() {
    23	  const { teamId } = useParams();
    24	  const navigate = useNavigate();
    25	  const { role, myTeamIds } = useAuth();
    26	  const { programs, loading: teamsLoading } = usePrograms();
    27	  const switcherPrograms = role === 'parent' ? programs.filter((p) => (myTeamIds || []).includes(p.id)) : programs;
    28	  const { players, loading: rosterLoading } = useRoster(teamId);
    29	  const [search, setSearch] = useState('');
    30	  const [sortBy, setSortBy] = useState('jersey'); // 'jersey' | 'name' | 'grade'
    31	  const sortedPlayers = useFilteredRoster(players, search, sortBy);
    32	
    33	  const team = programs.find((p) => p.id === teamId);
    34	
    35	  if (teamsLoading) {
    36	    return (
    37	      <div className="px-4 py-4">
    38	        <LoadingSkeleton variant="card" count={3} />
    39	      </div>
    40	    );
    41	  }
    42	
    43	  if (!team) {
    44	    return (
    45	      <div className="px-4 py-4">
    46	        <EmptyState
    47	          icon={Users}
    48	          title="Team not found"
    49	          description="This team doesn't exist or has been removed."
    50	        />
    51	      </div>
    52	    );
    53	  }
    54	
    55	  return (
    56	    <div
    57	      className="sf-fade-in overflow-x-hidden"
    58	      style={{
    59	        padding: 16,
    60	        minHeight: '100%',
    61	        background: team?.team_color
    62	          ? `linear-gradient(180deg, ${team.team_color}08 0%, transparent 200px)`
    63	          : undefined,
    64	      }}
    65	    >
    66	      <button
    67	        type="button"
    68	        onClick={() => navigate('/teams')}
    69	        className="flex items-center sf-press mb-3"
    70	        style={{
    71	          minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none',
    72	          color: 'var(--em-accent)', fontSize: 15, fontWeight: 500,
    73	        }}
    74	      >
    75	        <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /> Teams
    76	      </button>
    77	
    78	      <TeamSwitcher programs={switcherPrograms} teamId={teamId} navigate={navigate} />
    79	
    80	      <TeamHeaderCard team={team} players={players} />
    81	
    82	      {rosterLoading ? (
    83	        <LoadingSkeleton variant="list" count={6} />
    84	      ) : players.length === 0 ? (
    85	        <EmptyState
    86	          icon={Users}
    87	          title={`No players on ${team.name} yet`}
    88	          action={
    89	            <button
    90	              type="button"
    91	              className="flex items-center gap-1 font-semibold sf-press"
    92	              style={{
    93	                minHeight: 44, padding: '0 14px', borderRadius: 10,
    94	                backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 14,
    95	              }}
    96	            >
    97	              <Plus size={18} strokeWidth={1.75} aria-hidden="true" /> Add Player
    98	            </button>
    99	          }
   100	        />
   101	      ) : (
   102	        <>
   103	          <RosterControls
   104	            search={search}
   105	            setSearch={setSearch}
   106	            sortBy={sortBy}
   107	            setSortBy={setSortBy}
   108	          />
   109	          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
   110	            <div style={{
   111	              fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
   112	              textTransform: 'uppercase', color: 'var(--em-text-tertiary)',
   113	            }}>ROSTER</div>
   114	            <CopyRosterButton team={team} sortedPlayers={sortedPlayers} />
   115	          </div>
   116	          <div style={{
   117	            backgroundColor: 'var(--em-bg-card)',
   118	            borderRadius: 10,
   119	            border: '1px solid var(--em-border-default)',
   120	            boxShadow: 'var(--em-shadow-sm)',
   121	            overflow: 'hidden',
   122	          }}>
   123	            {sortedPlayers.map((player, i) => (
   124	              <div key={player.id} className={`sf-stagger-${Math.min(i + 1, 8)}`}>
   125	                <PlayerRow
   126	                  player={player}
   127	                  teamColor={team.team_color}
   128	                  isLast={i === sortedPlayers.length - 1}
   129	                />
   130	              </div>
   131	            ))}
   132	          </div>
   133	          <UpcomingEvents />
   134	        </>
   135	      )}
   136	
   137	      <MessageTeamFAB />
   138	    </div>
   139	  );
   140	}
```

## src/pages/TeamsPage.jsx (136 lines)
```
     1	import { useNavigate } from 'react-router-dom';
     2	import { Users } from 'lucide-react';
     3	import { usePrograms } from '../hooks/usePrograms';
     4	import { useSeason } from '../context/SeasonContext';
     5	import { useAuth } from '../context/AuthContext';
     6	import { usePullToRefresh } from '../hooks/usePullToRefresh';
     7	import EmptyState from '../components/shared/EmptyState';
     8	import LoadingSkeleton from '../components/shared/LoadingSkeleton';
     9	
    10	// Labels mirror AdminTeamsPage — duplicated intentionally so this file
    11	// stays self-contained until we extract circuit/day labels into
    12	// lib/constants.js during a dedicated cleanup pass.
    13	const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };
    14	
    15	// Public teams list. Every signed-in user — admin, coach, parent — sees
    16	// all teams in the active season, sorted oldest-to-youngest via the
    17	// usePrograms() sort_order query. Tapping a card routes to
    18	// /teams/:teamId where the roster lives.
    19	export default function TeamsPage() {
    20	  const { activeSeason } = useSeason();
    21	  const { role, myTeamIds } = useAuth();
    22	  const { programs, loading, refetch } = usePrograms();
    23	  const navigate = useNavigate();
    24	  const { refreshing, onTouchStart, onTouchEnd } = usePullToRefresh(() => refetch?.());
    25	  const visiblePrograms = role === 'parent' ? programs.filter((t) => (myTeamIds || []).includes(t.id)) : programs;
    26	
    27	  return (
    28	    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="px-4 py-4 sf-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
    29	      <div style={{ marginBottom: 4 }}>
    30	        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20, letterSpacing: '-0.025em' }}>
    31	          Teams
    32	        </h1>
    33	        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
    34	          {activeSeason?.name || 'No active season'} · {visiblePrograms.length} teams
    35	        </div>
    36	        <div style={{ width: 32, height: 3, borderRadius: 999, backgroundColor: 'var(--em-accent)', marginTop: 8 }} />
    37	      </div>
    38	
    39	      {refreshing && (
    40	        <div className="flex justify-center py-3">
    41	          <div style={{
    42	            width: 24, height: 24, borderRadius: '50%',
    43	            border: '2px solid var(--em-accent)',
    44	            borderTopColor: 'transparent',
    45	            animation: 'spin 0.6s linear infinite',
    46	          }} />
    47	        </div>
    48	      )}
    49	
    50	      {loading ? (
    51	        <LoadingSkeleton variant="card" count={5} />
    52	      ) : visiblePrograms.length === 0 ? (
    53	        <EmptyState
    54	          icon={Users}
    55	          title="No teams yet"
    56	          description="Teams will appear here once an admin adds them."
    57	        />
    58	      ) : (
    59	        <div className="flex flex-col gap-3">
    60	          {visiblePrograms.map((team, i) => (
    61	            <button
    62	              key={team.id}
    63	              type="button"
    64	              onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${team.id}`); }}
    65	              className={`w-full text-left sf-press sf-stagger-${i + 1}`}
    66	              style={{
    67	                display: 'flex',
    68	                alignItems: 'stretch',
    69	                backgroundColor: 'var(--em-bg-card)',
    70	                borderRadius: 10,
    71	                border: '1px solid var(--em-border-default)',
    72	                boxShadow: 'var(--em-shadow-sm)',
    73	                overflow: 'hidden',
    74	                transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
    75	              }}
    76	            >
    77	              <div style={{ width: 5, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
    78	              <div style={{ flex: 1, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    79	                <div>
    80	                  <div className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 16 }}>
    81	                    {team.name}
    82	                  </div>
    83	                  <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
    84	                    <span style={{
    85	                      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
    86	                      backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)',
    87	                    }}>{team.age_group}</span>
    88	                    <span style={{
    89	                      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
    90	                      backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)',
    91	                    }}>{CIRCUIT_LABELS[team.circuit] || team.circuit}</span>
    92	                    <span style={{
    93	                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
    94	                      backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-text-tertiary)',
    95	                    }}>0-0</span>
    96	                  </div>
    97	                </div>
    98	                <div style={{ display: 'flex', marginLeft: 'auto', marginRight: 12 }}>
    99	                  {['A', 'S', 'C'].map((letter, i) => (
   100	                    <div key={i} style={{
   101	                      width: 24, height: 24, borderRadius: '50%',
   102	                      backgroundColor: team.team_color || 'var(--em-neutral)',
   103	                      border: '2px solid var(--em-bg-card)',
   104	                      display: 'flex', alignItems: 'center', justifyContent: 'center',
   105	                      color: 'var(--em-text-inverse)', fontSize: 10, fontWeight: 700,
   106	                      marginLeft: i === 0 ? 0 : -8,
   107	                      zIndex: 3 - i,
   108	                      position: 'relative',
   109	                    }}>
   110	                      {letter}
   111	                    </div>
   112	                  ))}
   113	                  <div style={{
   114	                    width: 24, height: 24, borderRadius: '50%',
   115	                    backgroundColor: 'var(--em-bg-secondary)',
   116	                    border: '2px solid var(--em-bg-card)',
   117	                    display: 'flex', alignItems: 'center', justifyContent: 'center',
   118	                    color: 'var(--em-text-tertiary)', fontSize: 9, fontWeight: 600,
   119	                    marginLeft: -8,
   120	                    zIndex: 0,
   121	                    position: 'relative',
   122	                  }}>
   123	                    +7
   124	                  </div>
   125	                </div>
   126	                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--em-text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
   127	                  <path d="m9 18 6-6-6-6"/>
   128	                </svg>
   129	              </div>
   130	            </button>
   131	          ))}
   132	        </div>
   133	      )}
   134	    </div>
   135	  );
   136	}
```

## src/pages/UnauthorizedPage.jsx (52 lines)
```
     1	import { Link } from 'react-router-dom';
     2	import { ShieldAlert } from 'lucide-react';
     3	
     4	// Shown when RequireAuth detects a user whose role isn't in the route's
     5	// allowedRoles list — e.g. a parent trying to reach /score.
     6	export default function UnauthorizedPage() {
     7	  return (
     8	    <div
     9	      className="sf-fullscreen flex items-center justify-center p-6"
    10	      style={{ backgroundColor: 'var(--em-bg-page)' }}
    11	    >
    12	      <div className="text-center" style={{ maxWidth: 360 }}>
    13	        <div
    14	          className="inline-flex items-center justify-center mb-4"
    15	          style={{
    16	            width: 72,
    17	            height: 72,
    18	            borderRadius: '50%',
    19	            backgroundColor: 'var(--em-warning-soft)',
    20	            color: 'var(--em-warning)',
    21	          }}
    22	          aria-hidden="true"
    23	        >
    24	          <ShieldAlert size={32} strokeWidth={1.75} />
    25	        </div>
    26	        <h1
    27	          className="font-semibold"
    28	          style={{ color: 'var(--em-text-primary)', fontSize: 20, marginBottom: 8 }}
    29	        >
    30	          You don't have access to this page
    31	        </h1>
    32	        <p style={{ color: 'var(--em-text-secondary)', fontSize: 14, marginBottom: 20 }}>
    33	          Ask an admin if you think this is a mistake.
    34	        </p>
    35	        <Link
    36	          to="/"
    37	          className="inline-flex items-center justify-center font-semibold sf-press"
    38	          style={{
    39	            minHeight: 44,
    40	            padding: '0 20px',
    41	            borderRadius: 10,
    42	            backgroundColor: 'var(--em-accent)',
    43	            color: 'var(--em-text-inverse)',
    44	            fontSize: 15,
    45	          }}
    46	        >
    47	          Back to Home
    48	        </Link>
    49	      </div>
    50	    </div>
    51	  );
    52	}
```
