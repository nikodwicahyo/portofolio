// Safari and other WebKit builds decode VP9 WebM but not its alpha plane, so
// they get the opaque MP4 fallback (blended with CSS) instead.
// Chromium/Gecko report VP9 via canPlayType and render the alpha layer.
export function supportsAlphaVideo({ userAgent = "", canPlayType = () => "" } = {}) {
  const webm = canPlayType('video/webm; codecs="vp9"');
  if (!webm) return false;
  const webkit = /AppleWebKit/i.test(userAgent)
    && !/(Chrome|Chromium|Edg|OPR|Firefox)\//i.test(userAgent);
  return !webkit;
}

export function detectAlphaVideoSupport() {
  if (typeof document === "undefined" || typeof navigator === "undefined") return false;
  try {
    const el = document.createElement("video");
    return supportsAlphaVideo({
      userAgent: navigator.userAgent,
      canPlayType: (type) => el.canPlayType(type),
    });
  } catch {
    return false;
  }
}

// Two renditions of the same loop: phones get 540px, everything else 1200px.
// Kept as plain data so the picker stays testable without a DOM.
export const HERO_SOURCES = {
  desktop: {
    webm: "/hero-anim.v2.webm",
    mp4: "/hero-fallback.v2.mp4",
    poster: "/hero-poster.v2.webp",
  },
  mobile: {
    webm: "/hero-anim.v2.mobile.webm",
    mp4: "/hero-fallback.v2.mobile.mp4",
    poster: "/hero-poster.v2.mobile.webp",
  },
};

export function pickHeroSources({ smallViewport = false, alphaVideo = false } = {}) {
  const set = smallViewport ? HERO_SOURCES.mobile : HERO_SOURCES.desktop;
  return { video: alphaVideo ? set.webm : set.mp4, poster: set.poster };
}
