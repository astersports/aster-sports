const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--em-text-tertiary)',
  marginBottom: 6,
};

const helperStyle = {
  fontSize: 12,
  color: 'var(--em-text-tertiary)',
  marginTop: 4,
};

const textareaStyle = {
  width: '100%',
  minHeight: 96,
  padding: 12,
  borderRadius: 10,
  fontSize: 15,
  lineHeight: 1.5,
  fontFamily: 'inherit',
  backgroundColor: 'var(--em-bg-tertiary)',
  border: '1.5px solid var(--em-border-default)',
  color: 'var(--em-text-primary)',
  resize: 'vertical',
};

const counterStyle = (over) => ({
  fontSize: 11,
  fontWeight: 500,
  color: over ? 'var(--em-warning)' : 'var(--em-text-tertiary)',
});

export default function BriefingNarrativeInputs({
  coachKeys, onCoachKeysChange,
  survivalText, onSurvivalChange,
}) {
  const COACH_SOFT_LIMIT = 400;
  const SURVIVAL_SOFT_LIMIT = 600;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="briefing-coach-keys" style={labelStyle}>Coach&rsquo;s keys</label>
          <span style={counterStyle(coachKeys.length > COACH_SOFT_LIMIT)}>
            {coachKeys.length}/{COACH_SOFT_LIMIT}
          </span>
        </div>
        <textarea
          id="briefing-coach-keys"
          value={coachKeys}
          onChange={(e) => onCoachKeysChange(e.target.value)}
          placeholder="One key per line. Example: Defense first, hands up. Crash the boards. Talk on switches."
          style={textareaStyle}
          aria-label="Coach's keys for the weekend"
        />
        <div style={helperStyle}>One bullet per line. Renders inside the navy block.</div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="briefing-survival" style={labelStyle}>Survival notes</label>
          <span style={counterStyle(survivalText.length > SURVIVAL_SOFT_LIMIT)}>
            {survivalText.length}/{SURVIVAL_SOFT_LIMIT}
          </span>
        </div>
        <textarea
          id="briefing-survival"
          value={survivalText}
          onChange={(e) => onSurvivalChange(e.target.value)}
          placeholder="Arrive 15 min early. Pack water, snacks, warm layer. Cash for concessions."
          style={textareaStyle}
          aria-label="Survival notes for parents"
        />
        <div style={helperStyle}>Renders inside the parent survival guide block. Leave blank for engine default.</div>
      </div>
    </div>
  );
}
