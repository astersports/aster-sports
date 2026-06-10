// Quarter presets for season programs — maps a quarter label + year to
// { name, start_date, end_date }. Pure (AP#27); shared by the program create +
// edit forms. Ported from the retired SeasonFormSheet (PR-A1 one-door).
export const SEASON_QUARTERS = ['Spring', 'Summer', 'Fall', 'Winter'];

// 1-indexed [month, day] start/end per quarter. Winter rolls into next year.
const QUARTER_MONTHS = {
  Spring: { start: [3, 1], end: [6, 30] },
  Summer: { start: [7, 1], end: [8, 31] },
  Fall: { start: [9, 1], end: [11, 30] },
  Winter: { start: [12, 1], end: [2, 28] },
};

const ymd = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function applySeasonPreset(quarter, year) {
  const p = QUARTER_MONTHS[quarter];
  const endYear = quarter === 'Winter' ? year + 1 : year;
  // Feb end-day respects leap years (new Date(y, 2, 0) = last day of Feb).
  const endDay = quarter === 'Winter' ? new Date(endYear, 2, 0).getDate() : p.end[1];
  return {
    name: `${quarter} ${year}`,
    start_date: ymd(year, p.start[0], p.start[1]),
    end_date: ymd(endYear, p.end[0], endDay),
  };
}
