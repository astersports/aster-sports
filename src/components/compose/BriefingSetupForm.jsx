import { TOURNAMENT_MESSAGE_TYPES } from '../../lib/constants';

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--em-text-tertiary)',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  minHeight: 44,
  padding: '0 12px',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 500,
  fontFamily: 'inherit',
  backgroundColor: 'var(--em-bg-tertiary)',
  border: '1.5px solid var(--em-border-default)',
  color: 'var(--em-text-primary)',
  appearance: 'none',
};

export default function BriefingSetupForm({
  tournaments, tournamentId, onTournamentChange,
  teams, teamId, onTeamChange,
  messageType, onMessageTypeChange,
  subject, onSubjectChange,
  defaultSubject,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="briefing-tournament" style={labelStyle}>Tournament</label>
        <select
          id="briefing-tournament"
          value={tournamentId || ''}
          onChange={(e) => onTournamentChange(e.target.value || null)}
          style={inputStyle}
          aria-label="Tournament"
        >
          <option value="">Pick a tournament…</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="briefing-team" style={labelStyle}>Team</label>
        <select
          id="briefing-team"
          value={teamId || ''}
          onChange={(e) => onTeamChange(e.target.value || null)}
          style={inputStyle}
          aria-label="Team"
        >
          <option value="">Pick a team…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="briefing-type" style={labelStyle}>Message type</label>
        <select
          id="briefing-type"
          value={messageType}
          onChange={(e) => onMessageTypeChange(e.target.value)}
          style={inputStyle}
          aria-label="Message type"
        >
          {TOURNAMENT_MESSAGE_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="briefing-subject" style={labelStyle}>Subject</label>
        <input
          id="briefing-subject"
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder={defaultSubject || 'Leave blank for engine default'}
          style={inputStyle}
          aria-label="Email subject"
        />
      </div>
    </div>
  );
}
