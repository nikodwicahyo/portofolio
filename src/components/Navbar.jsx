import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import useTheme from "../hooks/useTheme";
import { goToSection } from "../utils/navigation";

const navItems = [
    { href: "#Home", label: "Home" },
    { href: "#About", label: "About" },
    { href: "#Portofolio", label: "Portofolio" },
    { href: "#Contact", label: "Contact" },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("Home");
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Project detail belongs to the Portfolio section, but the landing anchors
    // do not exist there, so the scroll spy below can never pick one.
    const onProjectPage = pathname.startsWith("/project");
    const currentSection = onProjectPage ? "Portofolio" : activeSection;
    // Keep anchors meaningful off-landing (middle-click/new tab opens /#id).
    const hrefFor = (hash) => (onProjectPage ? `/${hash}` : hash);
    
    useEffect(() => {
        let rafId = 0;
        // The scroll listener now only toggles the header background. It reads
        // scrollY (no layout) and bails when the value does not change.
        const handleScroll = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = 0;
                const nextScrolled = window.scrollY > 20;
                setScrolled(prev => (prev === nextScrolled ? prev : nextScrolled));
            });
        };

        // Active section by intersection instead of offsetTop reads on every
        // frame. Deferred sections (Portofolio/Contact) mount later, so the
        // mutation observer picks them up once instead of querySelector-ing
        // four nodes per scroll.
        let io;
        const observed = new Set();
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver((entries) => {
                const visible = entries.filter(entry => entry.isIntersecting);
                if (!visible.length) return;
                visible.sort((a, b) =>
                    Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
                );
                setActiveSection(prev => (prev === visible[0].target.id ? prev : visible[0].target.id));
            }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
        }

        let mo;
        const observeSections = () => {
            if (!io) return;
            for (const item of navItems) {
                const section = document.querySelector(item.href);
                if (section && !observed.has(section)) {
                    observed.add(section);
                    io.observe(section);
                }
            }
            // The hero typewriter mutates the DOM forever; stop watching as soon
            // as every section (including the deferred ones) is registered.
            if (observed.size === navItems.length) mo?.disconnect();
        };
        observeSections();

        let moScheduled = false;
        if (typeof MutationObserver !== "undefined") {
            mo = new MutationObserver(() => {
                if (moScheduled) return;
                moScheduled = true;
                requestAnimationFrame(() => {
                    moScheduled = false;
                    observeSections();
                });
            });
            mo.observe(document.body, { childList: true, subtree: true });
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
            io?.disconnect();
            mo?.disconnect();
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const scrollToSection = (e, href) => {
        e.preventDefault();
        goToSection(navigate, href.replace("#", ""));
        setIsOpen(false);
    };

    return (
        <nav
            className={`fixed w-full top-0 z-50 transition-all duration-500 ${
                isOpen
                    ? "bg-bg"
                    : scrolled
                    ? "bg-bg border-b border-edge"
                    : "bg-transparent border-b border-transparent"
            }`}
        >
            <div className="mx-auto px-[5%] sm:px-[5%] lg:px-[10%]">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <a
                            href={hrefFor("#Home")}
                            onClick={(e) => scrollToSection(e, "#Home")}
                            className="flex items-center gap-2 text-lg font-semibold text-primary"
                        >
                            <img src="/logo.v1.webp" alt="Niko Dwicahyo Widiyanto logo" width={32} height={32} className="w-8 h-8 rounded-full" />
                            Niko Dwicahyo Widiyanto
                        </a>
                    </div>
        
                    {/* Right group: nav + theme toggle + mobile menu */}
                    <div className="flex items-center gap-2">
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            {navItems.map((item) => (
                                <a
                                    key={item.label}
                                    href={hrefFor(item.href)}
                                    onClick={(e) => scrollToSection(e, item.href)}
                                    className="group relative px-1 py-2 text-sm font-medium"
                                >
                                    <span
                                        className={`relative z-10 transition-colors duration-300 ${
                                            currentSection === item.href.substring(1)
                                                ? "text-primary font-semibold"
                                                : "text-secondary group-hover:text-primary"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                    <span
                                        className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transform origin-left transition-transform duration-300 ${
                                            currentSection === item.href.substring(1)
                                                ? "scale-x-100"
                                                : "scale-x-0 group-hover:scale-x-100"
                                        }`}
                                    />
                                </a>
                            ))}
                        </nav>

                        {/* Theme Toggle */}
                        <div className="flex-shrink-0">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                                className="p-2 rounded-lg text-secondary hover:text-primary transition-colors duration-300"
                            >
                                {theme === "dark" ? (
                                    <Sun className="w-5 h-5" />
                                ) : (
                                    <Moon className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                aria-label={isOpen ? "Close menu" : "Open menu"}
                                aria-expanded={isOpen}
                                aria-controls="mobile-menu"
                                className={`relative p-2 text-secondary hover:text-primary transition-transform duration-300 ease-in-out transform ${
                                    isOpen ? "rotate-90 scale-125" : "rotate-0 scale-100"
                                }`}
                            >
                                {isOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        
            {/* Mobile Menu */}
            <div
                id="mobile-menu"
                className={`md:hidden transition-all duration-300 ease-in-out ${
                    isOpen
                        ? "max-h-screen opacity-100"
                        : "max-h-0 opacity-0 overflow-hidden"
                }`}
            >
                <div className="px-4 py-6 space-y-4 border-t border-edge">
                    {navItems.map((item, index) => (
                        <a
                            key={item.label}
                            href={hrefFor(item.href)}
                            onClick={(e) => scrollToSection(e, item.href)}
                            className={`block px-4 py-3 text-lg font-medium transition-all duration-300 ease ${
                                currentSection === item.href.substring(1)
                                    ? "text-primary font-semibold"
                                    : "text-secondary hover:text-primary"
                            }`}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                                transform: isOpen ? "translateX(0)" : "translateX(50px)",
                                opacity: isOpen ? 1 : 0,
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
