// Section navigation shared by the navbar and the project-detail back button.
// The URL hash is the single source of truth: `/#Portofolio` also mounts the
// deferred Portfolio section when the app returns from another route.
const OFFSET = 100;

export function goToSection(navigate, id, { replace = false } = {}) {
  const hash = `#${id}`;

  // Already on the landing page: scroll in place so the click does not remount
  // the page or add a history entry. The wrapper carries the anchor id even
  // while its deferred section is still a placeholder.
  if (window.location.pathname === "/") {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - OFFSET,
        behavior: "smooth",
      });
      try { window.history.replaceState(window.history.state, "", hash); } catch { /* best-effort */ }
      return;
    }
  }

  navigate({ pathname: "/", hash }, { replace });
}

// Rewrites the current landing-page history entry to the Portfolio section, so
// both the in-page Back button and the browser's Back button return there
// instead of the top of the landing page.
export function rememberPortfolioOrigin() {
  try {
    sessionStorage.setItem("scrollToPortfolio", "true");
    window.history.replaceState(window.history.state, "", "#Portofolio");
  } catch { /* best-effort */ }
}

// Aligns the section named by the URL hash after a route mounts. Runs twice
// because lazy/deferred sections and web fonts move the target after paint.
// Returns the cleanup for use inside a useEffect.
export function scrollToHash(hash) {
  const id = String(hash || "").replace(/^#/, "");
  if (!id) return undefined;

  const align = () => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - OFFSET });
  };
  align();
  const timer = setTimeout(align, 700);
  return () => clearTimeout(timer);
}
