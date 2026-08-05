/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		fontFamily: {
			sans: ["Inter", "system-ui", "sans-serif"],
		},
		extend: {
			backdropBlur: {
				sm: '4px',
			  },
			colors: {
				bg: 'var(--bg)',
				surface: 'var(--surface)',
				elevated: 'var(--elevated)',
				sidebar: 'var(--sidebar)',
				edge: 'var(--edge)',
				'edge-strong': 'var(--edge-strong)',
				soft: 'var(--soft)',
				'soft-strong': 'var(--soft-strong)',
				primary: 'var(--primary)',
				secondary: 'var(--secondary)',
				muted: 'var(--muted)',
				faint: 'var(--faint)',
				invert: 'var(--invert)',
				'invert-text': 'var(--invert-text)',
				'invert-hover': 'var(--invert-hover)',
				github: 'var(--github)',
				grid: 'var(--grid)',
				glow: 'var(--glow)',
			},
			keyframes: {
				shimmer: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
			},
			animation: {
				shimmer: 'shimmer 1.5s infinite',
			},
		  },
		},
	plugins: [],
}
