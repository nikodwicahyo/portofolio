# Performance ledger

Measured with `npx lighthouse@12 <url> --chrome-flags="--headless=new --disable-extensions"`.
The old baseline reports in the repo root were captured with browser extensions
enabled; extension scripts alone accounted for roughly 2.3 s of the mobile TBT,
so only extension-free runs are comparable.

| run | score | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- |
| mobile, before (extensions on) | 64 | — | 3.1 s | 2 400 ms | — |
| mobile, after (two runs) | **99 / 99** | 1.4 s | 1.9–2.0 s | 60–70 ms | 0 |
| desktop, before (extensions on) | 81 | — | — | 400 ms | — |
| desktop, after | **100** | 0.4 s | 0.5 s | 0 ms | 0 |

Mobile LCP is still the hero poster, but it now paints as part of the first
render instead of behind an opacity gate, and the 3 s `WelcomeScreen` no longer
drags FCP/TBT with it. The last point is reachable only by prerendering the
overlay into `index.html`; below ~1.2 s LCP the remaining cost is React boot.

Never audit `npm run dev`: Vite serves unbundled ESM (~300 module requests) with
the development React build. Only `npm run build && npm run preview` (or the
deployment) is comparable.

## Rules for keeping it there

- **First load must not touch Supabase.** Prefetch, realtime and per-section
  fetches all key off user intent (`wheel`/`touchmove`/`keydown`/`scroll`) or
  `IntersectionObserver`, never a short timer. A non-interacted load makes zero
  requests to `*.supabase.co`.
- **Below-the-fold work waits for the fold.** `useInView` gates the About
  counters and the CV metadata fetch; `Deferred` mounts Portofolio/Contact only
  within 800 px of the viewport.
- **The hero loop is decorative.** `preload="none"` + poster first; the loop's
  `src` is set on an idle slot *after* the welcome overlay clears (it used to
  compete with the splash and cost ~450 ms of mobile TBT), and it pauses when
  scrolled out.
- **Above-the-fold never animates through JS.** The hero cascade, the splash
  exit and route transitions are CSS keyframes (the hero starts when the welcome
  overlay clears); AOS is only for content below the first screen.
- **No animation library.** The splash exit that needed framer-motion is a
  keyframe now: −40 KB gz and ~125 ms of boot CPU.
- **Motion is intentional, not filtered by the OS setting.** The owner chose to
  always play the reveals and the hero loop, so `prefers-reduced-motion` is not
  wired to anything. (On this machine Windows "Animation effects" is off, so
  Chrome reports reduced motion — the site animates anyway.)

## Guard

`npm run verify` = lint, tests, build, then `npm run perf:budget`, which gzips
every asset `dist/index.html` asks for before first paint and fails over
100 KB JS / 25 KB CSS (currently ~98 KB total).

Re-measure a production build:

```bash
npm run build && npm run preview
npx lighthouse@12 http://localhost:4173/ --chrome-flags="--headless=new --disable-extensions"
```
