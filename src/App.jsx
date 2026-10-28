import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import AOS from "aos";
import "aos/dist/aos.css";
import "./index.css";
import Navbar from "./components/Navbar";
import Home from "./Pages/Home";
import About from "./Pages/About";
import AnimatedBackground from "./components/Background";
import Footer from "./components/Footer";
// Static, not lazy: the welcome overlay is the first paint of a cold visit, so
// its code must be in the entry chunk rather than one round trip away.
import WelcomeScreen from "./Pages/WelcomeScreen";

import ErrorBoundary from "./components/ErrorBoundary";
import { goAdmin } from "./utils/goAdmin";
import { scrollToHash } from "./utils/navigation";

const Portofolio = lazy(() => import("./Pages/Portofolio"));
const ContactPage = lazy(() => import("./Pages/Contact"));
const ProjectDetails = lazy(() => import("./components/ProjectDetail"));
const NotFoundPage = lazy(() => import("./Pages/404"));
const ThankYouPage = lazy(() => import("./Pages/ThankYou"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
// Both touch Supabase, which is pointless to ship to the landing page.
const Login = lazy(() => import("./Pages/Login"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

// CSS-only route transition. framer-motion used to sit in the entry graph just
// for this; only the lazy welcome splash still imports it now.
const PageTransition = ({ children }) => <div className="page-enter">{children}</div>;

// Mounts below-the-fold sections once they are within 400 px of the viewport,
// which keeps the MUI/section chunks out of the first load without showing an
// empty band: the app warms those chunks on scroll/idle (see App's `warm`), so
// by the time this fires the section renders filled in. The placeholder borrows
// the section's anchor id so #Portofolio links still have a target.
const Deferred = ({ anchorId, minHeight = "50vh", children }) => {
  const ref = useRef(null);
  // A deep link to the section must mount it up front: the placeholder has the
  // id, so the browser would otherwise leave the user on an empty 50vh gap.
  const [show, setShow] = useState(
    () => typeof window !== "undefined" && window.location.hash === `#${anchorId}`
  );

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    // The anchor id lives on the wrapper for the section's whole life, so a
    // fast scroll / #hash jump always has a target — even while the lazy chunk
    // is still in flight (the section below no longer carries the id).
    <div ref={ref} id={anchorId} className="scroll-mt-16" style={show ? undefined : { minHeight }}>
      {show ? (
        <Suspense fallback={<DeferredFallback minHeight={minHeight} />}>{children}</Suspense>
      ) : (
        <DeferredFallback />
      )}
    </div>
  );
};

// Keeps the deferred block's footprint while its chunk loads, so a fast scroll
// sees a placeholder of the right size instead of a collapsing page.
const DeferredFallback = ({ minHeight }) => (
  <div style={{ minHeight }} className="animate-pulse px-[5%] lg:px-[10%] py-10 space-y-4" aria-hidden="true">
    <div className="h-8 w-48 rounded bg-soft" />
    <div className="h-4 w-64 rounded bg-soft" />
    <div className="h-64 w-full rounded-xl bg-soft" />
  </div>
);

const LandingPage = ({ showWelcome, setShowWelcome }) => {
  const { hash } = useLocation();
  // Route arrivals carry their destination in the hash (e.g. /#Portofolio from
  // a project detail). Align after mount, then once more when lazy/deferred
  // sections and fonts have settled.
  useEffect(() => scrollToHash(hash), [hash]);

  return (
    <>
      {showWelcome && (
        <Suspense fallback={null}>
          <WelcomeScreen onLoadingComplete={() => setShowWelcome(false)} />
        </Suspense>
      )}

      <Navbar />
      <main className="pt-16">
        <Home revealed={!showWelcome} />
        <About />
        <Deferred anchorId="Portofolio">
          <Portofolio />
        </Deferred>
        <Deferred anchorId="Contact" minHeight="40vh">
          <ContactPage />
        </Deferred>
      </main>
      <Footer />
    </>
  );
};

const ProjectPageLayout = () => (
  <>
    <Navbar />
    <main className="pt-16">
      <Suspense fallback={<div className="min-h-screen" />}>
        <ProjectDetails />
      </Suspense>
    </main>
    <Footer />
  </>
);

function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return sessionStorage.getItem("welcomeShown") !== "1"; } catch { return true; }
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Hidden admin shortcut: Ctrl/Cmd+Shift+L. Skipped while typing so
  // dashboard edits are never interrupted by a stray keypress.
  useEffect(() => {
    const onKey = (e) => {
      if (!((e.ctrlKey || e.metaKey) && e.shiftKey)) return;
      if (String(e.key || '').toLowerCase() !== 'l') return;
      const t = e.target;
      if (t && (t.closest?.('input,textarea,select,[contenteditable="true"]'))) return;
      e.preventDefault();
      goAdmin(navigate);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  useEffect(() => {
    // Reveal on every pass (as before), independent of the OS motion setting:
    // the reveals are the site's intended look.
    AOS.init({ once: false, offset: 10 });
    let refreshTimer;
    const onResize = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => AOS.refresh(), 150);
    };
    window.addEventListener("resize", onResize);

    // Data prefetch + realtime socket: first scroll/key/touch, or an 8 s
    // fallback for visitors who never move. Both stay out of the measured
    // first-load window, and the 53 KB Supabase chunk is still dynamic.
    let fallbackTimer;
    let prefetchTimer;
    let stopRealtime;
    let cancelled = false;
    let started = false;

    const warmData = () => {
      if (started || cancelled) return;
      started = true;
      clearTimeout(fallbackTimer);
      Promise.all([
        import("./utils/portfolioPrefetch"),
        import("./utils/realtimeSync"),
      ])
        .then(([{ prefetchPortfolioData, clearStaleCache }, { initRealtimeSync }]) => {
          if (cancelled) return;
          clearStaleCache();
          try { stopRealtime = initRealtimeSync(); } catch { /* noop */ }
          prefetchTimer = setTimeout(() => { prefetchPortfolioData(); }, 400);
        })
        .catch(() => { /* offline or chunk failed: the page still works */ });
    };

    // Section chunks (~200 KB of MUI) are only fetched once the visitor shows
    // intent. Contact loads through its own Deferred sentinel, so a keypress
    // near the hero no longer pulls its form/validation chunk too.
    let sectionsWarmed = false;
    const warmSections = () => {
      if (sectionsWarmed || cancelled) return;
      sectionsWarmed = true;
      import("./Pages/Portofolio").catch(() => { /* the click handler retries */ });
    };

    const onIntent = () => {
      warmData();
      warmSections();
    };
    const intentEvents = ["wheel", "touchmove", "keydown", "scroll"];
    intentEvents.forEach((evt) =>
      window.addEventListener(evt, onIntent, { passive: true, once: true })
    );

    const scheduleFallback = () => {
      fallbackTimer = setTimeout(warmData, 8000);
    };
    if (document.readyState === "complete") scheduleFallback();
    else window.addEventListener("load", scheduleFallback, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleFallback);
      window.removeEventListener("resize", onResize);
      intentEvents.forEach((evt) => window.removeEventListener(evt, onIntent));
      clearTimeout(refreshTimer);
      clearTimeout(fallbackTimer);
      clearTimeout(prefetchTimer);
      try { stopRealtime?.(); } catch { /* noop */ }
    };
  }, []);

  useEffect(() => {
    if (!showWelcome) {
      try { sessionStorage.setItem("welcomeShown", "1"); } catch { /* best-effort */ }
    }
  }, [showWelcome]);

  return (
    <ErrorBoundary resetKey={location.pathname}>
    <HelmetProvider>
      <div className="pointer-events-none">
  <AnimatedBackground />
</div>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage showWelcome={showWelcome} setShowWelcome={setShowWelcome} />} />
        <Route path="/project/:slug" element={<PageTransition><ProjectPageLayout /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Suspense fallback={null}><Login /></Suspense></PageTransition>} />
        <Route path="/thank-you" element={<PageTransition><Suspense fallback={null}><ThankYouPage /></Suspense></PageTransition>} />
        <Route path="/dashboard/*" element={<PageTransition><Suspense fallback={<div className="min-h-screen" />}><ProtectedRoute><Dashboard /></ProtectedRoute></Suspense></PageTransition>} />
        <Route path="*" element={<PageTransition><Suspense fallback={null}><NotFoundPage /></Suspense></PageTransition>} />
      </Routes>
    </HelmetProvider>
    </ErrorBoundary>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;