import { useState, useCallback } from "react";

const applyTheme = (theme) => {
	const root = document.documentElement;
	if (theme === "light") {
		root.classList.add("light");
	} else {
		root.classList.remove("light");
	}
	root.setAttribute("data-theme", theme);
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute("content", theme === "light" ? "#fafafa" : "#09090b");
};

export default function useTheme() {
	const [theme, setTheme] = useState(() =>
		document.documentElement.getAttribute("data-theme") || "dark"
	);

	const toggleTheme = useCallback(() => {
		setTheme((prev) => {
			const next = prev === "dark" ? "light" : "dark";
			applyTheme(next);
			try {
				localStorage.setItem("theme", next);
			} catch { /* localStorage unavailable */ }
			return next;
		});
	}, []);

	return { theme, toggleTheme };
}
