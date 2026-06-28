import { useCallback, useMemo, useState } from 'react';

// L99 SchedulePage enhancement #5 (perf + thin-page): the page's filter
// state, URL reflection, memoized filtering, and the derived event-date
// list lived inline. Extracting them keeps SchedulePage.jsx under the
// 150-line cap (§6) and gives every handler a stable identity (useCallback)
// so memoized children (ScheduleListSections, ActiveFilterSummary) don't
// re-render on unrelated state churn. Pure UI state only — no IO.
export function useScheduleFilters(activities, myChildren) {
  const [selectedTeam, setSelectedTeam] = useState(
    () => new URLSearchParams(window.location.search).get('team'),
  );
  const [selectedType, setSelectedType] = useState(null);
  const [activeKidFilter, setActiveKidFilter] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const selectTeam = useCallback((t) => {
    setSelectedTeam(t);
    const u = new URL(window.location);
    if (t) u.searchParams.set('team', t); else u.searchParams.delete('team');
    window.history.replaceState({}, '', u);
  }, []);

  const toggleCancelled = useCallback(() => setShowCancelled((v) => !v), []);
  const clearAll = useCallback(() => {
    selectTeam(null);
    setSelectedType(null);
    setActiveKidFilter(null);
    setShowCancelled(false);
  }, [selectTeam]);

  const filtered = useMemo(() => {
    let list = activities || [];
    const kid = activeKidFilter && (myChildren || []).find((k) => k.playerId === activeKidFilter);
    const kidTeamIds = kid?.teamIds?.length ? kid.teamIds : (kid?.teamId ? [kid.teamId] : []);
    if (kidTeamIds.length) list = list.filter((a) => kidTeamIds.includes(a.team_id));
    if (selectedTeam) list = list.filter((a) => a.team_id === selectedTeam);
    if (selectedType) list = list.filter((a) => a.event_type === selectedType);
    if (!showCancelled) list = list.filter((a) => a.status !== 'cancelled');
    return list.slice().sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [activities, selectedTeam, selectedType, showCancelled, activeKidFilter, myChildren]);

  // SD-8: dots reflect the FILTERED set; NY-anchored day key (timezone pin).
  const eventDates = useMemo(
    () => filtered
      .map((a) => (a.start_at ? new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) : null))
      .filter(Boolean),
    [filtered],
  );

  const teamName = useMemo(() => {
    if (!selectedTeam) return null;
    const hit = (activities || []).find((a) => a.team_id === selectedTeam && a.teams);
    return hit?.teams?.name || null;
  }, [selectedTeam, activities]);

  const kidName = useMemo(() => {
    if (!activeKidFilter) return null;
    return (myChildren || []).find((k) => k.playerId === activeKidFilter)?.firstName || null;
  }, [activeKidFilter, myChildren]);

  const hasActiveFilters = Boolean(selectedTeam || selectedType || activeKidFilter || showCancelled);

  return {
    selectedTeam, selectTeam, selectedType, setSelectedType,
    activeKidFilter, setActiveKidFilter, showCancelled, toggleCancelled,
    selectedDate, setSelectedDate, clearAll, filtered, eventDates,
    teamName, kidName, hasActiveFilters,
  };
}
