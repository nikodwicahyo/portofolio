import { useState, useCallback, memo } from "react";

const LazyImage = memo(({ src, alt, className = "", wrapperClassName = "", aspectRatio, priority, onLoad: onLoadProp, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const onLoad = useCallback(() => {
    setLoaded(true);
    onLoadProp?.();
  }, [onLoadProp]);

  if (!src) {
    return (
      <div className={`bg-white/5 flex items-center justify-center ${className || 'w-full h-full'} ${wrapperClassName}`}>
        <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/5 flex flex-col items-center justify-center gap-1 ${className || 'w-full h-full'} ${wrapperClassName}`}>
        <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <span className="text-xs text-gray-500">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`} style={aspectRatio ? { aspectRatio } : undefined}>
      {!loaded && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : undefined}
        decoding="async"
        fetchpriority={priority ? "high" : undefined}
        onLoad={onLoad}
        onError={() => setError(true)}
        className={`transition-all duration-500 ${loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'} ${className}`}
        {...props}
      />
    </div>
  );
});

export default LazyImage;
