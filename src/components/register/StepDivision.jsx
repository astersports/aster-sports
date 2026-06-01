import { Field, SelectInput } from './fields';
import { primaryBtn } from './registerStyles';

// Division picker — shown only for the 2nd+ child in the multi-child loop (the first
// child's division comes from the entry URL). Lets siblings register into different
// divisions (the common case: kids of different ages).
export default function StepDivision({ divisions, value, onChange, onNext }) {
  const options = [{ value: '', label: 'Select a division' }, ...divisions.map((d) => ({ value: d.id, label: d.name }))];
  return (
    <div>
      <Field label="Division" htmlFor="div-sel">
        <SelectInput id="div-sel" value={value} onChange={onChange} options={options} />
      </Field>
      <button type="button" className="em-press" style={{ ...primaryBtn, marginTop: 8, opacity: value ? 1 : 0.5 }} disabled={!value} onClick={onNext}>Next</button>
    </div>
  );
}
