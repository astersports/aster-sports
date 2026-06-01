import { useReducer } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePublicProgram } from '../hooks/usePublicProgram';
import { useSubmitRegistration } from '../hooks/useSubmitRegistration';
import { estimateCart } from '../lib/estimateCart';
import StepDivision from '../components/register/StepDivision';
import StepPlayer from '../components/register/StepPlayer';
import StepGuardian from '../components/register/StepGuardian';
import StepDetails from '../components/register/StepDetails';
import StepReview from '../components/register/StepReview';
import RegisterConfirm from '../components/register/RegisterConfirm';

// Public registration wizard (spec §5.3/§5.4, lean capture variant). useReducer keeps state
// across steps with no re-mount (§5.7). Multi-child loop (PR D): guardian collected once on
// the first child; each subsequent child picks its own division and is its own pending
// registration (one confirmation per child — single-charge accumulation is the Stripe track).
const emptyPlayer = () => ({ first_name: '', last_name: '', dob: '', grade: '' });
const emptyDetails = () => ({ jersey_size: '', shorts_size: '', emergency_contact_name: '', emergency_contact_phone: '', medical_notes: '' });
const emptyGuardian = () => ({ first_name: '', last_name: '', email: '', phone: '', relationship: 'parent', sms_opt_in: false });
const init = (divisionId) => ({
  childIndex: 0, step: 0, submitted: false, guardian: emptyGuardian(), coGuardian: null,
  draft: { divisionId: divisionId || '', player: emptyPlayer(), details: emptyDetails() },
});
function reducer(s, a) {
  switch (a.type) {
    case 'FIELD':
      if (a.section === 'player' || a.section === 'details')
        return { ...s, draft: { ...s.draft, [a.section]: { ...s.draft[a.section], [a.field]: a.value } } };
      return { ...s, [a.section]: { ...s[a.section], [a.field]: a.value } };
    case 'DIVISION': return { ...s, draft: { ...s.draft, divisionId: a.value } };
    case 'TOGGLE_COG': return { ...s, coGuardian: s.coGuardian ? null : { first_name: '', last_name: '', email: '', phone: '', relationship: 'parent' } };
    case 'STEP': return { ...s, step: a.step };
    case 'SUBMITTED': return { ...s, submitted: true };
    case 'NEXT_CHILD': return { ...s, childIndex: s.childIndex + 1, step: 0, submitted: false, draft: { divisionId: '', player: emptyPlayer(), details: emptyDetails() } };
    default: return s;
  }
}

export default function RegisterFlowPage() {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { data, loading } = usePublicProgram(slug);
  const [state, dispatch] = useReducer(reducer, sp.get('division'), init);
  const { submit, submitting, error, result } = useSubmitRegistration();

  if (loading) return <div style={centered}>Loading…</div>;
  const program = data?.program;
  const divisions = data?.divisions || [];
  const division = divisions.find((d) => d.id === state.draft.divisionId);
  const firstChild = state.childIndex === 0;
  if (!program || (firstChild && !division)) {
    return (
      <div style={{ ...centered, ...wrap }}>
        <p style={{ marginTop: 48 }}>This registration isn’t available.</p>
        <button type="button" onClick={() => navigate(`/r/${slug}`)} style={linkBtn}>← Back to divisions</button>
      </div>
    );
  }

  const field = (section) => (f, v) => dispatch({ type: 'FIELD', section, field: f, value: v });
  const next = () => dispatch({ type: 'STEP', step: state.step + 1 });
  const back = () => dispatch({ type: 'STEP', step: state.step - 1 });
  const cart = estimateCart([{ player: state.draft.player, division }], null); // LH family_cap_policy is null

  async function handleSubmit() {
    const r = await submit({
      program_slug: slug,
      guardian: state.guardian,
      co_guardian: state.coGuardian || undefined,
      children: [{ player: state.draft.player, division_id: state.draft.divisionId, details: state.draft.details }],
    });
    if (r.ok) dispatch({ type: 'SUBMITTED' });
  }

  if (state.submitted && result) {
    return (
      <div style={wrap}>
        <RegisterConfirm result={result} program={program}
          onAddAnother={() => dispatch({ type: 'NEXT_CHILD' })} onDone={() => navigate(`/r/${slug}`)} />
      </div>
    );
  }

  const seq = firstChild ? ['player', 'guardian', 'details', 'review'] : ['division', 'player', 'details', 'review'];
  const current = seq[Math.min(state.step, seq.length - 1)];
  const node = {
    division: <StepDivision divisions={divisions} value={state.draft.divisionId} onChange={(v) => dispatch({ type: 'DIVISION', value: v })} onNext={next} />,
    player: <StepPlayer player={state.draft.player} division={division || {}} onField={field('player')} onNext={next} />,
    guardian: <StepGuardian guardian={state.guardian} coGuardian={state.coGuardian} onField={field('guardian')} onCogField={field('coGuardian')} onToggleCog={() => dispatch({ type: 'TOGGLE_COG' })} onBack={back} onNext={next} />,
    details: <StepDetails details={state.draft.details} onField={field('details')} onBack={back} onNext={next} />,
    review: <StepReview player={state.draft.player} division={division || {}} cart={cart} submitting={submitting} error={error} onBack={back} onSubmit={handleSubmit} />,
  }[current];
  const titles = { division: 'Division', player: 'Player', guardian: 'Guardian', details: 'Optional details', review: 'Review' };

  return (
    <div style={wrap}>
      <button type="button" onClick={() => navigate(`/r/${slug}`)} style={linkBtn}>← Cancel</button>
      <div style={metaStyle}>
        {firstChild ? '' : `Child ${state.childIndex + 1} · `}Step {state.step + 1} of {seq.length}{division ? ` · ${division.name}` : ''}
      </div>
      <h1 style={h1Style}>{titles[current]}</h1>
      {node}
    </div>
  );
}

const centered = { padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' };
const wrap = { maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' };
const linkBtn = { background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, cursor: 'pointer', padding: 0 };
const metaStyle = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--em-text-tertiary)', margin: '8px 0 2px' };
const h1Style = { fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', margin: '0 0 16px' };
