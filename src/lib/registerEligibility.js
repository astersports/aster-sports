// Pure: why an existing child cannot register for a division (null = eligible).
// Mirrors the server guards (grade band + gender) so the funnel select step can
// pre-empt a submit-time RAISE (RG-3). Grade/gender null = unknown -> not blocked
// here (the server still validates, and an ungendered division never blocks).
export function childIneligibleReason(child, division) {
  if (!division || !child) return null;
  const g = child.grade;
  if (division.grade_min != null && g != null && g < division.grade_min) return `Grade ${g} · below this group`;
  if (division.grade_max != null && g != null && g > division.grade_max) return `Grade ${g} · above this group`;
  if ((division.gender === 'male' || division.gender === 'female') && child.gender && child.gender !== division.gender) {
    return division.gender === 'male' ? 'Boys only' : 'Girls only';
  }
  return null;
}
