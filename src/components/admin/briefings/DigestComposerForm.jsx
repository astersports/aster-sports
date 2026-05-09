import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPeriodLabel } from '../../../lib/engine/digestPeriod';

// Form fields panel for DigestComposer. Period picker, body/ops/signoff
// textareas, test-toggle checkbox. Pure presentational — parent owns
// state.

const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)', marginBottom: 6, display: 'block' };
const taStyle = { width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 72 };
const navBtn = { minWidth: 36, minHeight: 36, padding: 0, borderRadius: 9999, border: 'none', backgroundColor: 'var(--em-bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

function PeriodPicker({ period, onPrev, onNext }) {
  const start = period?.start;
  const end = period?.end;
  return (
    <div>
      <span style={labelStyle}>Period</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" onClick={onPrev} aria-label="Previous week" style={navBtn}>
          <ChevronLeft size={18} strokeWidth={1.75} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 14, color: 'var(--em-text-primary)' }}>
          {start && end
            ? <>Week of {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</>
            : '—'}
        </div>
        <button type="button" onClick={onNext} aria-label="Next week" style={navBtn}>
          <ChevronRight size={18} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

export default function DigestComposerForm({
  period, onPrevPeriod, onNextPeriod,
  recipientCount, skippedCount, recipientLoading, eventsLoading,
  outOfSeason,
  bodyNotes, setBodyNotes,
  opsEnabled, setOpsEnabled, opsNotes, setOpsNotes,
  signoffMessage, setSignoffMessage,
  testOnly, setTestOnly,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PeriodPicker period={period} onPrev={onPrevPeriod} onNext={onNextPeriod} />

      {outOfSeason && (
        <div role="alert" style={{ padding: 10, borderRadius: 8, backgroundColor: 'var(--em-danger-soft)', color: 'var(--em-danger)', fontSize: 13 }}>
          No active season for this period. Pick a different week or update season dates.
        </div>
      )}

      <div>
        <span style={labelStyle}>Subject</span>
        <div style={{ fontSize: 14, color: 'var(--em-text-primary)', padding: '10px 12px', borderRadius: 8, backgroundColor: 'var(--em-bg-secondary)' }}>
          Week ahead — {formatPeriodLabel(period)}
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.5 }}>
        {recipientLoading || eventsLoading
          ? 'Loading recipient counts…'
          : <>Sending to <strong style={{ color: 'var(--em-text-primary)' }}>{recipientCount}</strong> {recipientCount === 1 ? 'family' : 'families'}{skippedCount > 0 && <span style={{ color: 'var(--em-text-tertiary)' }}> · {skippedCount} {skippedCount === 1 ? 'family has' : 'families have'} no events this week — will be skipped</span>}</>}
      </div>

      <div>
        <label htmlFor="dc-body" style={labelStyle}>Body notes</label>
        <textarea id="dc-body" value={bodyNotes} onChange={(e) => setBodyNotes(e.target.value)}
          placeholder="Personal-voice intro. Skip only for short weeks." rows={3} style={taStyle} />
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--em-text-primary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={opsEnabled} onChange={(e) => setOpsEnabled(e.target.checked)} style={{ width: 16, height: 16 }} />
          Include operational notes
        </label>
        {opsEnabled && (
          <textarea value={opsNotes} onChange={(e) => setOpsNotes(e.target.value)}
            placeholder={'One per line.\nArrive 15 minutes early.\nBring water bottles.'} rows={4} style={{ ...taStyle, marginTop: 8 }} />
        )}
      </div>

      <div>
        <label htmlFor="dc-signoff" style={labelStyle}>Signoff message</label>
        <textarea id="dc-signoff" value={signoffMessage} onChange={(e) => setSignoffMessage(e.target.value)}
          placeholder="Closing prose before the signature." rows={2} style={taStyle} />
      </div>

      <label className="sf-press" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10, backgroundColor: 'var(--em-info-soft)', border: '1px solid var(--em-info)', cursor: 'pointer' }}>
        <input type="checkbox" checked={testOnly} onChange={(e) => setTestOnly(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' }}>Send to admin@legacyhoopers.org only</div>
          <div style={{ fontSize: 12, color: 'var(--em-text-secondary)', marginTop: 2 }}>
            {testOnly ? 'Override the recipient list — admin@ will receive a single representative digest.' : 'Real send: families receive personalized digests, admin@ receives the BCC audit copy.'}
          </div>
        </div>
      </label>
    </div>
  );
}
