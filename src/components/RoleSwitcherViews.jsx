import { ChevronRight, ChevronLeft, Users, User, RotateCcw, X, Search } from 'lucide-react';

export function MainView({ isViewingAs, activeRole, onReset, onCoach, onParent, onClose }) {
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Switch home view</h2>
        <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center -mr-3">
          <X className="w-5 h-5" />
        </button>
      </div>
      {isViewingAs && (
        <button
          onClick={onReset}
          className="w-full flex items-center gap-3 p-4 mb-3 rounded-xl border-2 font-medium"
          style={{ borderColor: 'var(--em-warning, #D97706)', background: 'var(--em-warning-soft, #FEF3C7)' }}
        >
          <RotateCcw className="w-5 h-5" />
          Back to admin view
        </button>
      )}
      <Tile icon={Users} label="View as coach" active={activeRole === 'coach'} onClick={onCoach} />
      <Tile icon={User} label="View as parent" active={activeRole === 'parent'} chevron onClick={onParent} />
    </div>
  );
}

export function PickerView({ guardians, loading, search, onSearch, activeRole, viewAsGuardianId, onPick, onBack }) {
  return (
    <div className="pt-2">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} aria-label="Back" className="w-11 h-11 flex items-center justify-center -ml-3">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">Pick a parent</h2>
      </div>
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name or child"
          className="w-full pl-10 pr-3 py-3 rounded-xl border"
          style={{ borderColor: 'var(--em-border, #e5e7eb)' }}
        />
      </div>
      {loading && <p className="text-sm opacity-60 p-2">Loading...</p>}
      {!loading && guardians.length === 0 && <p className="text-sm opacity-60 p-2">No matches.</p>}
      {guardians.map((g) => {
        const isCurrent = activeRole === 'parent' && viewAsGuardianId === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onPick(g)}
            className="w-full flex items-center p-3 rounded-lg text-left"
            style={{
              background: isCurrent ? 'var(--em-accent-soft, #EBF1F8)' : 'transparent',
              borderLeft: `3px solid ${isCurrent ? 'var(--em-accent, #1E3A5F)' : 'transparent'}`,
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{g.firstName} {g.lastName}</div>
              <div className="text-xs opacity-60 truncate">{g.childNames.join(' + ') || 'no children'}</div>
            </div>
            {isCurrent && <span className="text-xs uppercase opacity-60">Current</span>}
          </button>
        );
      })}
    </div>
  );
}

function Tile({ icon: Icon, label, active, chevron, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 mb-2 rounded-xl text-left"
      style={{
        background: active ? 'var(--em-accent-soft, #EBF1F8)' : 'transparent',
        border: '1px solid var(--em-border, #e5e7eb)',
      }}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1 font-medium">{label}</span>
      {active && <span className="text-xs uppercase opacity-60 mr-1">Current</span>}
      {chevron && <ChevronRight className="w-4 h-4 opacity-50" />}
    </button>
  );
}
