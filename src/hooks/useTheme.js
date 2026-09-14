import { useState, useCallback, useEffect } from "react";

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

const readInitial = () => {
	try {
		return localStorage.getItem("theme")
			|| document.documentElement.getAttribute("data-theme")
			|| "dark";
	} catch {
		return "dark";
	}
};

export default function useTheme() {
	const [theme, setTheme] = useState(readInitial);

	useEffect(() => {
		applyTheme(theme);
		try {
			localStorage.setItem("theme", theme);
		} catch { /* localStorage unavailable */ }
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	}, []);

	return { theme, toggleTheme };
}
