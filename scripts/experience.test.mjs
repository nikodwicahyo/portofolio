// Runnable check that years of experience sums per-stint months instead of
// spanning first start → today. Regression it guards: a first→last span counts
// the multi-year gaps between jobs as experience.
// Run: npm test   (plain Node, no deps, no network)
import assert from "node:assert/strict";
import { experienceYearsLabel, totalExperienceMonths } from "../src/utils/experience.js";

const NOW = new Date("2026-11-14T00:00:00Z");

// Same stints as the portfolio: 4 + 7 + 12 months, with years of gaps between.
const STINTS = [
  { start_date: "2025-09-01", end_date: "2025-12-31" },
  { start_date: "2021-10-01", end_date: "2022-04-30" },
  { start_date: "2020-07-01", end_date: "2021-06-30" },
];
assert.equal(totalExperienceMonths(STINTS, NOW), 23, "months are summed per stint, gaps excluded");
assert.notEqual(totalExperienceMonths(STINTS, NOW), 77, "must not span first start → today");
assert.equal(experienceYearsLabel(23), 2, "23 months reads as 2 years");

// Inclusive months, open stints, and bad rows.
assert.equal(totalExperienceMonths([{ start_date: "2025-09-30", end_date: "2025-12-01" }], NOW), 4, "both end months count");
assert.equal(totalExperienceMonths([{ start_date: "2026-09-01", end_date: null }], NOW), 3, "open stint runs through now");
assert.equal(totalExperienceMonths([{ start_date: "2026-01-01", end_date: "2027-06-30" }], NOW), 11, "future end clamps to now");
assert.equal(totalExperienceMonths([{ end_date: "2025-12-31" }], NOW), 0, "missing start ignored");
assert.equal(totalExperienceMonths([{ start_date: "not-a-date", end_date: null }], NOW), 0, "invalid start ignored");
assert.equal(totalExperienceMonths([{ start_date: "2025-06-01", end_date: "2025-01-01" }], NOW), 0, "end before start adds nothing");
assert.equal(totalExperienceMonths(null, NOW), 0, "no rows → 0");

// Rounded whole years, with nothing under a year overstated.
assert.equal(experienceYearsLabel(0), 0, "no stints → 0");
assert.equal(experienceYearsLabel(4), "<1", "4 months reads as <1");
assert.equal(experienceYearsLabel(11), "<1", "11 months reads as <1");
assert.equal(experienceYearsLabel(12), 1);
assert.equal(experienceYearsLabel(18), 2, "1.5 years rounds up");
assert.equal(experienceYearsLabel(30), 3);
assert.equal(experienceYearsLabel(42), 4);
assert.equal(experienceYearsLabel(NaN), 0, "NaN cache → 0");

console.log("ok - experience: months summed per stint, gaps excluded, whole years rounded");
