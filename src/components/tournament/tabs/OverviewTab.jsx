import { BedDouble, BookOpen, ExternalLink, Info, MapPin } from 'lucide-react';

function mapsUrl(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export default function OverviewTab({ tournament, isStaff }) {
  const hasAddress = Boolean(tournament.primary_venue_address);
  const hasHotel = Boolean(tournament.hotel_url);
  const hasTourneyUrl = Boolean(tournament.tourney_url);
  const hasNotes = Boolean(tournament.survival_notes);

  const card = {
    backgroundColor: 'var(--em-bg-card)', borderRadius: 10,
    border: '1px solid var(--em-border-default)', padding: 14, marginBottom: 12,
  };
  const sectionLabel = {
    fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'var(--em-text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
  };
  const value = { fontSize: 15, color: 'var(--em-text-primary)', lineHeight: 1.4 };
  const linkButton = {
    display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40,
    padding: '0 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    textDecoration: 'none', marginTop: 8,
    backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)',
  };

  return (
    <div>
      {tournament.schedule_status !== 'draft' && tournament.schedule_status != null && (tournament.primary_venue || hasAddress) && (
        <div style={card}>
          <div style={sectionLabel}><MapPin size={11} strokeWidth={2} /> Venue</div>
          <div style={value}>{tournament.primary_venue || 'Unnamed venue'}</div>
          {hasAddress && <div style={{ ...value, fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 }}>{tournament.primary_venue_address}</div>}
          {hasAddress && (
            <a href={mapsUrl(tournament.primary_venue_address)} target="_blank" rel="noopener noreferrer" style={linkButton} aria-label="Open venue in Google Maps">
              Open in Maps <ExternalLink size={12} strokeWidth={2} />
            </a>
          )}
        </div>
      )}
      {(tournament.schedule_status === 'draft' || tournament.schedule_status == null) && (
        <div style={card}>
          <div style={sectionLabel}><MapPin size={11} strokeWidth={2} /> Venue</div>
          <div style={{ ...value, fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.5 }}>
            Schedule releases Wednesday. Venue, court assignments, and game times will appear once the tournament organizer publishes the bracket.
          </div>
        </div>
      )}

      {hasTourneyUrl && (
        <div style={card}>
          <div style={sectionLabel}><ExternalLink size={11} strokeWidth={2} /> Tournament page</div>
          <a href={tournament.tourney_url} target="_blank" rel="noopener noreferrer" style={linkButton}>
            View on SE Tourney <ExternalLink size={12} strokeWidth={2} />
          </a>
        </div>
      )}

      {hasHotel && (
        <div style={card}>
          <div style={sectionLabel}><BedDouble size={11} strokeWidth={2} /> Hotel block</div>
          <a href={tournament.hotel_url} target="_blank" rel="noopener noreferrer" style={linkButton}>
            Book hotel <ExternalLink size={12} strokeWidth={2} />
          </a>
          {tournament.hotel_deadline_at && (
            <div style={{ fontSize: 13, color: 'var(--em-warning)', marginTop: 8 }}>
              Deadline: {new Date(tournament.hotel_deadline_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}
            </div>
          )}
        </div>
      )}

      {hasNotes && (
        <div style={card}>
          <div style={sectionLabel}><Info size={11} strokeWidth={2} /> Parent survival notes</div>
          <div style={{ ...value, whiteSpace: 'pre-wrap' }}>{tournament.survival_notes}</div>
        </div>
      )}

      <div style={card}>
        <div style={sectionLabel}><BookOpen size={11} strokeWidth={2} /> Game day guide</div>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
          Structured field guide for parents: arrival, parking, concessions, rules, contacts.
        </div>
      </div>

      {!tournament.primary_venue && !hasAddress && !hasTourneyUrl && !hasHotel && !hasNotes && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
          No details yet. {isStaff && 'Tap Edit above to add venue, links, and survival notes.'}
        </div>
      )}
    </div>
  );
}
