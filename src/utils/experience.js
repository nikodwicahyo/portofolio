// Experience duration = sum of each stint's months, not first start → today.
// Gaps between jobs are excluded; months are inclusive of both end months
// (Sep–Dec = 4), open stints run through `now`, and a future end date is
// clamped to `now`. Overlapping stints count twice — fix the data, not this.
export function totalExperienceMonths(rows, now = new Date()) {
  const ref = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const refIndex = ref.getFullYear() * 12 + ref.getMonth();
  let total = 0;
  for (const row of rows || []) {
    const start = new Date(row?.start_date);
    if (Number.isNaN(start.getTime())) continue;
    const end = row?.end_date ? new Date(row.end_date) : ref;
    if (Number.isNaN(end.getTime())) continue;
    const startIndex = start.getFullYear() * 12 + start.getMonth();
    const endIndex = Math.min(end.getFullYear() * 12 + end.getMonth(), refIndex);
    total += Math.max(0, endIndex - startIndex + 1);
  }
  return total;
}

// Whole years, rounded; anything under a year reads "<1" (0 when there is none).
export function experienceYearsLabel(months) {
  const m = Number(months);
  if (!Number.isFinite(m) || m <= 0) return 0;
  return m < 12 ? "<1" : Math.round(m / 12);
}
