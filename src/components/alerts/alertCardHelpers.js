// Pure content + routing helpers for AlertCard. Extracted to keep
// AlertCard.jsx under the 150-line cap (CLAUDE.md §6 / AP #11) when
// tournament_prelim drill-down + non-expandable tap-through targets
// were added.

export const EXPANDABLE_TYPES = new Set([
  'location_unassigned',
  'opponent_unassigned',
  'data_integrity_event_location_missing',
]);

// briefing_overdue instances that expand into a per-instance list with a
// Compose link per row: game_recap → past games, tournament_recap → past
// tournaments, tournament_prelim → upcoming tournaments (prelim added for
// parity with recap — both carry a specific tournament to act on).
export const EXPANDABLE_BRIEFING_INSTANCES = new Set(['game_recap', 'tournament_recap', 'tournament_prelim']);

// Briefing instances whose drill-down list comes from data.tournaments
// (vs data.events). Both tournament instances key off the tournament.
export const TOURNAMENT_BRIEFING_INSTANCES = new Set(['tournament_recap', 'tournament_prelim']);

const COMPOSE_BASE = '/admin/briefings/compose';

export function alertTitle(alert) {
  switch (alert.alert_type_key) {
    case 'rsvp_shortfall': return alert.instance_key === 'saturday_6am' ? 'Roster shortfall today' : 'RSVP shortfall';
    case 'briefing_overdue':
      if (alert.instance_key === 'tournament_prelim') return 'Tournament prelim briefing overdue';
      if (alert.instance_key === 'game_recap') return 'Game recap pending';
      if (alert.instance_key === 'tournament_recap') return 'Tournament recap pending';
      return 'Weekly briefing overdue';
    case 'location_unassigned': return 'Event missing location';
    case 'opponent_unassigned': return 'Event missing opponent';
    case 'payment_overdue': return 'Payments overdue';
    case 'data_integrity_event_location_missing': return 'Event location data broken';
    default: return alert.alert_type_key;
  }
}

export function alertBody(alert) {
  const d = alert.data || {};
  switch (alert.alert_type_key) {
    case 'rsvp_shortfall': return `${d.affected_count || 0} event${(d.affected_count || 0) === 1 ? '' : 's'} affected`;
    case 'briefing_overdue':
      if (alert.instance_key === 'game_recap') return `${d.count || 0} game${(d.count || 0) === 1 ? '' : 's'} need a recap`;
      if (alert.instance_key === 'tournament_recap') return `${d.count || 0} tournament${(d.count || 0) === 1 ? '' : 's'} need a recap`;
      return d.tournaments ? `${d.tournaments.length} upcoming` : `Expected by ${d.expected_send_by || 'usual window'}`;
    case 'location_unassigned': return `${(d.events || []).length} event${(d.events || []).length === 1 ? '' : 's'}${d.critical_count ? ` · ${d.critical_count} <24h` : ''}`;
    case 'opponent_unassigned': return `${(d.events || []).length} event${(d.events || []).length === 1 ? '' : 's'}${d.critical_count ? ` · ${d.critical_count} <24h` : ''}`;
    case 'payment_overdue': {
      const dollars = ((d.total_outstanding_cents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      // Scope qualifier (BUG-1): this alert is org-wide / all-seasons
      // (getOverdueFamilyBalances takes no season_id), whereas Program
      // Health's "Payment collection" is season-scoped. Declaring the
      // scope keeps "100% collected (this season)" from reading as a
      // contradiction next to a prior-season balance on the same screen.
      return `${dollars} across ${d.family_count || 0} famil${(d.family_count || 0) === 1 ? 'y' : 'ies'} · all seasons`;
    }
    case 'data_integrity_event_location_missing': return `${d.count || 0} event${(d.count || 0) === 1 ? '' : 's'} missing location data`;
    default: return '';
  }
}

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

export function composeTargetFor(alert, item) {
  if (alert.instance_key === 'tournament_recap') return `${COMPOSE_BASE}?anchor=tournament&id=${item.id}&kind=tournament_recap`;
  if (alert.instance_key === 'tournament_prelim') return `${COMPOSE_BASE}?anchor=tournament&id=${item.id}&kind=tournament_prelim`;
  return `${COMPOSE_BASE}?anchor=event&id=${item.id}&kind=game_recap`;
}

export function rowPropsForItem(alert, item) {
  if (alert.instance_key === 'tournament_recap') {
    return { title: item.name, subtitle: `Ended ${fmtDate(item.end_date)}`, cta: 'Compose →' };
  }
  if (alert.instance_key === 'tournament_prelim') {
    return { title: item.name, subtitle: item.start_date ? `Starts ${fmtDate(item.start_date)}` : 'Upcoming', cta: 'Compose →' };
  }
  const teamName = item.teams?.name || item.team_name || 'Team';
  const title = `${teamName}${item.opponent ? ` vs. ${item.opponent}` : ''}`;
  const subtitle = fmtDate(item.start_at);
  const cta = (alert.alert_type_key === 'briefing_overdue') ? 'Compose →' : 'Fix →';
  return { title, subtitle, cta };
}

// Single tap-through target for alerts that don't expand into a list, so
// no alert is a dead card: weekly briefing → compose that kind; payments
// → the financial dashboard. Returns null when no sensible target exists.
export function navTargetForAlert(alert) {
  // ROSTER-2: ?owing=1 makes Financials land on the season that actually
  // has the owing family + enable the "Owing only" filter, so the family
  // that triggered this alert is findable (it's often a prior season).
  if (alert.alert_type_key === 'payment_overdue') return '/admin/financials?owing=1';
  if (alert.alert_type_key === 'briefing_overdue') return `${COMPOSE_BASE}?kind=${alert.data?.briefing_kind || 'weekly_digest'}`;
  // BUG-3: rsvp_shortfall was a dead card (no expand, no target) despite
  // the "every alert is actionable" contract — so it rendered no chevron
  // while sibling alerts did. Route to the schedule where the affected
  // events live so the affordance is consistent and the card acts.
  if (alert.alert_type_key === 'rsvp_shortfall') return '/schedule';
  return null;
}
