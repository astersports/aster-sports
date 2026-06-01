import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronLeft, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { importToFinancials, parseLeagueAppsData } from '../lib/leagueAppsImport';
import { formatCurrency } from '../lib/formatters';
import Button from '../components/shared/Button';
import Label from '../components/shared/Label';

export default function FinancialImportPage() {
  const { orgId, user } = useAuth();
  const navigate = useNavigate();
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleParse = () => {
    setParseError('');
    setParsed(null);
    try {
      const families = parseLeagueAppsData(raw);
      if (families.length === 0) { setParseError('No families found in data.'); return; }
      setParsed(families);
    } catch (e) { setParseError(e.message); }
  };

  const handleImport = async () => {
    if (!parsed || !orgId) return;
    setImporting(true);
    const seasonRes = await (await import('../lib/supabase')).supabase
      .from('seasons').select('id').eq('org_id', orgId).eq('status', 'active').maybeSingle();
    if (!seasonRes.data) { setResult({ errors: ['No active season found.'] }); setImporting(false); return; }
    const r = await importToFinancials(parsed, orgId, seasonRes.data.id, user.id);
    setResult(r);
    setImporting(false);
  };

  const fmt = formatCurrency;  // shared helper (style:currency) — identical $X,XXX.00 output

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <button type="button" onClick={() => navigate('/admin/financials')} className="as-press" style={{ display: 'flex', alignItems: 'center', minHeight: 44, background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12, padding: 0 }}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Back to Financials
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 16 }}>Import LeagueApps Data</h1>

      {result ? (
        <ResultView result={result} onDone={() => navigate('/admin/financials')} />
      ) : parsed ? (
        <PreviewView families={parsed} fmt={fmt} importing={importing} onImport={handleImport} onBack={() => setParsed(null)} />
      ) : (
        <PasteView raw={raw} setRaw={setRaw} parseError={parseError} onParse={handleParse} />
      )}
    </div>
  );
}

function PasteView({ raw, setRaw, parseError, onParse }) {
  return (
    <>
      <Label>Paste LeagueApps JSON export</Label>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder='[{"parentFirstName":"John","parentLastName":"Doe","registrationFee":"$350",...}]'
        style={{ width: '100%', minHeight: 160, padding: 12, fontSize: 13, fontFamily: 'monospace', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', resize: 'vertical' }}
      />
      {parseError && <div style={{ color: 'var(--as-danger)', fontSize: 13, marginTop: 8 }}>{parseError}</div>}
      <Button onClick={onParse} disabled={!raw.trim()} fullWidth style={{ marginTop: 16 }}>
        <Upload size={16} strokeWidth={1.75} /> Parse Data
      </Button>
    </>
  );
}

function PreviewView({ families, fmt, importing, onImport, onBack }) {
  const totalFee = families.reduce((s, f) => s + f.totalFeeCents, 0);
  const totalPaid = families.reduce((s, f) => s + f.totalPaidCents, 0);
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <StatMini label="Families" value={families.length} />
        <StatMini label="Players" value={families.reduce((s, f) => s + f.players.length, 0)} />
        <StatMini label="Total Fees" value={fmt(totalFee)} />
        <StatMini label="Total Paid" value={fmt(totalPaid)} />
      </div>
      <Label>Preview ({families.length} families)</Label>
      <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
        {families.slice(0, 20).map((f, i) => (
          <div key={i} style={{ padding: '10px 14px', borderTop: i ? '1px solid var(--as-border-subtle)' : 'none', fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: 'var(--as-text-primary)' }}>{f.firstName} {f.lastName}</div>
            <div style={{ color: 'var(--as-text-tertiary)' }}>Fee: {fmt(f.totalFeeCents)} · Paid: {fmt(f.totalPaidCents)} · {f.players.length} player{f.players.length !== 1 ? 's' : ''}</div>
          </div>
        ))}
        {families.length > 20 && <div style={{ padding: 10, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 12 }}>+{families.length - 20} more…</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button variant="secondary" onClick={onBack} style={{ flex: 1 }}>Back</Button>
        <Button onClick={onImport} disabled={importing} style={{ flex: 1 }}>{importing ? 'Importing…' : 'Import All'}</Button>
      </div>
    </>
  );
}

function ResultView({ result, onDone }) {
  return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      {result.errors?.length > 0 ? (
        <AlertTriangle size={40} style={{ color: 'var(--as-warning)', marginBottom: 12 }} />
      ) : (
        <CheckCircle2 size={40} style={{ color: 'var(--as-success)', marginBottom: 12 }} />
      )}
      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 8 }}>
        {result.created} families imported{result.skipped > 0 ? `, ${result.skipped} skipped` : ''}
      </div>
      {result.errors?.length > 0 && (
        <div style={{ textAlign: 'left', fontSize: 12, color: 'var(--as-danger)', marginBottom: 16, maxHeight: 120, overflow: 'auto' }}>
          {result.errors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}
      <Button onClick={onDone} fullWidth>Done</Button>
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div style={{ padding: 12, backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}
