// Runnable check that the hero video picks alpha WebM only where it works.
// Regression it guards: Safari accepts VP9 in <video> but drops the alpha
// plane, so feature-detecting WebM alone would show a white/black box.
// Run: npm test   (plain Node, no deps, no network)
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { HERO_SOURCES, pickHeroSources, supportsAlphaVideo } from "../src/utils/video.js";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0";
const SAFARI = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const IOS_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1";
const IOS_EDGE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/140.0.0.0 Version/17.0 Mobile/15E148 Safari/604.1";

const yes = () => "probably";
const no = () => "";

assert.equal(supportsAlphaVideo({ userAgent: CHROME, canPlayType: yes }), true, "Chromium gets alpha WebM");
assert.equal(supportsAlphaVideo({ userAgent: FIREFOX, canPlayType: yes }), true, "Gecko gets alpha WebM");
assert.equal(supportsAlphaVideo({ userAgent: SAFARI, canPlayType: yes }), false, "Safari must use the opaque fallback");
assert.equal(supportsAlphaVideo({ userAgent: IOS_CHROME, canPlayType: yes }), false, "iOS Chrome is WebKit → fallback");
assert.equal(supportsAlphaVideo({ userAgent: IOS_EDGE, canPlayType: yes }), false, "iOS Edge is WebKit → fallback");
assert.equal(supportsAlphaVideo({ userAgent: CHROME, canPlayType: no }), false, "No VP9 → fallback");

console.log("ok - hero video: alpha WebM only on browsers that keep the alpha plane");

// Performance budget: the hero stays video-sized (never GIF-sized) and the
// picker still returns real files. Guards against re-shipping a 7 MB GIF.
const BUDGET_KB = {
  "public/hero-anim.v2.webm": 600,
  "public/hero-anim.v2.mobile.webm": 200,
  "public/hero-fallback.v2.mp4": 350,
  "public/hero-fallback.v2.mobile.mp4": 60,
  "public/hero-poster.v2.webp": 60,
  "public/hero-poster.v2.mobile.webp": 30,
};
for (const [file, max] of Object.entries(BUDGET_KB)) {
  assert.ok(existsSync(file), `${file} is missing`);
  const kb = statSync(file).size / 1024;
  assert.ok(kb <= max, `${file} is ${kb.toFixed(0)} KB, over the ${max} KB budget`);
}

// Phones take the 720px renditions; everything else the 1200px ones.
assert.deepEqual(
  pickHeroSources({ smallViewport: true, alphaVideo: false }),
  { video: "/hero-fallback.v2.mobile.mp4", poster: "/hero-poster.v2.mobile.webp" }
);
assert.deepEqual(
  pickHeroSources({ smallViewport: false, alphaVideo: true }),
  { video: "/hero-anim.v2.webm", poster: "/hero-poster.v2.webp" }
);
for (const set of Object.values(HERO_SOURCES)) {
  for (const src of Object.values(set)) {
    assert.ok(existsSync(`public${src}`), `HERO_SOURCES points at a missing file: ${src}`);
  }
}
console.log("ok - hero assets: two renditions, within budget and wired through HERO_SOURCES");
