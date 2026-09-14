import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import AOS from "aos";
import "aos/dist/aos.css";
import "./index.css";
import Navbar from "./components/Navbar";
import Home from "./Pages/Home";
import About from "./Pages/About";
import AnimatedBackground from "./components/Background";
import { AnimatePresence, motion } from "framer-motion";
import Footer from "./components/Footer";

import Login from "./Pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { prefetchPortfolioData, clearStaleCache } from "./utils/portfolioPrefetch";
import { initRealtimeSync } from "./utils/realtimeSync";

const Portofolio = lazy(() => import("./Pages/Portofolio"));
const ContactPage = lazy(() => import("./Pages/Contact"));
const ProjectDetails = lazy(() => import("./components/ProjectDetail"));
const WelcomeScreen = lazy(() => import("./Pages/WelcomeScreen"));
const NotFoundPage = lazy(() => import("./Pages/404"));
const ThankYouPage = lazy(() => import("./Pages/ThankYou"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.2, ease: "easeIn" } },
};

const PageTransition = ({ children }) => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

const LandingPage = ({ showWelcome, setShowWelcome }) => {
  return (
    <>
      <AnimatePresence mode="wait">
        {showWelcome && (
          <Suspense fallback={null}>
            <WelcomeScreen onLoadingComplete={() => setShowWelcome(false)} />
          </Suspense>
        )}
      </AnimatePresence>

      {!showWelcome && (
        <>
          <Navbar />
          <div className="pt-16">
            <Home />
            <About />
            <Suspense fallback={<div className="h-20" />}>
              <Portofolio />
              <ContactPage />
          </Suspense>
          <Footer />
          </div>
        </>
      )}
    </>
  );
};

const ProjectPageLayout = () => (
  <>
    <Navbar />
    <div className="pt-16">
      <Suspense fallback={<div className="min-h-screen" />}>
        <ProjectDetails />
      </Suspense>
    </div>
    <Footer />
  </>
);

function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return sessionStorage.getItem("welcomeShown") !== "1"; } catch { return true; }
  });
  const location = useLocation();

  useEffect(() => {
    clearStaleCache();
    AOS.init({ once: false, offset: 10 });
    let refreshTimer;
    const onResize = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => AOS.refresh(), 150);
    };
    window.addEventListener("resize", onResize);

    // Off the critical path: socket + prefetch run when the browser is idle.
    // The 400ms prefetch delay also lets the visible tab's own fetch finish
    // first, so prefetch skips it instead of duplicating the request.
    let idleId;
    let prefetchTimer;
    let stopRealtime;
    const runIdle = () => {
      try { stopRealtime = initRealtimeSync(); } catch { /* noop */ }
      prefetchTimer = setTimeout(() => { prefetchPortfolioData(); }, 400);
    };
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(runIdle, { timeout: 3000 });
    } else {
      prefetchTimer = setTimeout(runIdle, 500);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(refreshTimer);
      clearTimeout(prefetchTimer);
      if (idleId && typeof window.cancelIdleCallback === "function") {
        try { window.cancelIdleCallback(idleId); } catch { /* noop */ }
      }
      try { stopRealtime?.(); } catch { /* noop */ }
    };
  }, []);

  useEffect(() => {
    if (!showWelcome) {
      try { sessionStorage.setItem("welcomeShown", "1"); } catch { /* best-effort */ }
      prefetchPortfolioData();
    }
  }, [showWelcome]);

  return (
    <ErrorBoundary resetKey={location.pathname}>
    <HelmetProvider>
      <div className="pointer-events-none">
  <AnimatedBackground />
</div>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage showWelcome={showWelcome} setShowWelcome={setShowWelcome} />} />
          <Route path="/project/:slug" element={<PageTransition><ProjectPageLayout /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/thank-you" element={<PageTransition><Suspense fallback={null}><ThankYouPage /></Suspense></PageTransition>} />
          <Route path="/dashboard/*" element={<PageTransition><ProtectedRoute><Suspense fallback={<div className="min-h-screen" />}><Dashboard /></Suspense></ProtectedRoute></PageTransition>} />
          <Route path="*" element={<PageTransition><Suspense fallback={null}><NotFoundPage /></Suspense></PageTransition>} />
        </Routes>
      </AnimatePresence>
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