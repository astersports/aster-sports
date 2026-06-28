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
import StepSelectChildren from '../components/register/StepSelectChildren';
import RegisterConfirm from '../components/register/RegisterConfirm';
import { centered, h1Style, linkBtn, metaStyle, subStyle, wrap } from '../components/register/registerStyles';
import { useRegisterIdentity } from '../hooks/useRegisterIdentity';

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
  const identity = useRegisterIdentity(data?.program?.id);

  // R4 a11y — move focus to the step/section heading on every step+phase change so
  // a screen reader announces the new step and keyboard focus starts at the top.
  const headingRef = useRef(null);
  useEffect(() => { headingRef.current?.focus(); }, [state.phase, state.step, state.submitted]);

  const divisions = data?.divisions || [];
  const onlyOneDivision = divisions.length === 1;
  // B3 funnel: an authed parent with a usable guardian email gets identity pre-fill +
  // (with children, single-division) the select step. No email → manual flow (the
  // authed path skips the guardian step, else submit fails). Multi-division → manual.
  const initedRef = useRef(false);
  useEffect(() => {
    if (initedRef.current || identity.loading || !identity.authed || !identity.guardian?.email) return;
    initedRef.current = true;
    dispatch({ type: 'AUTHED_INIT', guardian: identity.guardian, select: identity.children.length > 0 && onlyOneDivision });
  }, [identity, onlyOneDivision]);

  if (loading || identity.loading) return <div style={centered}>Loading…</div>;
  const program = data?.program;
  const divOf = (id) => divisions.find((d) => d.id === id);
  const draftDivision = divOf(state.draft.divisionId);
  const firstEntry = state.children.length === 0 && state.editIndex == null && state.phase === 'entry';

  if (!program || divisions.length === 0 || (firstEntry && !draftDivision)) {
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

  // ── B3 funnel: select-your-children (authed parent, single-division) ──
  if (state.phase === 'select') {
    const div = divOf(state.draft.divisionId) || divisions[0];
    return (
      <div style={wrap}>
        <button type="button" onClick={() => navigate(`/r/${slug}`)} style={linkBtn}>← Cancel</button>
        <div style={metaStyle}>Step 1 of 3</div>
        <h1 ref={headingRef} tabIndex={-1} style={h1Style}>Who’s registering?</h1>
        <StepSelectChildren
          kids={identity.children} division={div}
          onAddNew={() => dispatch({ type: 'ADD_CHILD', divisionId: div?.id || '' })}
          onContinue={(picks) => dispatch({ type: 'SELECT_CHILDREN', picks, divisionId: div?.id || '' })}
        />
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
