import { useEffect, useRef, useState } from "react";

// Cheap visibility gate for below-the-fold data fetches. The observer only
// reports a crossing, so nothing runs during the first-load window (Lighthouse
// never scrolls) and hidden sections never open Supabase sockets.
export default function useInView({ rootMargin = "0px", once = true } = {}) {
	const ref = useRef(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		if (inView) return;
		const el = ref.current;
		if (!el || typeof IntersectionObserver === "undefined") {
			setInView(true);
			return;
		}
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				setInView(true);
				if (once) io.disconnect();
			},
			{ rootMargin, threshold: 0 }
		);
		io.observe(el);
		return () => io.disconnect();
	}, [inView, once, rootMargin]);

	return [ref, inView];
}
