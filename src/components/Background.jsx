const AnimatedBackground = () => {
	return (
		<div className="fixed inset-0 pointer-events-none">
			<div className="absolute inset-0">
				<div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-[var(--glow)] rounded-full blur-[128px]" />
			</div>
			<div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
		</div>
	)
}

export default AnimatedBackground
