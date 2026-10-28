// Initial-load budget guard: parses dist/index.html, gzips every asset the
// browser requests before first paint (entry JS, modulepreload, stylesheet),
// and fails when the critical path grows past the budget.
// Run: npm run build && npm run perf:budget
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const KB = 1024;
const LIMITS = { js: 100 * KB, css: 25 * KB };
const htmlUrl = new URL("../dist/index.html", import.meta.url);

let html;
try {
  html = readFileSync(htmlUrl, "utf8");
} catch {
  console.error("dist/index.html is missing — run `npm run build` first.");
  process.exit(1);
}

const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
  .map((match) => match[1])
  .filter((asset, index, all) => all.indexOf(asset) === index);

const rows = assets.map((asset) => {
  const raw = readFileSync(new URL(`../dist${asset}`, import.meta.url));
  return { asset, gzip: gzipSync(raw).length };
});

const total = (ext) =>
  rows.filter((row) => row.asset.endsWith(ext)).reduce((sum, row) => sum + row.gzip, 0);

const js = total(".js");
const css = total(".css");

for (const row of rows) {
  console.log(`${(row.gzip / KB).toFixed(1)} KB gz  ${row.asset}`);
}
console.log(`\ninitial JS  ${(js / KB).toFixed(1)} KB gz  (budget ${LIMITS.js / KB} KB)`);
console.log(`initial CSS ${(css / KB).toFixed(1)} KB gz  (budget ${LIMITS.css / KB} KB)`);

const failures = [];
if (js > LIMITS.js) failures.push(`JS ${(js / KB).toFixed(1)} KB > ${LIMITS.js / KB} KB`);
if (css > LIMITS.css) failures.push(`CSS ${(css / KB).toFixed(1)} KB > ${LIMITS.css / KB} KB`);

if (failures.length) {
  console.error(`\nBudget exceeded: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nok - initial critical path is within budget");
