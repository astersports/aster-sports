import { useReducer } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePublicProgram } from '../hooks/usePublicProgram';
import { useSubmitRegistration } from '../hooks/useSubmitRegistration';
import { estimateCart } from '../lib/estimateCart';
import StepPlayer from '../components/register/StepPlayer';
import StepGuardian from '../components/register/StepGuardian';
import StepDetails from '../components/register/StepDetails';
import StepReview from '../components/register/StepReview';
import RegisterConfirm from '../components/register/RegisterConfirm';

// Public registration wizard (spec §5.3, lean capture variant — Steps 1–3 + review/submit).
// useReducer keeps cart state across steps with no re-mount (spec §5.7). Multi-child loop
// is PR D. The submit_registration RPC is the authoritative writer.
const init = () => ({
  step: 0,
  player: { first_name: '', last_name: '', dob: '', grade: '' },
  guardian: { first_name: '', last_name: '', email: '', phone: '', relationship: 'parent', sms_opt_in: false },
  coGuardian: null,
  details: { jersey_size: '', shorts_size: '', emergency_contact_name: '', emergency_contact_phone: '', medical_notes: '' },
});
function reducer(s, a) {
  switch (a.type) {
    case 'FIELD': return { ...s, [a.section]: { ...s[a.section], [a.field]: a.value } };
    case 'TOGGLE_COG': return { ...s, coGuardian: s.coGuardian ? null : { first_name: '', last_name: '', email: '', phone: '', relationship: 'parent' } };
    case 'STEP': return { ...s, step: a.step };
    default: return s;
  }
}

const centered = { padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' };
const wrap = { maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' };

export default function RegisterFlowPage() {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const divisionId = sp.get('division');
  const navigate = useNavigate();
  const { data, loading } = usePublicProgram(slug);
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const { submit, submitting, error, result } = useSubmitRegistration();

  if (loading) return <div style={centered}>Loading…</div>;
  const program = data?.program;
  const division = (data?.divisions || []).find((d) => d.id === divisionId);
  if (!program || !division) {
    return (
      <div style={{ ...centered, ...wrap }}>
        <p style={{ marginTop: 48 }}>This registration isn’t available.</p>
        <button type="button" onClick={() => navigate(`/r/${slug}`)} style={{ background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, cursor: 'pointer' }}>← Back to divisions</button>
      </div>
    );
  }

  const field = (section) => (f, v) => dispatch({ type: 'FIELD', section, field: f, value: v });
  const goto = (step) => dispatch({ type: 'STEP', step });
  const cart = estimateCart([{ player: state.player, division }], null); // LH family_cap_policy is null

  async function handleSubmit() {
    const payload = {
      program_slug: slug,
      guardian: state.guardian,
      co_guardian: state.coGuardian || undefined,
      children: [{ player: state.player, division_id: division.id, details: state.details }],
    };
    const r = await submit(payload);
    if (r.ok) goto(4);
  }

  if (state.step === 4 && result) {
    return <div style={wrap}><RegisterConfirm result={result} program={program} onDone={() => navigate(`/r/${slug}`)} /></div>;
  }

  const steps = [
    <StepPlayer key="p" player={state.player} division={division} onField={field('player')} onNext={() => goto(1)} />,
    <StepGuardian key="g" guardian={state.guardian} coGuardian={state.coGuardian} onField={field('guardian')} onCogField={field('coGuardian')} onToggleCog={() => dispatch({ type: 'TOGGLE_COG' })} onBack={() => goto(0)} onNext={() => goto(2)} />,
    <StepDetails key="d" details={state.details} onField={field('details')} onBack={() => goto(1)} onNext={() => goto(3)} />,
    <StepReview key="r" player={state.player} division={division} cart={cart} submitting={submitting} error={error} onBack={() => goto(2)} onSubmit={handleSubmit} />,
  ];
  const titles = ['Player', 'Guardian', 'Optional details', 'Review'];
  const step = Math.min(state.step, 3);

  return (
    <div style={wrap}>
      <button type="button" onClick={() => navigate(`/r/${slug}`)} style={{ background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, cursor: 'pointer', padding: 0 }}>← Cancel</button>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--em-text-tertiary)', margin: '8px 0 2px' }}>Step {step + 1} of 4 · {division.name}</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', margin: '0 0 16px' }}>{titles[step]}</h1>
      {steps[step]}
    </div>
  );
}
