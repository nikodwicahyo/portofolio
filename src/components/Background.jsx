const AnimatedBackground = () => {
	return (
		<div className="fixed inset-0 pointer-events-none">
			{/* Radial gradient instead of a 960×960 blurred layer: same glow,
			    no 128px filter pass on every composite. */}
			<div className="absolute inset-0 ambient-glow" />
			<div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
		</div>
	)
}

export default AnimatedBackground
