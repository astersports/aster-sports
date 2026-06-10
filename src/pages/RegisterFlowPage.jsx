import { useEffect, useReducer, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../lib/formatters';
import { usePublicProgram } from '../hooks/usePublicProgram';
import { useSubmitRegistration } from '../hooks/useSubmitRegistration';
import { estimateCart } from '../lib/estimateCart';
import { entrySeq, init, reducer } from '../lib/registerFlowReducer';
import StepDivision from '../components/register/StepDivision';
import StepPlayer from '../components/register/StepPlayer';
import StepGuardian from '../components/register/StepGuardian';
import StepDetails from '../components/register/StepDetails';
import StepChildrenRoster from '../components/register/StepChildrenRoster';
import RegisterConfirm from '../components/register/RegisterConfirm';

// Public registration wizard (spec §5.3/§5.4). R1: children accumulate client-side
// into children[] and submit in ONE submit_registration (family discount fires only
// in one submit). useReducer (pure, src/lib/registerFlowReducer) keeps state across
// steps with no re-mount. Flow: per-child entry → roster hub (add/edit/remove) →
// one submit → one confirmation.
export default function RegisterFlowPage() {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { data, loading } = usePublicProgram(slug);
  const [state, dispatch] = useReducer(reducer, sp.get('division'), init);
  const { submit, submitting, error, result } = useSubmitRegistration();

  // R4 a11y — move focus to the step/section heading on every step+phase change so
  // a screen reader announces the new step and keyboard focus starts at the top.
  const headingRef = useRef(null);
  useEffect(() => { headingRef.current?.focus(); }, [state.phase, state.step, state.submitted]);

  if (loading) return <div style={centered}>Loading…</div>;
  const program = data?.program;
  const divisions = data?.divisions || [];
  const onlyOneDivision = divisions.length === 1;
  const divOf = (id) => divisions.find((d) => d.id === id);
  const draftDivision = divOf(state.draft.divisionId);
  const firstEntry = state.children.length === 0 && state.editIndex == null && state.phase === 'entry';

  if (!program || (firstEntry && !draftDivision)) {
    return (
      <div style={{ ...centered, ...wrap }}>
        <p style={{ marginTop: 48 }}>This registration isn’t available.</p>
        <button type="button" onClick={() => navigate(`/r/${slug}`)} style={linkBtn}>← Back</button>
      </div>
    );
  }

  if (state.submitted && result) {
    return (
      <div style={wrap}>
        <RegisterConfirm result={result} program={program} guardianEmail={state.guardian.email} onDone={() => navigate(`/r/${slug}`)} />
      </div>
    );
  }

  const field = (section) => (f, v) => dispatch({ type: 'FIELD', section, field: f, value: v });
  const seq = entrySeq(state, onlyOneDivision);
  const atLast = state.step >= seq.length - 1;
  const next = () => dispatch(atLast ? { type: 'COMMIT_CHILD' } : { type: 'STEP', step: state.step + 1 });
  const back = () => dispatch({ type: 'STEP', step: Math.max(0, state.step - 1) });

  // ── Roster hub (R1 / render G2) ──
  if (state.phase === 'roster') {
    const cartChildren = state.children.map((c) => ({ player: c.player, division: divOf(c.division_id) }));
    const cart = estimateCart(cartChildren, null); // LH family_cap_policy is null
    const rows = state.children.map((c) => ({
      name: c.player.first_name || 'Player',
      label: onlyOneDivision ? program.name : (divOf(c.division_id)?.name || ''),
      feeCents: estimateCart([{ player: c.player, division: divOf(c.division_id) }], null).subtotalCents,
    }));
    const handleSubmit = async () => {
      const r = await submit({
        program_slug: slug, guardian: state.guardian, co_guardian: state.coGuardian || undefined,
        children: state.children.map((c) => ({ player: c.player, division_id: c.division_id, details: c.details })),
      });
      if (r.ok) dispatch({ type: 'SUBMITTED' });
    };
    return (
      <div style={wrap}>
        <button type="button" onClick={() => navigate(`/r/${slug}`)} style={linkBtn}>← Cancel</button>
        <h1 ref={headingRef} tabIndex={-1} style={h1Style}>Your children</h1>
        <p style={subStyle}>Add each child, then register them together in one go.</p>
        <p className="as-sr-only" aria-live="polite">{`${rows.length} ${rows.length === 1 ? 'child' : 'children'} added. Running total ${formatCurrency(cart.totalCents)}.`}</p>
        <StepChildrenRoster
          rows={rows} cart={cart} submitting={submitting} error={error}
          onAdd={() => dispatch({ type: 'ADD_CHILD', divisionId: onlyOneDivision ? divisions[0].id : '' })}
          onEdit={(i) => dispatch({ type: 'EDIT_CHILD', index: i })}
          onRemove={(i) => dispatch({ type: 'REMOVE_CHILD', index: i })}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // ── Per-child entry ──
  const current = seq[Math.min(state.step, seq.length - 1)];
  const node = {
    division: <StepDivision divisions={divisions} value={state.draft.divisionId} onChange={(v) => dispatch({ type: 'DIVISION', value: v })} onNext={next} />,
    player: <StepPlayer player={state.draft.player} division={draftDivision || {}} onField={field('player')} onNext={next} />,
    guardian: <StepGuardian guardian={state.guardian} coGuardian={state.coGuardian} onField={field('guardian')} onCogField={field('coGuardian')} onToggleCog={() => dispatch({ type: 'TOGGLE_COG' })} onBack={back} onNext={next} />,
    details: <StepDetails details={state.draft.details} onField={field('details')} onBack={back} onNext={next} />,
  }[current];
  const titles = { division: 'Division', player: 'Player', guardian: 'Guardian', details: 'Optional details' };
  const hasRoster = state.children.length > 0 || state.editIndex != null;

  return (
    <div style={wrap}>
      <button type="button" onClick={() => (hasRoster ? dispatch({ type: 'CANCEL_ENTRY' }) : navigate(`/r/${slug}`))} style={linkBtn}>
        {hasRoster ? '← Back to list' : '← Cancel'}
      </button>
      <div style={metaStyle}>Step {state.step + 1} of {seq.length}{draftDivision && !onlyOneDivision ? ` · ${draftDivision.name}` : ''}</div>
      <h1 ref={headingRef} tabIndex={-1} style={h1Style}>{titles[current]}</h1>
      <p className="as-sr-only" aria-live="polite">{`Step ${state.step + 1} of ${seq.length}: ${titles[current]}`}</p>
      {node}
    </div>
  );
}

const centered = { padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' };
const wrap = { maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' };
const linkBtn = { background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, cursor: 'pointer', padding: 0 };
const metaStyle = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-tertiary)', margin: '8px 0 2px' };
const h1Style = { fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', margin: '0 0 4px' };
const subStyle = { fontSize: 13, color: 'var(--as-text-tertiary)', margin: '0 0 16px' };
