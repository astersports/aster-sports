import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ padding: 16, marginBottom: 16, backgroundColor: '#FEE2E2', borderRadius: 10, border: '2px solid #DC2626' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
          BARE MINIMUM TEST (count: {count})
        </div>
        <div style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>
          Team ID: {teamId || 'none'}
        </div>
        <button
          type="button"
          onClick={() => { setCount(c => c + 1); }}
          style={{ minHeight: 44, padding: '0 24px', borderRadius: 10, border: '2px solid #DC2626', backgroundColor: '#fff', color: '#DC2626', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          TAP ME
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigate('/teams')}
        style={{ minHeight: 44, padding: '0 16px', borderRadius: 10, border: '1px solid #ccc', backgroundColor: '#fff', fontSize: 15, cursor: 'pointer' }}
      >
        Go Back to Teams
      </button>
      <a href="/teams" style={{ display: 'block', marginTop: 16, color: '#3B82F6', fontSize: 15 }}>
        Native link to /teams (no React)
      </a>
    </div>
  );
}
