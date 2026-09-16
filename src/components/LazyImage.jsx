import { useState, useCallback, memo, useEffect } from "react";
import { preconnectSupabase } from "../utils/image";

const LazyImage = memo(({ src, srcSet, sizes, fallbackSrc, alt, className = "", wrapperClassName = "", aspectRatio, priority, onLoad: onLoadProp, onError: onErrorProp, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedFallback, setTriedFallback] = useState(false);

  // ponytail: runtime preconnect — Supabase host comes from env, can't hardcode in index.html
  useEffect(() => { preconnectSupabase(src); }, [src]);

  // Reset if the source changes (e.g. navigating between projects).
  useEffect(() => {
    setCurrentSrc(src);
    setTriedFallback(false);
    setError(false);
    setLoaded(false);
  }, [src]);

  const onLoad = useCallback(() => {
    setLoaded(true);
    onLoadProp?.();
  }, [onLoadProp]);

  // Resilient: if the Supabase render/image transform fails (e.g. Image
  // Transformation disabled → 400), retry once with the original object URL
  // before giving up. This keeps images working on any project config.
  const onError = useCallback(() => {
    if (fallbackSrc && !triedFallback && currentSrc !== fallbackSrc) {
      setTriedFallback(true);
      setCurrentSrc(fallbackSrc);
      return;
    }
    setError(true);
    onErrorProp?.();
  }, [fallbackSrc, triedFallback, currentSrc, onErrorProp]);

  if (!src) {
    return (
      <div className={`bg-soft flex items-center justify-center ${className || 'w-full h-full'} ${wrapperClassName}`}>
        <svg className="w-8 h-8 text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-soft flex flex-col items-center justify-center gap-1 ${className || 'w-full h-full'} ${wrapperClassName}`}>
        <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <span className="text-xs text-muted">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`} style={aspectRatio ? { aspectRatio } : undefined}>
      {!loaded && <div className="absolute inset-0 bg-soft animate-pulse" />}
      <img
        src={currentSrc}
        srcSet={triedFallback ? undefined : srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchpriority={priority ? "high" : "auto"}
        onLoad={onLoad}
        onError={onError}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...props}
      />
    </div>
  );
});
LazyImage.displayName = "LazyImage";

export default LazyImage;
